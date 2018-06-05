sap.ui.require([
	"sap/ui/test/opaQunit",
	"sap/ui/demo/todo/test/integration/pages/Filters"
], function(opaTest, filters) {
	"use strict";

	QUnit.module("Search");

	opaTest("should show correct item count after search (1)", function(Given, When, Then) {
		// Arrangements
		Given.iStartTheApp(); // Use the default data set with Learn OpenUI5

		// Actions
		When.onTheAppPage.iEnterTextForSearchAndPressEnter("OpenUI5");

		// Assertions
		Then.onTheFilterButtons.iShouldSeeTheButtonCount(filters.ALL, 1)
			.and.iShouldSeeTheButtonCount(filters.ACTIVE, 1)
			// Don't include the Late test as it will be late in the future
			.and.iShouldSeeTheButtonCount(filters.COMPLETED, 0)
			.and.iTeardownTheApp();
	});

	opaTest("should show correct item count after search (0)", function(Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		// Actions
		When.onTheAppPage.iEnterTextForSearchAndPressEnter("there should not be an item for this search");

		// Assertions
		Then.onTheFilterButtons.iShouldSeeTheButtonCount(filters.ALL, 0)
			.and.iShouldSeeTheButtonCount(filters.ACTIVE, 0)
			.and.iShouldSeeTheButtonCount(filters.LATE, 0)
			.and.iShouldSeeTheButtonCount(filters.COMPLETED, 0)
			.and.iTeardownTheApp();
	});

	opaTest("should show correct item count after search and clearing the search", function(Given, When, Then) {

		// Arrangements
		Given.iStartTheApp();

		// Actions
		When.onTheAppPage.iEnterTextForSearchAndPressEnter("earn")
			.and.iEnterTextForSearchAndPressEnter("");

		// Assertions
		Then.onTheFilterButtons.iShouldSeeTheButtonCount(filters.ALL, 4)
			.and.iShouldSeeTheButtonCount(filters.ACTIVE, 3)
			// Don't include the Late test
			.and.iShouldSeeTheButtonCount(filters.COMPLETED, 1)
			.and.iTeardownTheApp();
	});

});
