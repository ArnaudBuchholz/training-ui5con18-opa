sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/test/integration/pages/Common",
	"sap/ui/test/matchers/I18NText",
	"sap/ui/test/matchers/Properties",
	"sap/ui/test/actions/Press"

], function (Opa5, Common, I18NText, Properties, Press) {
	"use strict";

	var _ALL = "all",
		_ACTIVE = "active",
		_LATE = "late",
		_COMPLETED = "completed";

	Opa5.createPageObjects({
		onTheFilterButtons: {

			baseClass: Common,

			actions: {

				iClick: function (sFilterButtonCode) {
					return this.waitFor({
						viewName: "", // Since the buttons are created dynamically
						id: "filterButton-" + sFilterButtonCode,
						actions: [new Press()],
						success: function () {
							Opa5.assert.ok(true, "Clicked the filter button '" + sFilterButtonCode + "'");
						},
						errorMessage: "Not able to click the filter button '" + sFilterButtonCode + "'"
					});
				}

			},

			assertions: {

				iShouldSeeTheSelectedButton: function (sFilterButtonCode) {
					return this.waitFor({
						id: "filters",
						matchers: [new Properties({
							selectedKey: sFilterButtonCode
						})],
						success: function () {
							Opa5.assert.ok(true, "The filter button '" + sFilterButtonCode + "' is the selected one");
						},
						errorMessage: "The filter button '" + sFilterButtonCode + "' is not selected"
					});

				},

				iShouldSeeTheButtonCount: function (sFilterButtonCode, iCount) {
					return this.waitFor({
						viewName: "", // Since the buttons are created dynamically
						id: "filterButton-" + sFilterButtonCode,
						matchers: [new I18NText({
							propertyName: "text",
							key: "filterButton." + sFilterButtonCode,
							parameters: [iCount]
						})],
						success: function () {
							Opa5.assert.ok(true, "The filter button '" + sFilterButtonCode + "' shows the the record count " + iCount);
						},
						errorMessage: "The filter button '" + sFilterButtonCode + "' does not show the record count " + iCount
					});
				}

			}

		}
	});

	return {
		ALL: _ALL,
		ACTIVE: _ACTIVE,
		LATE: _LATE,
		COMPLETED: _COMPLETED
	};

});
