sap.ui.define([
	"sap/ui/core/util/MockServer",
	"sap/ui/demo/todo/const",
	"./newItem"

], function(MockServer, CONST, getNewItem) {
	"use strict";

	var _oMockServer;

	return {

		init: function(oParameters) {
			var sJsonFilesUrl = jQuery.sap.getModulePath("sap/ui/demo/todo/model"),
				sManifestUrl = jQuery.sap.getModulePath("sap/ui/demo/todo/manifest", ".json"),
				oManifest = jQuery.sap.syncGetJSON(sManifestUrl).data,
				oMainDataSource = oManifest["sap.app"].dataSources.mainService,
				// ensure there is a trailing slash
				sMockServerUrl = /.*\/$/.test(oMainDataSource.uri) ? oMainDataSource.uri : oMainDataSource.uri + "/",
				sMetadataUrl = jQuery.sap.getModulePath("sap/ui/demo/todo/model/metadata", ".xml");

			// init the inner mockserver
			_oMockServer = new MockServer({
				rootUri: sMockServerUrl
			});

			// configure mock server with a delay of 1s
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: (oParameters.get("serverDelay") || 0)
			});

			// load local mock data
			_oMockServer.simulate(sMetadataUrl, {
				sMockdataBaseUrl: sJsonFilesUrl
			});

			// Generate random items
			var aTodoItemSet = _oMockServer.getEntitySetData(CONST.OData.entityNames.todoItemSet),
				dtMax = new Date(2099, 11, 31),
				dtNow = new Date(),
				dtNowMinusOneHour = new Date(dtNow - 60000);
			for (var idx = 0; idx < 100; ++idx) {
				var sItemTitle = "Random stuff " + idx;
				var dtItemDueDate;
				if (idx % 5 === 0) {
					dtItemDueDate = dtNowMinusOneHour;
				} else {
					dtItemDueDate = dtMax;
				}
				if (idx % 2) {
					aTodoItemSet.push(getNewItem(sItemTitle, dtItemDueDate, dtNowMinusOneHour));
				} else {
					aTodoItemSet.push(getNewItem(sItemTitle, dtItemDueDate));
				}
			}
			_oMockServer.setEntitySetData(CONST.OData.entityNames.todoItemSet, aTodoItemSet);

			_oMockServer.start();
		},

		shutdown: function() {
			_oMockServer.stop();
			_oMockServer = null;
		},

		getMockServer: function() {
			return _oMockServer;
		}

	};

});
