import { attachRouteStyles } from "../shared/route-styles.mjs";
import { getSupabaseClient, SUPABASE_URL, SUPABASE_KEY } from "../shared/supabase-client.mjs";


const MARKUP = "\n\n<svg id=\"glass-layer\"></svg>\n\n<div class=\"portal\">\n    <div class=\"logo\">FLOUSTREAM</div>\n    <div class=\"subtitle\">ENTER THE DIGITAL WORLD</div>\n\n    <div class=\"auth-box\">\n        <input id=\"email\" type=\"email\"\n               placeholder=\"Твой Email\">\n\n        <input id=\"password\" type=\"password\"\n               placeholder=\"Пароль (минимум 8 символов)\">\n\n        <input id=\"first-name\" type=\"text\" autocomplete=\"given-name\"\n               placeholder=\"Имя (для регистрации)\" maxlength=\"60\">\n        <input id=\"last-name\" type=\"text\" autocomplete=\"family-name\"\n               placeholder=\"Фамилия (для регистрации)\" maxlength=\"60\">\n        <select id=\"country-code\" aria-label=\"Страна\">\n            <option value=\"\">Выбери страну</option>\n            <option value=\"DE\">Германия</option><option value=\"RU\">Россия</option>\n            <option value=\"UA\">Украина</option><option value=\"BY\">Беларусь</option>\n            <option value=\"KZ\">Казахстан</option><option value=\"NL\">Нидерланды</option>\n            <option value=\"US\">США</option><option value=\"GB\">Великобритания</option>\n            <option value=\"OTHER\">Другая страна</option>\n        </select>\n        <select id=\"preferred-language\" aria-label=\"Язык по умолчанию\">\n            <option value=\"ru\">Русский</option><option value=\"en\">English</option>\n        </select>\n\n        <button id=\"register-button\" disabled>\n            Зарегистрироваться\n        </button>\n\n        <button id=\"login-button\" disabled>\n            Войти\n        </button>\n\n        <button id=\"restore-button\" type=\"button\" disabled>\n            Восстановить аккаунт\n        </button>\n\n        <p id=\"auth-message\">Подключаем систему...</p>\n    </div>\n\n</div>\n\n";
export const stylesheet = new URL("./styles/portal.css?v=1", import.meta.url).href;
export const title = "FLOUSTREAM — Portal";

