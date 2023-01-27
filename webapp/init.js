sap.ui.require([
  "sap/ui/core/Component",
  "sap/ui/core/ComponentContainer",
  "sap/ui/demo/todo/test/MockServer"
], function(Component, ComponentContainer, MockServer) {
  "use strict";

  if (-1 === location.search.indexOf("no-mock")) {
    MockServer.init(jQuery.sap.getUriParameters());
  }
  sap.ui.component({
    id: "todo",
    name: "sap.ui.demo.todo",
    async: true
  }).then(function(oComponent) {
    new ComponentContainer({
      component: oComponent
    }).placeAt("root");
  });
});
