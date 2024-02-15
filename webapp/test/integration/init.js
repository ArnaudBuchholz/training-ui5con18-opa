sap.ui.require([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/test/integration/pages/Common",
	"sap/ui/demo/todo/test/integration/pages/App",
	"sap/ui/demo/todo/test/integration/pages/List",
	"sap/ui/demo/todo/test/integration/pages/Filters",
	"sap/ui/demo/todo/test/integration/pages/EditDialog"
], function(Opa5, Common) {
	"use strict";

	QUnit.config.hidepassed = true;

	Opa5.extendConfig({
		arrangements: new Common(),
		autoWait: true,
		viewName: "sap.ui.demo.todo.view.App", // Since we have only one view
		timeout: 15,
		debugTimeout: 15,
		pollingInterval: 250 // Aggressive one to speed up demo
	});

	var sJourney = jQuery.sap.getUriParameters().get("journey");
	var aJourneys = jQuery.sap.sjax({
		type: "GET",
		dataType: "json",
		url: "./AllJourneys.json"
	}).data
		.filter(function(name) {
			return !sJourney || sJourney === name;
		});

	if (aJourneys.length === 1) {
		document.title = document.title += " (" + aJourneys[0] + ")";
	}

	sap.ui.require(aJourneys.map(function(name) {
		return "sap/ui/demo/todo/test/integration/" + name;
	}), function () {
		QUnit.config.testTimeout = 300 * 1000;
		if (!QUnit.config.autostart) {
			QUnit.start();
		}
	});
});
