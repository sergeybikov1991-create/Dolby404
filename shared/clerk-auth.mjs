import {
  beginEmailCodeReverification,
  completeEmailCodeReverification,
} from "./clerk-reverification.mjs";

let clerkLoadPromise = null;

function getFrontendApi(publishableKey) {
  const encoded = publishableKey.split("_").slice(2).join("_");
  if (!encoded) throw new Error("Invalid Clerk publishable key");
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const decoded = atob(padded);
  return decoded.replace(/\$/, "").replace(/^https?:\/\//, "");
}

export async function loadClerk() {
  const publishableKey = window.FLOUSTREAM_CLERK_PUBLISHABLE_KEY || "";
  if (!publishableKey) throw new Error("Clerk publishable key is not configured");
  if (window.Clerk?.loaded) return window.Clerk;

  if (!clerkLoadPromise) {
    clerkLoadPromise = (async () => {
      if (!window.Clerk) {
        const frontendApi = getFrontendApi(publishableKey);
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://" + frontendApi + "/npm/@clerk/clerk-js@6/dist/clerk.browser.js";
          script.async = true;
          script.dataset.clerkPublishableKey = publishableKey;
          script.onload = resolve;
          script.onerror = () => reject(new Error("Unable to load Clerk JavaScript SDK"));
          document.head.appendChild(script);
        });
      }

      if (!window.Clerk) throw new Error("Clerk JavaScript SDK did not initialize");
      if (typeof window.Clerk === "function") {
        const ClerkConstructor = window.Clerk;
        const instance = new ClerkConstructor(publishableKey);
        await instance.load({ standardBrowser: true });
        window.Clerk = instance;
      } else if (!window.Clerk.loaded) {
        await window.Clerk.load({ standardBrowser: true });
      }

      if (!window.Clerk?.loaded) throw new Error("Clerk did not finish loading");
      window.FLOUSTREAM_AUTH_PROVIDER = "clerk";
      return window.Clerk;
    })().catch(error => {
      clerkLoadPromise = null;
      throw error;
    });
  }

  return clerkLoadPromise;
}

function toError(value, fallback = "Authentication request failed") {
  if (value instanceof Error) return value;
  const message = typeof value?.message === "string" ? value.message : fallback;
  return new Error(message);
}

function checkClerkResult(result) {
  if (result?.error) throw toError(result.error);
}

async function finalizeFlow(clerk, flow) {
  if (typeof flow?.finalize === "function") {
    const result = await flow.finalize();
    checkClerkResult(result);
  }
  if (!clerk.session && flow?.createdSessionId && typeof clerk.setActive === "function") {
    await clerk.setActive({ session: flow.createdSessionId });
  }
  if (!clerk.session) throw new Error("Clerk did not activate the new session");
  await clerk.session.getToken({ skipCache: true });
}

function makeUser(clerk, id) {
  const source = clerk.user ?? {};
  const email = source.primaryEmailAddress?.emailAddress ?? "";
  return {
    id,
    email,
    email_confirmed_at: source.primaryEmailAddress?.verification?.status === "verified"
      ? new Date().toISOString()
      : null,
    user_metadata: {
      ...(source.unsafeMetadata ?? {}),
      first_name: source.firstName ?? "",
      last_name: source.lastName ?? "",
      display_name: source.fullName ?? "",
    },
    app_metadata: {},
  };
}

async function getSessionData(clerk, supabase) {
  if (!clerk.session) return null;
  const accessToken = await clerk.session.getToken();
  if (!accessToken) return null;

  const { data: userId, error } = await supabase.rpc("floustream_user_id");
  if (error) throw error;
  if (typeof userId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return null;
  }

  const user = makeUser(clerk, userId);
  const payloadPart = accessToken.split(".")[1];
  let expiresAt = null;
  try {
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized));
    expiresAt = Number.isFinite(payload.exp) ? payload.exp : null;
  } catch (_) {}

  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_at: expiresAt,
    refresh_token: "",
    user,
  };
}

