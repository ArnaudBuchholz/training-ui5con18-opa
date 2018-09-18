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

		iTakeAScreenshot: function (sScreenshotID) {
			var done = false;
			this.waitFor({
				success: function () {
					var oWindow,
						oAppRoot = document.querySelector(".sapUiComponentContainer"),
						oPromise;
					if (oAppRoot) {
						oWindow = window;
					} else {
						oWindow = sap.ui.test.Opa5.getWindow();
						oAppRoot = oWindow.document.body;
					}
					if (!oWindow.html2canvas) {
						QUnit.push(false, "", "", "Unable to take a screenshot (html2canvas not detected)");
						done = true;
						return;
					}
					// Patch HTML to maximize html2canvas (remove use of display: -webkit-box)
					[].slice.call(oWindow.document.querySelectorAll(".sapMObjLTopRow")).forEach(function (oSapMObjLTopRow) {
						[].slice.call(oSapMObjLTopRow.querySelectorAll("div")).forEach(function (oDiv) {
							if (oDiv.getAttribute("style")) {
								oDiv.removeAttribute("style");
								var oSpan = oDiv.querySelector(".sapMTextLineClamp");
								oSpan.removeAttribute("style");
								oSpan.className = oSpan.className
									.split(" ")
									.filter(function (sName) {
										return sName !== "sapMTextLineClamp";
									})
									.join(" ");
							}
						});
					});
					oWindow.html2canvas(oAppRoot)
						.then(function (canvas) {
							var sDataUrl = canvas.toDataURL('image/png');
							return new Promise(function (resolve) {
								resemble(sDataUrl)
				    				.compareTo("/test-resources/" + sScreenshotID + ".png")
									.onComplete(function(resembleOutput) {
										resolve({
											source: sDataUrl,
											result: resembleOutput
										});
									});
							});
						})
						.then(function (report) {
							var PERCENTAGE_TRESHHOLD = 0.001,
								sKey = sScreenshotID + "-" + (new Date()).getTime(),
								bSucceeded = !report.result.error && report.result.rawMisMatchPercentage < PERCENTAGE_TRESHHOLD,
								aHtml;
							QUnit.push(
								bSucceeded,
								"Mistmatch percentage: " + report.result.rawMisMatchPercentage,
								"Mistmatch percentage: < " + PERCENTAGE_TRESHHOLD,
								sKey
							);
							console.log(sScreenshotID, report);
							function img (sType, sSrc) {
								var sId = sScreenshotID + "." + sType;
								return "<img id=\"" + sId + "\" title=\"" + sId + "\" style=\"max-width: 80%\" src=\"" + sSrc + "\">";
							}
							aHtml = [
								"<table>",
									"<tr>",
										"<td>", img("actual", report.source), "</td>",
										"<td>", img("reference", "/test-resources/" + sScreenshotID + ".png"), "</td>",
										"<td>", img("diff", !report.result.error ? report.result.getImageDataUrl() : "" ), "</td>",
									"</tr>",
								"</table>"
							];
							$("span.test-message:contains(" + sKey + ")").html(aHtml.join(""));
						} , function (reason) {
							QUnit.push(
								/*result*/ false,
								/*actual*/ reason.toString(),
								/*expected*/ "",
								/*message*/ "Unable to take a screenshot"
							);
						}).then(function () {
							done = true;
						});
				}
			});
			return this.waitFor({
				check: function () {
					return done;
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
