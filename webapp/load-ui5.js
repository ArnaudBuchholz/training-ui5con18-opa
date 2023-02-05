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
  if (location.toString().startsWith('https://')) {
    ui5base = "https://ui5.sap.com/1.110.0/";
  } else {
    ui5base = relPath;
  }

  function write (tagName, attributes) {
    var parts = Object.keys(attributes).map(function (name) {
      return name + "='" + attributes[name] + "'";
    });
    parts.unshift("<", tagName, " ");
    parts.push("><", "/" + tagName + ">\n");
    document.write(parts.join(""));
  }

  if (!onlyIncludes) {
    write("script", {
      id: "sap-ui-bootstrap",
      type: "text/javascript",
      src: ui5base + "resources/sap-ui-core.js",
      "data-sap-ui-theme": "sap_belize",
      "data-sap-ui-libs": "sap.m",
      "data-sap-ui-bindingSyntax": "complex",
      "data-sap-ui-compatVersion": "edge",
      "data-sap-ui-preload": "async",
      "data-sap-ui-resourceroots": JSON.stringify({
        "sap.ui.demo.todo": relPath
      }),
      "data-sap-ui-oninit": oninit
    });
  }

  var handlers = {
    ".js": function (include) {
      write("script", { src: ui5base + "resources/" + include });
    },
    ".css": function (include) {
      write("link", { rel: "stylesheet", type: "text/css", href: ui5base + "resources/" + include });
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
  }
}());
