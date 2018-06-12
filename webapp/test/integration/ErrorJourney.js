sap.ui.require([
	"sap/ui/test/opaQunit",
	"sap/ui/demo/todo/test/integration/pages/Filters"
], function(opaTest, filters) {
	"use strict";

	var S_NEW_ITEM_TITLE = "my test",
		S_STOP_PROCRASTINATING = "Stop procrastinating";

	QUnit.module("Error");

	opaTest("Error when creating a todo item", function(Given, When, Then) {
		// Arrangements
		Given.iStartTheApp({
			error: "new"
		});

		// Actions
		When.onTheAppPage.iEnterTextForNewItemAndPressEnter(S_NEW_ITEM_TITLE);

		// Assertions
		Then.onTheAppPage.iShouldSeeAnError();

		// Actions
		When.onTheAppPage.iCloseTheError();

		// Assertions
		Then.onTheListOfItems.iShouldNotSeeAnyItemTitled(S_NEW_ITEM_TITLE)
			.and.iTeardownTheApp();
	});

	opaTest("Error when fetching a filter", function(Given, When, Then) {
		// Arrangements
		Given.iStartTheApp({
			error: "filter"
		});

		// Actions

		// Assertions
		Then.onTheFilterButtons.iShouldSeeTheButtonCount(filters.ACTIVE, "-")
			.and.iShouldSeeTheButtonCount(filters.LATE, "-")
			.and.iShouldSeeTheButtonCount(filters.COMPLETED, "-")
			.and.iTeardownTheApp();
	});

	opaTest("Error when completing an item", function(Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		// Actions
		When.onTheListOfItems.iSetTheItemToCompleted(S_STOP_PROCRASTINATING);

		// Assertions
		Then.onTheAppPage.iShouldSeeAnError();

		// Actions
		When.onTheAppPage.iCloseTheError();

		// Assertions
		Then.onTheListOfItems.iShouldSeeTheNewItem(S_STOP_PROCRASTINATING)
			.and.iTeardownTheApp();
	});

});
