sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/test/MockServer"
], function(Opa5, MockServer) {
	"use strict";

	var bInOpaPage = location.toString().indexOf("opaTests.qunit.html") !== -1 &&
		jQuery.sap.getUriParameters().get("component") !== "true";

	function _wrapParameters(oParameters) {
		return {
			get: function(name) {
				return (oParameters[name] || "").toString();
			}
		};
	}

	return Opa5.extend("sap.ui.demo.todo.test.integration.pages.Common", {

		iStartTheApp: function(oParameters) {
			if (bInOpaPage) {
				var aUrlParams = Object.keys(oParameters || {}).map(function(sParameterName) {
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

		iTakeAScreenshot: function () {
			return this.waitFor({
				success: function () {
					var generated = false,
						oComponent = document.querySelector(".sapUiComponentContainer");
					if (!oComponent) {
						oComponent = sap.ui.test.Opa5.getWindow().document.body;
					}
					html2canvas(oComponent).then(function (canvas) {
						var sDataUrl = canvas.toDataURL('image/png');
						QUnit.push(
							/*result*/ true,
							/*actual*/ "actual",
							/*expected*/ "expected",
							/*message*/ "SCREENSHOT"
						);
						debugger;
						var qUnitMessage = $("span.test-message:contains(SCREENSHOT)");
						qUnitMessage.html("<img style=\"max-width: 50%\" src=\"" + sDataUrl + "\">");
						generated = true;
					});
					return this.waitFor({
						check: function () {
							return generated;
						},
						success: function () {
						}
					})
				}
			});
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
