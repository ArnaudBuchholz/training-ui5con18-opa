sap.ui.require([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/test/integration/pages/Common",
	"sap/ui/test/matchers/AggregationLengthEquals",
	"sap/ui/test/matchers/Properties",
	"sap/ui/test/actions/EnterText",
	"sap/ui/test/actions/Press",
	"sap/ui/test/matchers/I18NText"

], function(Opa5, Common, AggregationLengthEquals, Properties, EnterText, Press, I18NText) {
	"use strict";

	var sAddToItemInputId = "addTodoItemInput",
		sSearchTodoItemsInputId = "searchTodoItemsInput",
		sClearCompletedId = "clearCompleted";

	function isErrorDialog (oControl) {
		var sIconName = oControl.getIcon();
		return sIconName === "sap-icon://message-error" ||
			sIconName === "sap-icon://error";
	}

	Opa5.createPageObjects({
		onTheAppPage: {
			baseClass: Common,
			actions: {

				iEnterTextForNewItemAndPressEnter: function(sText) {
					return this.waitFor({
						id: sAddToItemInputId,
						actions: [new EnterText({
							text: sText
						})],
						success: function() {
							Opa5.assert.ok(true, "Entered a new item '" + sText + "'");
						},
						errorMessage: "The text cannot be entered"
					});
				},

				iEnterTextForSearchAndPressEnter: function(sText) {
					return this.waitFor({
						id: sSearchTodoItemsInputId,
						actions: [new EnterText({
							text: sText
						})],
						success: function() {
							Opa5.assert.ok(true, "Entered the search text '" + sText + "'");
						},
						errorMessage: "The text cannot be entered"
					});
				},

				iClearTheCompletedItems: function() {
					return this.waitFor({
						id: sClearCompletedId,
						actions: [new Press()],
						success: function() {
							Opa5.assert.ok(true, "Pressed the button 'Clear completed'");
						},
						errorMessage: "The 'Clear completed' button cannot be pressed"
					});
				},

				iCloseTheError: function() {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						matchers: [
							isErrorDialog,
							function(oDialog) {
								return oDialog.getButtons()[0];
							}
						],
						actions: [new Press()],
						success: function() {
							Opa5.assert.ok(true, "Closed the error message");
						},
						errorMessage: "Not able to close the error message"
					});
				}

			},

			assertions: {

				iShouldSeeAnError: function() {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						matchers: [ isErrorDialog ],
						success: function() {
							Opa5.assert.ok(true, "An error message is displayed");
						},
						errorMessage: "No error message is displayed"
					});
				}

			}

		}
	});

});
