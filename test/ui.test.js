const test = require("node:test");
const assert = require("node:assert/strict");

function createElement(initialClasses = []) {
  const classes = new Set(initialClasses);
  const attributes = new Map();
  return {
    textContent: "",
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name); },
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); },
      toggle(name, force) {
        const shouldAdd = force === undefined ? !classes.has(name) : force;
        if (shouldAdd) classes.add(name);
        else classes.delete(name);
      },
    },
  };
}

test("hides the settings back button whenever the main view is shown", () => {
  const elements = {
    mainContainer: createElement(["hidden"]),
    depsBackBtn: createElement(["hidden"]),
    depsNotice: createElement(["hidden"]),
    appLogo: createElement(),
    depsEntryBtn: createElement(),
    appName: createElement(),
  };

  global.document = {
    getElementById(id) { return elements[id] || null; },
  };
  global.i18next = {
    t(key) { return key; },
  };

  const ui = require("../js/ui");

  ui.setDepsGating(false);
  assert.equal(elements.depsBackBtn.classList.contains("hidden"), false);

  ui.showMainUI();
  assert.equal(elements.depsBackBtn.classList.contains("hidden"), true);
  assert.equal(elements.appLogo.classList.contains("hidden"), false);
  assert.equal(elements.depsEntryBtn.classList.contains("hidden"), false);
});

test("applies Eagle's light theme to the document", () => {
  const html = createElement();
  global.document = {
    querySelector(selector) { return selector === "html" ? html : null; },
  };
  global.eagle = {
    app: {
      theme: "LIGHT",
      platform: "win32",
      isDarkColors() { return false; },
    },
  };

  const ui = require("../js/ui");
  ui.updateTheme();

  assert.equal(html.getAttribute("theme"), "light");
  assert.equal(html.getAttribute("platform"), "win32");
});

test("shows the current plugin version in settings", () => {
  const version = createElement();
  global.document = {
    getElementById(id) { return id === "pluginVersion" ? version : null; },
  };
  global.i18next = {
    t(key, values) { return key === "deps.pluginVersion" ? `Version ${values.version}` : key; },
  };

  const ui = require("../js/ui");
  ui.setPluginVersion("0.2.2");

  assert.equal(version.textContent, "Version 0.2.2");
});
