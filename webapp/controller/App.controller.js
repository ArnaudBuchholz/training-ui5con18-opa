sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/demo/todo/const",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/SegmentedButtonItem",
	 "sap/ui/core/format/DateFormat"

], function(Controller, CONST, JSONModel, Filter, FilterOperator, MessageToast, SegmentedButtonItem, DateFormat) {
	"use strict";

	var MS_PER_DAY = 24 * 60 * 60 * 1000,
		_aFilters = [{
			key: "all",
			get: function () {
				return [];
			}
		}, {
			key: "active",
			get: function () {
				return [new Filter(CONST.OData.entityProperties.todoItem.completed, FilterOperator.EQ, false)];
			}
		}, {
			key: "late",
			get: function () {
				return [new Filter(CONST.OData.entityProperties.todoItem.dueDate, FilterOperator.LE, new Date())];
			}
		}, {
			key: "completed",
			get: function () {
				return [new Filter(CONST.OData.entityProperties.todoItem.completed, FilterOperator.EQ, true)];
			}
		}],
		_oDateFormatter = DateFormat.getDateTimeInstance();

	return Controller.extend("sap.ui.demo.todo.controller.App", {

		aSearchFilters: [],
		aTabFilters: [],

		onInit: function() {
			var mCounts = {},
				oSegmentedButton = this.getView().byId("filters");
			_aFilters.forEach(function (oFilter) {
				var sKey = oFilter.key;
				mCounts[sKey] = 0;
				oSegmentedButton.addItem(new SegmentedButtonItem({
					id: "filterButton-" +  sKey,
					text: "{ parts: [ 'i18n>filterButton." + sKey + "', 'counts>/" + sKey + "' ], formatter: 'jQuery.sap.formatMessage' }",
					key: sKey
				}));
			});
			this.getView().setModel(new JSONModel(mCounts), "counts");
			var oI18nResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			this._i18n = oI18nResourceBundle.getText.bind(oI18nResourceBundle);
			this._refresh();
		},

		_refresh: function () {
			this._applyListFilters();
			this._refreshCounts();
		},

		_refreshCounts: function () {
			var oCountsModel = this.getView().getModel("counts"),
				oODataModel = this.getView().getModel();
			_aFilters.forEach(function (oFilter) {
				oODataModel.read("/" + CONST.OData.entityNames.todoItemSet, {
					filters: oFilter.get(),
					urlParameters: {
						$skip: 0,
						$top: 1,
						$inlinecount: "allpages"
					},
					success: function (oResult) {
						oCountsModel.setProperty("/" + oFilter.key, oResult.__count || 0);
					}
				});
			});
		},

		addTodo: function() {
			var oView = this.getView(),
				sLabel = oView.byId("addTodoItemInput").getValue(),
				oModel = oView.getModel(),
				oBody = {},
				dDueDate = new Date();
			dDueDate.setHours(23,59,59,999);

			if (!sLabel) {
				return;
			}

			oBody[CONST.OData.entityProperties.todoItem.title] = sLabel;
			oBody[CONST.OData.entityProperties.todoItem.dueDate] = dDueDate;
			oModel.create("/" + CONST.OData.entityNames.todoItemSet, oBody, {
				success: function (oResultBody) {
					MessageToast.show("SUCCESS");
				}
			});
			this._refresh(); // Done in the same roundtrip
		},

		clearCompleted: function() {
			this.getView().getModel().callFunction("/" + CONST.OData.functionImports.clearCompleted.name, {
				method: CONST.OData.functionImports.clearCompleted.method,
				success: function (oResult) {
					var iCount = oResult[CONST.OData.functionImports.clearCompleted.name][CONST.OData.functionImports.clearCompleted.returnType.count],
						sMessageKey = ["none", "one"][iCount] || "many";
					MessageToast.show(this._i18n("message.clearedCompleted." + sMessageKey, [iCount]));
				}.bind(this)
			});
			this._refresh();
		},

		onSearch: function(oEvent) {
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				this.aSearchFilters = [new Filter(CONST.OData.entityProperties.todoItem.title, FilterOperator.Contains, sQuery)];
			} else {
				delete this.aSearchFilters;
			}
			this._applyListFilters();
		},

		onFilter: function(oEvent) {
			delete this.aTabFilters;
			var sFilterKey = oEvent.getParameter("key");
			_aFilters.every(function (oFilter) {
				if (sFilterKey === oFilter.key) {
					this.aTabFilters = oFilter.get();
					return false;
				}
				return true;
			}, this);
			this._applyListFilters();
		},

		_applyListFilters: function() {
			this.byId("todoList").getBinding("items").filter(this.aSearchFilters.concat(this.aTabFilters), "todos");
		},

		onItemPress: function (oEvent) {
			var oListItem = oEvent.getParameter("listItem");
			alert(oListItem.getBindingContext().getPath());
		},

		onSelectionChange: function (oEvent) {
			var oModel = this.getView().getModel(),
				aListItems = oEvent.getParameter("listItems");
			aListItems.forEach(function (oListItem) {
				oListItem.setBusy(true);
			});
			oModel.submitChanges({
				success: function () {
					aListItems.forEach(function (oListItem) {
						oListItem.setBusy(false);
					});
				}
			});
			this._refreshCounts();
		},

		getIcon: function (oTodoItem) {
			if (new Date() > oTodoItem[CONST.OData.entityProperties.todoItem.dueDate]) {
				return "sap-icon://lateness";
			}
		},

		getIntro: function (oTodoItem) {
			if (oTodoItem[CONST.OData.entityProperties.todoItem.completed]) {
				return this._i18n("todoItem.intro.completedOn", [
					_oDateFormatter.format(oTodoItem[CONST.OData.entityProperties.todoItem.completionDate])
				]);

			} else if (new Date() > oTodoItem[CONST.OData.entityProperties.todoItem.dueDate]) {
				var iNumberOfDaysLate = Math.ceil((new Date() - oTodoItem[CONST.OData.entityProperties.todoItem.dueDate]) / MS_PER_DAY);
				if (1 === iNumberOfDaysLate) {
					return this._i18n("todoItem.intro.lateByYesterday");
				} else {
					return this._i18n("todoItem.intro.lateDays", [iNumberOfDaysLate]);
				}
			}
		}

	});

});
