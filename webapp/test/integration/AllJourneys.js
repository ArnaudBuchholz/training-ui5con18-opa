sap.ui.require([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/test/integration/pages/Common",
	"sap/ui/thirdparty/qunit-2",
	"sap/ui/qunit/qunit-junit",
	"sap/ui/qunit/qunit-coverage",
	"sap/ui/demo/todo/test/integration/pages/App",
	"sap/ui/demo/todo/test/integration/pages/List",
	"sap/ui/demo/todo/test/integration/pages/Filters",
	"sap/ui/demo/todo/test/integration/pages/EditDialog"
], function(Opa5, Common) {
	"use strict";

	Opa5.extendConfig({
		arrangements: new Common(),
		autoWait: true,
		viewName: "sap.ui.demo.todo.view.App", // Since we have only one view
		pollingInterval: 50 // Aggressive one to speed up demo
	});

	var sJourney = jQuery.sap.getUriParameters().get("journey");
	var aJourneys = jQuery.sap.sjax({
		type: "GET",
		dataType: "json",
		url: "./AllJourneys.json"
	}).data
	.filter(function(name) {
		return !sJourney || sJourney === name;
	})
	.map(function(name) {
		return "sap/ui/demo/todo/test/integration/" + name;
	});

	sap.ui.require(aJourneys);
});
