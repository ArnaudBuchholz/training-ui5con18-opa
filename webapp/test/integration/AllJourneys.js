sap.ui.require([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/test/integration/pages/Common",
	"sap/ui/demo/todo/test/integration/pages/App",
	"sap/ui/demo/todo/test/integration/pages/List",
	"sap/ui/demo/todo/test/integration/pages/Filters",
	"sap/ui/demo/todo/test/integration/pages/EditDialog",
	"sap/ui/demo/todo/test/integration/TodoListJourney",
	"sap/ui/demo/todo/test/integration/SearchJourney",
	"sap/ui/demo/todo/test/integration/FilterJourney",
	"sap/ui/demo/todo/test/integration/ErrorJourney",
	"sap/ui/demo/todo/test/integration/EditJourney"

], function(Opa5, Common) {
	"use strict";

	Opa5.extendConfig({
		arrangements: new Common(),
		autoWait: true,
		viewName: "sap.ui.demo.todo.view.App", // Since we have only one view
		pollingInterval: 50 // Aggressive one to speed up demo
	});

});
