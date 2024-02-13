(function () {
  "use strict";

  var oninit = document.currentScript.dataset.oninit;
  var includes = document.currentScript.dataset.includes;
  var onlyIncludes = document.currentScript.dataset.onlyIncludes === "true";

  var relPath = "";
  var pathnames = location.pathname.split('/');
  pathnames.pop(); // page url
  while (pathnames.includes('test')) {
    relPath += "../";
    pathnames.pop();
  }
  if (!relPath) {
    relPath = "./";
  }
  var ui5base = "";
  /* istanbul ignore next */ // Switch for online publishing
  if (location.toString().match(/^https:\/\//)) {
    ui5base = "https://ui5.sap.com/1.120.6/";
  } else {
    ui5base = relPath;
  }

  var parts = [];
  function append (tagName, attributes) {
    parts.push("<", tagName, " ");
    Object.keys(attributes).map(function (name) {
      parts.push(name, "='", attributes[name], "'");
    });
    parts.push("><", "/" + tagName + ">\n");
  }

  if (!onlyIncludes) {
    append("script", {
      id: "sap-ui-bootstrap",
      type: "text/javascript",
      src: ui5base + "resources/sap-ui-core.js",
      "data-sap-ui-theme": "sap_belize",
      "data-sap-ui-libs": "sap.m",
      "data-sap-ui-bindingSyntax": "complex",
      "data-sap-ui-compatVersion": "edge",
      "data-sap-ui-async": "true",
      "data-sap-ui-resourceroots": JSON.stringify({
        "sap.ui.demo.todo": relPath
      }),
      "data-sap-ui-oninit": oninit
    });
  }

  var handlers = {
    ".js": function (include) {
      append("script", { src: ui5base + "resources/" + include });
    },
    ".css": function (include) {
      append("link", { rel: "stylesheet", type: "text/css", href: ui5base + "resources/" + include });
    }
  }
  if (includes) {
    includes
      .split(",")
      .map(function (include) {
        return include.trim();
      })
      .forEach(function (include) {
        handlers[include.match(/\.\w+$/)[0]](include)
      });
    if (includes.match(/qunit(-2)?\.js/)) {
      append("script", { src: "../qunit.autostart.js" });
    }
  }

  document.write(parts.join(""));
}());
