sap.ui.define([
	"sap/ui/test/opaQunit",
	"sap/ui/demo/todo/test/integration/pages/Filters"
], function(opaTest, filters) {
	"use strict";

	QUnit.module("Filter");

	opaTest("the default filter should be all", function(Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		// Actions

		// Assertions
		Then.onTheFilterButtons.iShouldSeeTheSelectedButton(filters.ALL);
	});

	[{
		label: "All",
		button: filters.ALL,
		expectedCount: 4
	}, {
		label: "Active",
		button: filters.ACTIVE,
		expectedCount: 3
	}, {
		label: "Late",
		button: filters.LATE,
		expectedCount: 2
	}, {
		label: "Completed",
		button: filters.COMPLETED,
		expectedCount: 1

	}].forEach(function(oTestCase) {
		opaTest("should show correct items when filtering for '" + oTestCase.label + "' items", function(Given, When, Then) {
			// Actions
			When.onTheFilterButtons.iClick(oTestCase.button);

			// Assertions
			Then.onTheFilterButtons.iShouldSeeTheButtonCount(oTestCase.button, oTestCase.expectedCount);
			Then.onTheListOfItems.iShouldSeeAGivenNumberOfItems(oTestCase.expectedCount);
		});
	})

	opaTest("should show correct items when filtering for 'Completed' items and switch back to 'All'", function(Given, When, Then) {
		// Actions
		When.onTheFilterButtons.iClick(filters.COMPLETED);

		// Assertions
		Then.onTheListOfItems.iShouldSeeAGivenNumberOfItems(1);

		// Actions
		When.onTheFilterButtons.iClick(filters.ALL);

		// Assertions
		Then.onTheListOfItems.iShouldSeeAGivenNumberOfItems(4)
			.and.iTeardownTheApp( /*force*/ true);
	});

});
