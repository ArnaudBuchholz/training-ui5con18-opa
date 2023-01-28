QUnit.config.autostart = false;
QUnit.config.reorder = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	sap.ui.require([
		"sap/ui/demo/todo/test/MockServer",
	], function(MockServer) {
		MockServer.init({
			get: function(name) {
				if (name === "randomize") {
					return "100";
				}
				return "";
			}
		});
		var aTests = [
			"sap/ui/demo/todo/test/unit/controller/App.controller"
		];
		if (typeof window.__karma__ === "undefined") {
			aTests.push("sap/ui/demo/todo/test/unit/test/MockServer")
		}
		sap.ui.require(aTests, function () {
			QUnit.start();
		});
	});
});
