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

		//Actions
		When.onTheAppPage.iEnterTextForNewItemAndPressEnter(S_NEW_ITEM_TITLE);
		When.onTheListOfItems.iEditTheItem(S_NEW_ITEM_TITLE);

	});

});
