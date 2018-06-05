sap.ui.require([
	"sap/ui/test/opaQunit"
], function (opaTest) {
	"use strict";

	var S_NEW_ITEM_TITLE = "my test",
		S_STOP_PROCRASTINATING = "Stop procrastinating";

	QUnit.module("Edit");

	opaTest("Open a new item", function (Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		// Actions
		When.onTheAppPage.iEnterTextForNewItemAndPressEnter(S_NEW_ITEM_TITLE);
		When.onTheListOfItems.iEditTheItem(S_NEW_ITEM_TITLE);

		// Assertions
		Then.onTheEditDialog.iShouldSeeTheDialog(S_NEW_ITEM_TITLE)
			.and.iShouldSeeTheTitleField()
			.and.iShouldSeeTheDueDateField()
			.and.iShouldNotSeeTheCompletionDateField()
			.and.iTeardownTheApp();
	});

	opaTest("Click save without changes", function (Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		// Actions
		When.onTheAppPage.iEnterTextForNewItemAndPressEnter(S_NEW_ITEM_TITLE);
		When.onTheListOfItems.iEditTheItem(S_NEW_ITEM_TITLE);
		When.onTheEditDialog.iClickSave();

		// Assertions
		Then.onTheListOfItems.iShouldSeeTheNewItem(S_NEW_ITEM_TITLE)
			.and.iTeardownTheApp();
	});

	opaTest("Change the title of a new item", function (Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		// Actions
		When.onTheAppPage.iEnterTextForNewItemAndPressEnter(S_NEW_ITEM_TITLE);
		When.onTheListOfItems.iEditTheItem(S_NEW_ITEM_TITLE);
		When.onTheEditDialog.iSetTheTitleTo(S_NEW_ITEM_TITLE + " modified")
			.and.iClickSave();

		// Assertions
		Then.onTheListOfItems.iShouldSeeTheNewItem(S_NEW_ITEM_TITLE + " modified")
			.and.iTeardownTheApp();
	});

	opaTest("Change the title of a new item but close the dialog", function (Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		// Actions
		When.onTheAppPage.iEnterTextForNewItemAndPressEnter(S_NEW_ITEM_TITLE);
		When.onTheListOfItems.iEditTheItem(S_NEW_ITEM_TITLE);
		When.onTheEditDialog.iSetTheTitleTo(S_NEW_ITEM_TITLE + " modified")
			.and.iClickClose();

		// Assertions
		Then.onTheListOfItems.iShouldSeeTheNewItem(S_NEW_ITEM_TITLE)
			.and.iShouldNotSeeAnyItemTitled(S_NEW_ITEM_TITLE + " modified")
			.and.iTeardownTheApp();
	});

	opaTest("Open a completed item", function (Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		// Actions
		When.onTheAppPage.iEnterTextForNewItemAndPressEnter(S_NEW_ITEM_TITLE);
		When.onTheListOfItems.iSetTheItemToCompleted(S_NEW_ITEM_TITLE)
			.and.iEditTheItem(S_NEW_ITEM_TITLE);

		// Assertions
		Then.onTheEditDialog.iShouldSeeTheDialog(S_NEW_ITEM_TITLE)
			.and.iShouldNotSeeTheTitleField()
			.and.iShouldSeeTheDueDateField()
			.and.iShouldSeeTheCompletionDateField()
			.and.iTeardownTheApp();
	});

});