export async function mount(root, { signal }) {
root.innerHTML = '<section class="fs-route-portal">' + MARKUP + '</section>';
  const style = await attachRouteStyles(root, stylesheet, "portal", signal);
  if (!style) return;

  
let supabaseClient = null;
let registrationInProgress = false;
let registrationCooldownUntil = 0;
let registrationCooldownTimer = null;

function startRegistrationCooldown(seconds, template) {
    if (signal.aborted) return;
    if (registrationCooldownTimer) {
        clearInterval(registrationCooldownTimer);
    }

    const duration = Math.max(1, Math.ceil(seconds));
    registrationCooldownUntil = Date.now() + duration * 1000;
    registerButton.disabled = true;

    const updateCountdown = () => {
        const remaining = Math.max(
            0,
            Math.ceil((registrationCooldownUntil - Date.now()) / 1000)
        );

        if (remaining === 0) {
            clearInterval(registrationCooldownTimer);
            registrationCooldownTimer = null;
            registerButton.disabled = false;
            message.textContent = "Можно зарегистрироваться снова.";
            return;
        }

        message.textContent = template.replace("{seconds}", remaining);
    };

    updateCountdown();
    registrationCooldownTimer = setInterval(updateCountdown, 1000);
}

const message = root.querySelector("#auth-message");
const registerButton = root.querySelector("#register-button");
const loginButton = root.querySelector("#login-button");
const restoreButton = root.querySelector("#restore-button");
const countrySelect = root.querySelector("#country-code");
const languageSelect = root.querySelector("#preferred-language");
countrySelect.addEventListener("change", () => {
    languageSelect.value = ["RU", "BY", "KZ", "KG"].includes(countrySelect.value) ? "ru" : "en";
}, { signal });

function showError(prefix, error) {
    console.error(prefix, error);

    message.textContent =
        prefix + (error && error.message
            ? error.message
            : String(error));
}

/* ЗАГРУЗКА SUPABASE */


async function initializeSupabase() {
    try {
        message.textContent = "Подключаем Supabase...";

        supabaseClient = await getSupabaseClient({ signal });
        if (signal.aborted) return;

        registerButton.disabled = false;
        loginButton.disabled = false;
        restoreButton.disabled = false;

        const params = new URLSearchParams(window.location.search);
        message.textContent = params.has("deletion_requested")
            ? "Аккаунт деактивирован. В течение 30 дней можно восстановить прежний аккаунт через кнопку «Восстановить аккаунт»."
            : "Система готова. Можно продолжать.";

    } catch (error) {
        if (signal.aborted) return;
        showError("Ошибка подключения: ", error);
    }
}

/* РЕГИСТРАЦИЯ */

async function registerUser() {
    if (!supabaseClient) {
        message.textContent = "Supabase ещё не подключён.";
        return;
    }

    if (registrationInProgress || Date.now() < registrationCooldownUntil) {
        return;
    }

    const email =
        root.querySelector("#email").value.trim();

    const password =
        root.querySelector("#password").value;
    const firstName = root.querySelector("#first-name").value.trim();
    const lastName = root.querySelector("#last-name").value.trim();
    const countryCode = root.querySelector("#country-code").value;
    const preferredLanguage = root.querySelector("#preferred-language").value;

    if (!email || !password) {
        message.textContent = "Введи Email и пароль.";
        return;
    }

    if (password.length < 8) {
        message.textContent =
            "Пароль должен содержать минимум 8 символов.";
        return;
    }
    if (!firstName || !lastName || !countryCode) {
        message.textContent = "Укажи имя, фамилию и страну.";
        return;
    }

    registrationInProgress = true;

    try {
        registerButton.disabled = true;
        message.textContent = "Проверяем домен email…";
        const riskResponse = await fetch(SUPABASE_URL + "/functions/v1/registration-risk", {
            method: "POST",
            headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
            body: JSON.stringify({ email })
        });
        if (!riskResponse.ok) throw new Error("Не удалось проверить адрес email.");
        const risk = await riskResponse.json();
        if (!risk.allowed) throw new Error("Временные почтовые адреса не поддерживаются. Используй постоянный email.");
        message.textContent = "Регистрируем…";

        const redirectUrl = new URL(
            "profile.html",
            window.location.href
        ).href;

        const { data, error } =
            await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: redirectUrl,
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        country_code: countryCode,
                        preferred_language: preferredLanguage,
                        display_name: firstName + " " + lastName,
                        registration_risk: risk.risk,
                        registration_risk_reason: risk.reason
                    }
                }
            });

        if (error) {
            if (
                error.status === 429 ||
                error.code === "over_email_send_rate_limit"
            ) {
                const match = String(error.message || "").match(/after\s+(\d+)\s+seconds/i);
                const waitSeconds = match ? Number(match[1]) + 2 : 60;
                startRegistrationCooldown(
                    waitSeconds,
                    "Письмо уже запрашивалось. Повторная попытка через {seconds} сек."
                );
            } else {
                showError("Ошибка регистрации: ", error);
            }
            return;
        }

        if (data.session) {
            message.textContent = "Регистрация успешна!";
            window.location.href = redirectUrl;
        } else {
            startRegistrationCooldown(
                60,
                "Письмо отправлено. Проверь почту. Повторная попытка через {seconds} сек."
            );
        }

    } catch (error) {
        showError("Сбой регистрации: ", error);
    } finally {
        registrationInProgress = false;
        if (Date.now() >= registrationCooldownUntil) {
            registerButton.disabled = false;
        }
    }
}

/* ВХОД */