export function createClerkAuthFacade(clerk, supabase) {
  let pendingSignUp = null;
  let pendingSignIn = null;
  let pendingSignInMode = "email_code";

  async function provisionCurrentUser() {
    const { data, error } = await supabase.functions.invoke("clerk-provision-user", {
      body: {},
    });
    if (error) throw error;
    if (!data?.userId) throw new Error("FLOUSTREAM account provisioning did not return a user ID");
    if (clerk.user?.reload) await clerk.user.reload();
    if (clerk.session?.getToken) await clerk.session.getToken({ skipCache: true });
    return data;
  }

  async function getSession() {
    const session = await getSessionData(clerk, supabase);
    return { data: { session }, error: null };
  }

  async function getUser() {
    const session = await getSessionData(clerk, supabase);
    return { data: { user: session?.user ?? null }, error: null };
  }

  async function signUp({ email, password, options = {} }) {
    try {
      const data = options.data ?? {};
      const flow = clerk.client.signUp;
      pendingSignUp = flow;

      if (typeof flow.password === "function") {
        checkClerkResult(await flow.password({
          emailAddress: email,
          password,
          firstName: data.first_name,
          lastName: data.last_name,
          unsafeMetadata: {
            first_name: data.first_name,
            last_name: data.last_name,
            country_code: data.country_code,
            preferred_language: data.preferred_language,
            display_name: data.display_name,
            registration_risk: data.registration_risk,
            registration_risk_reason: data.registration_risk_reason,
            username: data.username,
          },
        }));
      } else {
        checkClerkResult(await flow.create({
          emailAddress: email,
          password,
          firstName: data.first_name,
          lastName: data.last_name,
          unsafeMetadata: {
            first_name: data.first_name,
            last_name: data.last_name,
            country_code: data.country_code,
            preferred_language: data.preferred_language,
            display_name: data.display_name,
            registration_risk: data.registration_risk,
            registration_risk_reason: data.registration_risk_reason,
            username: data.username,
          },
        }));
      }

      if (flow.verifications?.sendEmailCode) {
        checkClerkResult(await flow.verifications.sendEmailCode());
      } else if (flow.prepareEmailAddressVerification) {
        checkClerkResult(await flow.prepareEmailAddressVerification({ strategy: "email_code" }));
      } else {
        throw new Error("Clerk email-code sign-up verification is unavailable");
      }

      return { data: { user: null, session: null, verificationPending: true }, error: null };
    } catch (error) {
      return { data: { user: null, session: null }, error: toError(error) };
    }
  }

  async function verifySignUpEmailCode(code) {
    try {
      if (!pendingSignUp) throw new Error("No pending FLOUSTREAM registration");
      let result;
      if (pendingSignUp.verifications?.verifyEmailCode) {
        result = await pendingSignUp.verifications.verifyEmailCode({ code });
      } else {
        result = await pendingSignUp.attemptEmailAddressVerification({ code });
      }
      checkClerkResult(result);
      if (pendingSignUp.status !== "complete") {
        throw new Error("Email verification is not complete yet");
      }
      await finalizeFlow(clerk, pendingSignUp);
      await provisionCurrentUser();
      pendingSignUp = null;
      return await getSession();
    } catch (error) {
      return { data: { user: null, session: null }, error: toError(error) };
    }
  }

  async function signInWithPassword({ email, password }) {
    try {
      const flow = clerk.client.signIn;
      pendingSignIn = flow;
      pendingSignInMode = "email_code";

      if (typeof flow.password === "function") {
        checkClerkResult(await flow.password({ identifier: email, password }));
      } else {
        checkClerkResult(await flow.create({ identifier: email, password }));
      }

      if (flow.status === "complete") {
        await finalizeFlow(clerk, flow);
        await provisionCurrentUser();
        pendingSignIn = null;
        return await getSession();
      }

      if (flow.status === "needs_client_trust" || flow.status === "needs_second_factor") {
        if (flow.mfa?.sendEmailCode) {
          checkClerkResult(await flow.mfa.sendEmailCode());
          pendingSignInMode = "mfa";
          return { data: { session: null, user: null, verificationPending: true }, error: null };
        }
      }

      throw new Error("Clerk requires another verification step to finish sign-in");
    } catch (error) {
      return { data: { session: null, user: null }, error: toError(error) };
    }
  }

  async function signInWithOtp({ email }) {
    try {
      const flow = clerk.client.signIn;
      pendingSignIn = flow;
      pendingSignInMode = "email_code";
      checkClerkResult(await flow.create({ identifier: email }));
      if (flow.emailCode?.sendCode) {
        checkClerkResult(await flow.emailCode.sendCode());
      } else {
        checkClerkResult(await flow.prepareFirstFactor({ strategy: "email_code" }));
      }
      return { data: { session: null, user: null, verificationPending: true }, error: null };
    } catch (error) {
      return { data: { session: null, user: null }, error: toError(error) };
    }
  }

  async function verifySignInEmailCode(code) {
    try {
      if (!pendingSignIn) throw new Error("No pending FLOUSTREAM sign-in");
      let result;
      if (pendingSignInMode === "mfa" && pendingSignIn.mfa?.verifyEmailCode) {
        result = await pendingSignIn.mfa.verifyEmailCode({ code });
      } else if (pendingSignIn.emailCode?.verifyCode) {
        result = await pendingSignIn.emailCode.verifyCode({ code });
      } else {
        result = await pendingSignIn.attemptFirstFactor({ strategy: "email_code", code });
      }
      checkClerkResult(result);
      if (pendingSignIn.status !== "complete") {
        throw new Error("Email verification is not complete yet");
      }
      await finalizeFlow(clerk, pendingSignIn);
      await provisionCurrentUser();
      pendingSignIn = null;
      return await getSession();
    } catch (error) {
      return { data: { session: null, user: null }, error: toError(error) };
    }
  }

  async function signOut() {
    try {
      await clerk.signOut();
      pendingSignIn = null;
      pendingSignUp = null;
      return { error: null };
    } catch (error) {
      return { error: toError(error) };
    }
  }

  async function updateUser(attributes = {}) {
    try {
      if (attributes.password) {
        await clerk.user.updatePassword({ newPassword: attributes.password });
      }
      if (attributes.firstName || attributes.lastName) {
        await clerk.user.update({
          ...(attributes.firstName ? { firstName: attributes.firstName } : {}),
          ...(attributes.lastName ? { lastName: attributes.lastName } : {}),
        });
      }
      if (attributes.user_metadata) {
        await clerk.user.updateMetadata({ unsafeMetadata: attributes.user_metadata });
      }
      return await getUser();
    } catch (error) {
      return { data: { user: null }, error: toError(error) };
    }
  }

  function onAuthStateChange(callback) {
    const listener = async () => {
      try {
        const result = await getSession();
        callback(result.data.session ? "SIGNED_IN" : "SIGNED_OUT", result.data.session);
      } catch (_) {
        callback("SIGNED_OUT", null);
      }
    };
    const remove = clerk.addListener(listener);
    return {
      data: {
        subscription: {
          unsubscribe() {
            if (typeof remove === "function") remove();
            else if (typeof clerk.removeListener === "function") clerk.removeListener(listener);
          },
        },
      },
    };
  }

  return {
    getSession,
    getUser,
    signUp,
    verifySignUpEmailCode,
    signInWithPassword,
    signInWithOtp,
    verifySignInEmailCode,
    signOut,
    updateUser,
    onAuthStateChange,
    beginEmailCodeReverification: () => beginEmailCodeReverification(clerk),
    completeEmailCodeReverification: (code) => completeEmailCodeReverification(clerk, code),
    provisionCurrentUser,
  };
}
