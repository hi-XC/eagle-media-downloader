const test = require("node:test");
const assert = require("node:assert/strict");

function createElement(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
    textContent: "",
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