async function loginUser() {
    if (!supabaseClient) {
        message.textContent = "Supabase ещё не подключён.";
        return;
    }

    const email =
        root.querySelector("#email").value.trim();

    const password =
        root.querySelector("#password").value;

    if (!email || !password) {
        message.textContent = "Введи Email и пароль.";
        return;
    }

    try {
        loginButton.disabled = true;
        message.textContent = "Входим...";

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            showError("Ошибка входа: ", error);
            return;
        }

        // Не уходим со страницы, пока не убедились, что сессия
        // доступна из постоянного хранилища этого браузера.
        const saved = await supabaseClient.auth.getSession();
        if (saved.error) throw saved.error;
        if (!data.session || !saved.data?.session ||
            !window.localStorage.getItem("sb-qhpobdktlbhdqsnajypr-auth-token")) {
            throw new Error(
                "Вход подтверждён, но браузер не сохранил сессию. Разреши этому сайту использование локального хранилища и повтори вход."
            );
        }

        message.textContent = "Вход выполнен! Открываем профиль…";

        window.location.href = new URL(
            "profile.html",
            window.location.href
        ).href;

    } catch (error) {
        showError("Сбой входа: ", error);
    } finally {
        loginButton.disabled = false;
    }
}

async function restoreAccount() {
    const email = root.querySelector("#email").value.trim();
    if (!email) {
        message.textContent = "Введи email, привязанный к прежнему аккаунту.";
        return;
    }
    restoreButton.disabled = true;
    message.textContent = "Если аккаунт с этим адресом ожидает удаления, мы отправим письмо для восстановления.";
    try {
        const redirectTo = new URL("profile.html?restore=1", window.location.href).href;
        const { error } = await supabaseClient.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false, emailRedirectTo: redirectTo }
        });
        if (error) throw error;
        message.textContent = "Если адрес зарегистрирован, письмо отправлено. Открой ссылку на этом устройстве, чтобы восстановить прежний аккаунт.";
    } catch (error) {
        showError("Не удалось отправить письмо: ", error);
    } finally {
        restoreButton.disabled = false;
    }
}

registerButton.addEventListener("click", registerUser, { signal });
loginButton.addEventListener("click", loginUser, { signal });
restoreButton.addEventListener("click", restoreAccount, { signal });

initializeSupabase();

/* ГЕНЕРАТОР РАЗБИТОГО СТЕКЛА */

const glassLayer = root.querySelector("#glass-layer");
const glassTimers = new Set();

