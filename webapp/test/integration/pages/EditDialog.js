sap.ui.require([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/test/integration/pages/Common",
	"sap/ui/test/matchers/Properties",
	"sap/ui/test/actions/Press",
	"sap/ui/test/actions/EnterText"

], function(Opa5, Common, Properties, Press, EnterText) {
	"use strict";

	function _getIShouldSeeTheField(sId, sName) {
		return function() {
			return this.waitFor({
				id: sId,
				success: function() {
					Opa5.assert.ok(true, "The " + sName + " field is displayed");
				},
				errorMessage: "The " + sName + " field is *not* displayed"
			});
		};
	}

	function _getIShouldNotSeeTheField(sId, sName) {
		return function() {
			return this.waitFor({
				autoWait: false,
				visible: false,
				id: sId,
				matchers: [new Properties({
					visible: false
				})],
				success: function() {
					Opa5.assert.ok(true, "The " + sName + " field is *not* displayed");
				},
				errorMessage: "The " + sName + " field is displayed"
			});
		};
	}

	Opa5.createPageObjects({
		onTheEditDialog: {

			baseClass: Common,

			actions: {

				iClickSave: function() {
					return this.waitFor({
						id: "btnOK",
						actions: [new Press()],
						success: function() {
							Opa5.assert.ok(true, "Clicked save in the edit dialog");
						},
						errorMessage: "Unable to click save in the edit dialog"
					});
				},

				iClickClose: function() {
					return this.waitFor({
						id: "btnCancel",
						actions: [new Press()],
						success: function() {
							Opa5.assert.ok(true, "Clicked cancel in the edit dialog");
						},
						errorMessage: "Unable to click cancel in the edit dialog"
					});
				},

				iSetTheTitleTo: function(sTitle) {
					return this.waitFor({
						id: "title",
						actions: [new EnterText({
							text: sTitle
						})],
						success: function() {
							Opa5.assert.ok(true, "The title has been set to '" + sTitle + "'");
						},
						errorMessage: "Unable to set the title"
					});
				}

			},

			assertions: {

				iShouldSeeTheDialog: function(sTitle) {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						matchers: [new Properties({
							title: sTitle
						})],
						success: function() {
							Opa5.assert.ok(true, "The edit dialog is displayed");
						},
						errorMessage: "The edit dialog is not displayed"
					});
				},

				iShouldSeeTheTitleField: _getIShouldSeeTheField("title", "title"),
				iShouldNotSeeTheTitleField: _getIShouldNotSeeTheField("title", "title"),

				iShouldSeeTheDueDateField: _getIShouldSeeTheField("dueDate", "due date"),

				iShouldSeeTheCompletionDateField: _getIShouldSeeTheField("completionDate", "completion date"),
				iShouldNotSeeTheCompletionDateField: _getIShouldNotSeeTheField("completionDate", "completion date")

			}

		}
	});

});
