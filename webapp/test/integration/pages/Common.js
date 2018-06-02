sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/test/MockServer"
], function(Opa5, MockServer) {
	"use strict";

	var bInOpaPage = location.toString().indexOf("opaTests.qunit.html") !== -1 &&
						jQuery.sap.getUriParameters().get("component") !== "true";

	function _wrapParameters (oParameters) {
		return {
			get: function (name) {
				return (oParameters[name] || "").toString();
			}
		};
	}

	return Opa5.extend("sap.ui.demo.todo.test.integration.pages.Common", {

		iStartTheApp: function(oParameters) {
			if (bInOpaPage) {
				var aUrlParams = Object.keys(oParameters || {}).map(function (sParameterName) {
					return sParameterName + "=" + encodeURIComponent(oParameters[sParameterName]);
				});
				aUrlParams.push(location.search.toString().substr(1)); // Also forward OPA parameters
				this.iStartMyAppInAFrame("../../index.html?" + aUrlParams.join("&"));

			} else {
				MockServer.init(_wrapParameters(oParameters || {}));
				this.iStartMyUIComponent({
					componentConfig: {
						name: "sap.ui.demo.todo",
						async: true
					}
				});
			}
		},

		iTeardownTheApp: function() {
			if (bInOpaPage) {
				this.iTeardownMyAppFrame();
			} else {
				this.iTeardownMyUIComponent();
			}
		}

	});

});
