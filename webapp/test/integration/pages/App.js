sap.ui.require([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/test/integration/pages/Common",
	"sap/ui/test/matchers/AggregationLengthEquals",
	"sap/ui/test/matchers/Properties",
	"sap/ui/test/actions/EnterText",
	"sap/ui/test/actions/Press"

], function (Opa5, Common, AggregationLengthEquals, Properties, EnterText, Press) {
	"use strict";

	var sAddToItemInputId = "addTodoItemInput",
		sSearchTodoItemsInputId = "searchTodoItemsInput",
		sClearCompletedId = "clearCompleted";

	Opa5.createPageObjects({
		onTheAppPage: {
			baseClass: Common,
			actions: {

				iEnterTextForNewItemAndPressEnter: function(sText) {
					return this.waitFor({
						id: sAddToItemInputId,
						actions: [new EnterText({ text: sText })],
						success: function () {
							Opa5.assert.ok(true, "Entered a new item '" + sText + "'");
						},
						errorMessage: "The text cannot be entered"
					});
				},

				iEnterTextForSearchAndPressEnter: function(sText) {
					return this.waitFor({
						id: sSearchTodoItemsInputId,
						actions: [new EnterText({ text: sText })],
						success: function () {
							Opa5.assert.ok(true, "Entered the search text '" + sText + "'");
						},
						errorMessage: "The text cannot be entered"
					});
				},

				iClearTheCompletedItems: function() {
					return this.waitFor({
						id: sClearCompletedId,
						actions: [new Press()],
						success: function () {
							Opa5.assert.ok(true, "Pressed the button 'Clear completed'");
						},
						errorMessage: "The 'Clear completed' button cannot be pressed"
					});
				}

			},

			assertions: {
			}

		}
	});

});
