"use strict";

const FACE_PIPS = {
  1: [5], 2: [1, 9], 3: [1, 5, 9],
  4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9]
};

const FACE_ROTATION = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateX(0deg) rotateY(-90deg)",
  3: "rotateX(-90deg) rotateY(0deg)",
  4: "rotateX(90deg) rotateY(0deg)",
  5: "rotateX(0deg) rotateY(90deg)",
  6: "rotateX(0deg) rotateY(180deg)"
};

function makeFace(document, value) {
  const face = document.createElement("span");
  face.className = "fs-die-face";
  for (let index = 1; index <= 9; index += 1) {
    const pip = document.createElement("i");
    pip.className = "fs-die-pip" + (FACE_PIPS[value].includes(index) ? "" : " is-hidden");
    face.appendChild(pip);
  }
  return face;
}

function renderDice(container, values, options = {}) {
  if (!container || !container.ownerDocument) throw new TypeError("a DOM container is required");
  if (!Array.isArray(values) || values.length !== 2 ||
      values.some(value => !Number.isInteger(value) || value < 1 || value > 6)) {
    throw new TypeError("values must contain two dice from 1 to 6");
  }

  const document = container.ownerDocument;
  const stage = document.createElement("div");
  stage.className = "fs-dice-stage";
  stage.setAttribute("role", "img");
  stage.setAttribute("aria-label", "Кости: " + values.join(" и "));

  values.forEach((value, index) => {
    const die = document.createElement("span");
    die.className = "fs-die" + (options.rolling ? " is-rolling" : "");
    die.setAttribute("aria-hidden", "true");
    for (let faceValue = 1; faceValue <= 6; faceValue += 1) {
      die.appendChild(makeFace(document, faceValue));
    }
    die.style.transform = FACE_ROTATION[value];
    die.style.animationDelay = (index * 70) + "ms";
    stage.appendChild(die);
  });

  container.replaceChildren(stage);
  return stage;
}

module.exports = { renderDice };
