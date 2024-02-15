sap.ui.require([
	"sap/ui/demo/todo/test/MockServer",
], function(MockServer) {
	"use strict";

	QUnit.config.reorder = false;

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
		aTests.push("sap/ui/demo/todo/test/unit/test/MockServer");
	}
	sap.ui.require(aTests, function () {
		if (!QUnit.config.autostart) {
			QUnit.start();
		} else {
			console.log('⚠️ because autostart was not prevented, order is not guaranteed. Tests may fail.');
		}
	});
});
