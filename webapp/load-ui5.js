(function () {
  "use strict";

  var script = document.createElement("script");
  var ui5base = "";
  if (location.toString().startsWith('https://')) {
    ui5base = "https://ui5.sap.com/1.109.0/";
  }
  var attributes = {
    id: "sap-ui-bootstrap",
    type: "text/javascript",
    src: ui5base + "resources/sap-ui-core.js",
    "data-sap-ui-theme": "sap_belize",
    "data-sap-ui-libs": "sap.m",
    "data-sap-ui-bindingSyntax": "complex",
    "data-sap-ui-compatVersion": "edge",
    "data-sap-ui-preload": "async",
    "data-sap-ui-resourceroots": JSON.stringify({
      "sap.ui.demo.todo": "./"
    }),
    "data-sap-ui-oninit": "module:sap/ui/demo/todo/init"
  };
  Object.keys(attributes).forEach(function (name) {
    script.setAttribute(name, attributes[name]);
  });
  document.head.appendChild(script);
}());
