sap.ui.define([
	"sap/ui/test/Opa5"
], function(Opa5) {
	"use strict";

	return Opa5.extend("sap.ui.demo.todo.test.integration.pages.Common", {

		iStartTheApp: function(oUrlParams) {
			var aUrlParams = Object.keys(oUrlParams || {}).map(function (sParameterName) {
				return sParameterName + "=" + encodeURIComponent(oUrlParams[sParameterName]);
			});
			aUrlParams.push(location.search.toString().substr(1)); // Also forward OPA parameters
			return this.iStartMyAppInAFrame("../../index.html?" + aUrlParams.join("&"));
		},

		iTeardownTheApp: function() {
			this.iTeardownMyAppFrame();
		}

	});

});
