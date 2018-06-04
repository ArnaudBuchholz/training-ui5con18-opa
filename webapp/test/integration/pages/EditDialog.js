sap.ui.require([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/test/integration/pages/Common",
	"sap/ui/test/matchers/Properties",
	"sap/ui/test/actions/Press",
	"sap/ui/test/actions/EnterText"

], function (Opa5, Common, Properties, Press, EnterText) {
	"use strict";

	Opa5.createPageObjects({
		onTheEditDialog: {

			baseClass: Common,

			actions: {

			},

			assertions: {

			}

		}
	});

});
