sap.ui.define([
	"sap/ui/core/util/MockServer",
	"sap/ui/demo/todo/const"

], function(MockServer, CONST) {
	"use strict";

	var _lastTodoItemId = 0,
		_oMockServer;

	function _getJSONDateReplacer(dValue) {
		return "/Date(" + dValue.getTime() + ")/";
	}

	function _getNewItemGuid() {
		var sNewId = (++_lastTodoItemId).toString();
		return "0MOCKSVR-TODO-MKII-DYNK-00000000".substr(0, 32 - sNewId.length) + sNewId;
	}

	function _setIfNotSet(oTodoItemSet, sPropertyName, vDefaultValue) {
		if (!oTodoItemSet.hasOwnProperty(sPropertyName)) {
			oTodoItemSet[sPropertyName] = vDefaultValue;
		}
	}

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
				sDateMax = _getJSONDateReplacer(new Date(2099, 11, 31)),
				sDateNow = new Date(),
				sDateNowMinusOneHour = _getJSONDateReplacer(new Date(sDateNow - 60000));
			for (var idx = 0; idx < 100; ++idx) {
				var oNewTodoItemSet = {},
					sGuid = _getNewItemGuid();
				oNewTodoItemSet[CONST.OData.entityProperties.todoItem.guid] = sGuid;
				oNewTodoItemSet[CONST.OData.entityProperties.todoItem.title] = "Random stuff " + idx;
				oNewTodoItemSet.__metadata = {
					id: "/odata/TODO_SRV/TodoItemSet(guid'" + sGuid + "')",
					uri: "/odata/TODO_SRV/TodoItemSet(guid'" + sGuid + "')",
					type: "TODO_SRV.TodoItem"
				}
				if (idx % 2) {
					oNewTodoItemSet[CONST.OData.entityProperties.todoItem.completionDate] = sDateNowMinusOneHour;
					oNewTodoItemSet[CONST.OData.entityProperties.todoItem.completed] = true;
				}
				if (idx % 5 === 0) {
					oNewTodoItemSet[CONST.OData.entityProperties.todoItem.dueDate] = sDateNowMinusOneHour;
				}
				aTodoItemSet.push(oNewTodoItemSet);
			}
			aTodoItemSet.forEach(function(oTodoItemSet) {
				_setIfNotSet(oTodoItemSet, CONST.OData.entityProperties.todoItem.completionDate, null);
				_setIfNotSet(oTodoItemSet, CONST.OData.entityProperties.todoItem.completed, false);
				_setIfNotSet(oTodoItemSet, CONST.OData.entityProperties.todoItem.dueDate, sDateMax);
			});
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
