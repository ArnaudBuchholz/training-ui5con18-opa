sap.ui.define([
	"sap/ui/test/opaQunit"
], function(opaTest) {
	"use strict";

	var S_NEW_ITEM_TITLE = "my test",
		S_MODIFIED_ITEM_TITLE = "my modified test";

	QUnit.module("Edit");

	opaTest("Open a new item", function(Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		// Actions
		When.onTheAppPage.iEnterTextForNewItemAndPressEnter(S_NEW_ITEM_TITLE);
		When.onTheListOfItems.iEditTheItem(S_NEW_ITEM_TITLE);

		// Assertions
		Then.onTheEditDialog.iShouldSeeTheDialog(S_NEW_ITEM_TITLE)
			.and.iShouldSeeTheTitleField()
			.and.iShouldSeeTheDueDateField()
			.and.iShouldNotSeeTheCompletionDateField();

		When.onTheEditDialog.iClickClose();
	});

	opaTest("Click save without changes", function(Given, When, Then) {
		// Actions
		When.onTheListOfItems.iEditTheItem(S_NEW_ITEM_TITLE);
		When.onTheEditDialog.iClickSave();

		// Assertions
		Then.onTheListOfItems.iShouldSeeTheNewItem(S_NEW_ITEM_TITLE);
	});

	opaTest("Change the title of a new item", function(Given, When, Then) {
		// Actions
		When.onTheListOfItems.iEditTheItem(S_NEW_ITEM_TITLE);
		When.onTheEditDialog.iSetTheTitleTo(S_MODIFIED_ITEM_TITLE)
			.and.iClickSave();

		// Assertions
		Then.onTheListOfItems.iShouldSeeTheNewItem(S_MODIFIED_ITEM_TITLE);
	});

	opaTest("Change the title of a new item but close the dialog", function(Given, When, Then) {
		// Actions
		When.onTheListOfItems.iEditTheItem(S_MODIFIED_ITEM_TITLE);
		When.onTheEditDialog.iSetTheTitleTo(S_MODIFIED_ITEM_TITLE + " again")
			.and.iClickClose();

		// Assertions
		Then.onTheListOfItems.iShouldSeeTheNewItem(S_MODIFIED_ITEM_TITLE)
			.and.iShouldNotSeeAnyItemTitled(S_MODIFIED_ITEM_TITLE + " again");
	});

	opaTest("Open a completed item", function(Given, When, Then) {
		// Actions
		When.onTheListOfItems.iSetTheItemToCompleted(S_MODIFIED_ITEM_TITLE)
			.and.iEditTheItem(S_MODIFIED_ITEM_TITLE);

		// Assertions
		Then.onTheEditDialog.iShouldSeeTheDialog(S_MODIFIED_ITEM_TITLE)
			.and.iShouldNotSeeTheTitleField()
			.and.iShouldSeeTheDueDateField()
			.and.iShouldSeeTheCompletionDateField()
			.and.iTeardownTheApp();
	});

});
