sap.ui.require([
	"sap/ui/test/opaQunit",
	"sap/ui/demo/todo/test/integration/pages/Filters"
], function (opaTest, filters) {
	"use strict";

	QUnit.module("Filter");

	opaTest("the default filter should be all", function (Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		//Actions

		// Assertions
		Then.onTheFilterButtons.iShouldSeeTheSelectedButton(filters.ALL)
			.and.iTeardownTheApp();
	});

	opaTest("should show correct items when filtering for 'Active' items", function (Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		//Actions
		When.onTheFilterButtons.iClick(filters.ACTIVE);

		// Assertions
		Then.onTheFilterButtons.iShouldSeeTheButtonCount(filters.ACTIVE, 3);
		Then.onTheListOfItems.iShouldSeeAGivenNumberOfItems(3)
			and.iTeardownTheApp();
	});
	//
	// opaTest("should show correct items when filtering for 'Completed' items", function (Given, When, Then) {
	//
	// 	// Arrangements
	// 	Given.iStartTheApp();
	//
	// 	//Actions
	// 	When.onTheAppPage.iFilterForItems("completed");
	//
	// 	// Assertions
	// 	Then.onTheAppPage.iShouldSeeItemCount(1).
	// 		and.iTeardownTheApp();
	// });
	//
	// opaTest("should show correct items when filtering for 'Completed' items and switch back to 'All'", function (Given, When, Then) {
	//
	// 	// Arrangements
	// 	Given.iStartTheApp();
	//
	// 	//Actions
	// 	When.onTheAppPage.iFilterForItems("completed");
	//
	// 	// Assertions
	// 	Then.onTheAppPage.iShouldSeeItemCount(1);
	//
	// 	//Actions
	// 	When.onTheAppPage.iFilterForItems("all");
	//
	// 	// Assertions
	// 	Then.onTheAppPage.iShouldSeeItemCount(2).
	// 		and.iTeardownTheApp();
	// });

});
