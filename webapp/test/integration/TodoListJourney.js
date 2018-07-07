sap.ui.define([
	"sap/ui/test/opaQunit",
	"sap/ui/demo/todo/test/integration/pages/Filters"
], function(opaTest, filters) {
	"use strict";

	QUnit.module("Todo List");

	var S_NEW_ITEM_TITLE = "my test";

	opaTest("should add an item", function(Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		// Actions
		When.onTheAppPage.iEnterTextForNewItemAndPressEnter(S_NEW_ITEM_TITLE);

		Given.iTakeAScreenshot("TodoListJourney.1");

		// Assertions
		Then.onTheListOfItems.iShouldSeeTheNewItem(S_NEW_ITEM_TITLE);
	});

	opaTest("should complete an item", function(Given, When, Then) {
		// Actions
		When.onTheListOfItems.iSetTheItemToCompleted(S_NEW_ITEM_TITLE);

		// Assertions
		Then.onTheListOfItems.iShouldSeeTheCompletedItem(S_NEW_ITEM_TITLE);
	});

	opaTest("should remove completed items", function(Given, When, Then) {
		// Actions
		When.onTheAppPage.iClearTheCompletedItems();

		// Assertions
		Then.onTheListOfItems.iShouldNotSeeAnyItemTitled(S_NEW_ITEM_TITLE)
			.and.iTeardownTheApp();
	});

	opaTest("should allow to set an item back to new", function(Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		// Actions
		When.onTheAppPage.iEnterTextForNewItemAndPressEnter(S_NEW_ITEM_TITLE);
		When.onTheListOfItems.iSetTheItemToCompleted(S_NEW_ITEM_TITLE);
		Then.onTheListOfItems.iShouldSeeTheCompletedItem(S_NEW_ITEM_TITLE);
		When.onTheListOfItems.iSetTheItemToNew(S_NEW_ITEM_TITLE);

		// Assertions
		Then.onTheListOfItems.iShouldSeeTheNewItem(S_NEW_ITEM_TITLE)
			.and.iTeardownTheApp();
	});

	opaTest("should show correct count for completed items", function(Given, When, Then) {
		// Arrangements
		Given.iStartTheApp({
			empty: true
		});

		// Actions
		When.onTheAppPage.iEnterTextForNewItemAndPressEnter(S_NEW_ITEM_TITLE)
			.and.iEnterTextForNewItemAndPressEnter(S_NEW_ITEM_TITLE + " 2")
			.and.iEnterTextForNewItemAndPressEnter(S_NEW_ITEM_TITLE + " 3");
		When.onTheListOfItems.iSetTheItemToCompleted(S_NEW_ITEM_TITLE)
			.and.iSetTheItemToCompleted(S_NEW_ITEM_TITLE + " 3");

		// Assertions
		Then.onTheFilterButtons.iShouldSeeTheButtonCount(filters.COMPLETED, 2)
			.and.iTeardownTheApp();
	});

});
