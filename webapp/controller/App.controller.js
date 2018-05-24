sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/demo/todo/const",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/SegmentedButtonItem",
	 "sap/ui/core/format/DateFormat",
	 "sap/m/MessageBox"

], function(Controller, CONST, JSONModel, Filter, FilterOperator, MessageToast, SegmentedButtonItem, DateFormat, MessageBox) {
	"use strict";

	var MS_PER_DAY = 24 * 60 * 60 * 1000,
		TODOITEM = CONST.OData.entityProperties.todoItem,
		_aFilters = [{
			key: "all",
			get: function () { return []; }
		}, {
			key: "active",
			get: function () { return [new Filter(TODOITEM.completed, FilterOperator.EQ, false)]; }
		}, {
			key: "late",
			get: function () { return [new Filter(TODOITEM.dueDate, FilterOperator.LE, new Date())]; }
		}, {
			key: "completed",
			get: function () { return [new Filter(TODOITEM.completed, FilterOperator.EQ, true)]; }
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

			oBody[TODOITEM.title] = sLabel;
			oBody[TODOITEM.dueDate] = dDueDate;
			oModel.create("/" + CONST.OData.entityNames.todoItemSet, oBody, {
				success: function (oResultBody) {
					MessageToast.show(this._i18n("message.created"));
				}.bind(this)
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
				this.aSearchFilters = [new Filter(TODOITEM.title, FilterOperator.Contains, sQuery)];
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
			var oListItem = oEvent.getParameter("listItem"),
				oDialog = this.getView().byId("todoItem");
			oDialog.setBindingContext(oListItem.getBindingContext());
			oDialog.open();
		},

		_onSelectionChanged: function (oListItem, oData) {
			var oView = this.getView(),
				oModel = oView.getModel();
			if (oModel.hasPendingChanges()) {
				// Either another pending change or something wrong happened
				oData.__batchResponses.forEach(function (oResponse) {
					if (oResponse.response && oResponse.response.statusCode === "400") {
						MessageBox.error(oResponse.response.body, {
							title: this._i18n("message.error")
						});
						oModel.resetChanges([
							oListItem.getBindingContext().getPath()
						]);
					}
				}, this);
			}
			oListItem.setBusy(false);
		},

		onSelectionChange: function (oEvent) {
			var oListItem = oEvent.getParameter("listItems")[0]; // Expect only one item to be changed at a time
			oListItem.setBusy(true);
			this.getView().getModel().submitChanges({
				success: this._onSelectionChanged.bind(this, oListItem)
			});
			this._refreshCounts();
		},

		getIcon: function (oTodoItem) {
			if (new Date() > oTodoItem[TODOITEM.dueDate]) {
				return "sap-icon://lateness";
			}
		},

		getIntro: function (oTodoItem) {
			var dCompletionDate = oTodoItem[TODOITEM.completionDate],
				dDueDate = oTodoItem[TODOITEM.dueDate];
			if (oTodoItem[TODOITEM.completed] && dCompletionDate) {
				return this._i18n("todoItem.intro.completedOn", [_oDateFormatter.format(dCompletionDate)]);

			} else if (new Date() > dDueDate) {
				var iNumberOfDaysLate = Math.ceil((new Date() - dDueDate) / MS_PER_DAY);
				if (1 === iNumberOfDaysLate) {
					return this._i18n("todoItem.intro.lateByYesterday");
				}
				return this._i18n("todoItem.intro.lateDays", [iNumberOfDaysLate]);
			}
		}

	});

});
