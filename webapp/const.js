sap.ui.define([], function () {
	"use strict";

	return {

		OData: {

			entityNames: {
				todoItemSet: "TodoItemSet",
				appConfigurationSet: "AppConfigurationSet"
			},

			entityProperties: {

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
