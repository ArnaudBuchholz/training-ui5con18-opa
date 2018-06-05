sap.ui.define([], function() {
	"use strict";

	return {

		msPerDay: 24 * 60 * 60 * 1000,

		OData: {

			entityNames: {
				todoItemSet: "TodoItemSet",
				appConfigurationSet: "AppConfigurationSet"
			},

			entityProperties: {

				appConfiguration: {
					key: "Key",
					enable: "Enable"
				},

				todoItem: {
					guid: "Guid",
					title: "Title",
					dueDate: "DueDate",
					completed: "Completed",
					completionDate: "CompletionDate"
				}

			},

			functionImports: {

				clearCompleted: {
					name: "ClearCompleted",
					method: "POST",
					returnType: {
						count: "Count"
					}
				}

			}

		}

	};

});