const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes) {
    const element = document.createElementNS(SVG_NS, name);

    for (const key in attributes) {
        element.setAttribute(key, attributes[key]);
    }

    return element;
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function makePath(points) {
    return points.map((point, index) =>
        (index === 0 ? "M " : "L ") +
        point.x.toFixed(1) + " " +
        point.y.toFixed(1)
    ).join(" ");
}

function addCrack(group, points, className) {
    group.appendChild(svgElement("path", {
        d: makePath(points),
        class: className
    }));
}

function createGlass(event) {
    const x = event.clientX;
    const y = event.clientY;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const group = svgElement("g", {
        class: "glass-effect"
    });

    glassLayer.appendChild(group);

    const radius = randomBetween(35, 55);
    const shardCount = 12;

    /* Центральная точка удара */

    group.appendChild(svgElement("circle", {
        cx: x,
        cy: y,
        r: 4,
        class: "glass-center"
    }));

    /* Неровные радиальные трещины */

    const rays = [];

    for (let i = 0; i < shardCount; i++) {
        const angle =
            (Math.PI * 2 * i / shardCount) +
            randomBetween(-0.12, 0.12);

        const points = [{
            x: x + Math.cos(angle) * radius,
            y: y + Math.sin(angle) * radius
        }];

        let distance = radius;

        const maxDistance = randomBetween(
            Math.max(width, height) * 0.25,
            Math.max(width, height) * 0.7
        );

        const stepCount = 6;

        for (let j = 1; j <= stepCount; j++) {
            distance += maxDistance / stepCount;

            const bend = randomBetween(-22, 22);
            const a = angle + bend * Math.PI / 180;

            points.push({
                x: x + Math.cos(a) * distance,
                y: y + Math.sin(a) * distance
            });
        }

        rays.push(points);

        addCrack(group, points, "glass-glow");
        addCrack(group, points, "glass-main");

        /* Тонкие ответвления от главной трещины */

        for (let j = 2; j < points.length - 1; j++) {
            if (Math.random() > 0.65) continue;

            const p = points[j];

            const branchAngle =
                angle + randomBetween(-1.1, 1.1);

            const branchLength =
                randomBetween(25, 100);

            const branchPoints = [p];

            let bx = p.x;
            let by = p.y;

            for (let k = 0; k < 3; k++) {
                bx += Math.cos(branchAngle +
                    randomBetween(-0.3, 0.3)) *
                    branchLength / 3;

                by += Math.sin(branchAngle +
                    randomBetween(-0.3, 0.3)) *
                    branchLength / 3;

                branchPoints.push({ x: bx, y: by });
            }

            addCrack(group, branchPoints, "glass-thin");
        }
    }

    /* Соединяем радиальные трещины ломаными линиями,
       формируя грани стеклянных осколков */

    for (let ring = 0; ring < 3; ring++) {
        const ringPoints = [];

        for (let i = 0; i < rays.length; i++) {
            const points = rays[i];

            const index = Math.min(
                ring + 2,
                points.length - 1
            );

            const p = points[index];

            ringPoints.push({
                x: p.x + randomBetween(-18, 18),
                y: p.y + randomBetween(-18, 18)
            });
        }

        for (let i = 0; i < ringPoints.length; i++) {
            const next = (i + 1) % ringPoints.length;

            if (Math.random() > 0.15) {
                addCrack(group, [
                    ringPoints[i],
                    {
                        x: (ringPoints[i].x +
                            ringPoints[next].x) / 2 +
                            randomBetween(-15, 15),

                        y: (ringPoints[i].y +
                            ringPoints[next].y) / 2 +
                            randomBetween(-15, 15)
                    },
                    ringPoints[next]
                ], "glass-thin");
            }
        }
    }

    /* Небольшие треугольные осколки вокруг удара */

    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = randomBetween(45, 150);

        const sx = x + Math.cos(angle) * distance;
        const sy = y + Math.sin(angle) * distance;
        const size = randomBetween(8, 24);

        const polygon = [
            [sx, sy],
            [sx + randomBetween(-size, size),
             sy + randomBetween(-size, size)],
            [sx + randomBetween(-size, size),
             sy + randomBetween(-size, size)]
        ].map(point => point.join(",")).join(" ");

        group.appendChild(svgElement("polygon", {
            points: polygon,
            class: "glass-shard"
        }));
    }

    /* Вспышка в месте удара */

    group.appendChild(svgElement("circle", {
        cx: x,
        cy: y,
        r: 13,
        fill: "none",
        stroke: "white",
        "stroke-width": 2,
        filter: "drop-shadow(0 0 8px #00eaff)"
    }));

    const glassTimer = setTimeout(() => {
        group.remove();
        glassTimers.delete(glassTimer);
    }, 2300);
    glassTimers.add(glassTimer);
}

root.addEventListener("pointerdown", (event) => {
    /* Не запускаем эффект на самих элементах интерфейса */
    if (event.target.closest(
        "input, button, .logo, .subtitle, #auth-message, .music-note, iframe"
    )) {
        return;
    }

    /* Любое свободное место страницы — фон, отступ или промежуток */
    createGlass(event);
}, { signal });



  return async () => {
    if (registrationCooldownTimer) clearInterval(registrationCooldownTimer);
    for (const timer of glassTimers) clearTimeout(timer);
    glassTimers.clear();
style.remove();
    root.replaceChildren();
  };
}
