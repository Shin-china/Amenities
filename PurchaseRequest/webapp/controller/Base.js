sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/FilterOperator"
], function(Controller, UIComponent, History, Filter, JSONModel, FilterOperator) {
	"use strict";
	return Controller.extend("MMPurchaseRequest.controller.Base", {
		//return Controller.extend("MM.purchasepricesingleprocess.controller.Base", {
		onInit: function() {

		},

		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function() {
			return UIComponent.getRouterFor(this);
		},

		getI18nBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		getModel: function(sModel) {
			return this.getView().getModel(sModel);
		},

		onNavBack: function() {
			var oHistory, sPreviousHash;

			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("Main");
			}
		},

		compareAscend: function(keyName) {
			return function(objectN, objectM) {
				var valueN = objectN[keyName];
				var valueM = objectM[keyName];
				if (valueN > valueM) {
					return 1;
				} else if (valueN < valueM) {
					return -1;
				} else {
					return 0;
				}
			};
		},

		uniqueArray: function(arr) {
			for (var i = 0; i < arr.length; i++) {
				for (var j = i + 1; j < arr.length; j++) {
					if (arr[i] === arr[j]) {
						arr.splice(j, 1);
						j--;
					}
				}
			}
			return arr;
		},

		getAttachment: function() {
			var that = this;
			var oNewFilter,
				aNewFilters = [];
			var sZbanfn1 = this.getModel("local").getProperty("/Zbanfn");
			var sZbanfn2 = this.getModel("local").getProperty("/ZzHeader/Zbanfn");
			var sZbanfn = "";

			if (sZbanfn2 !== "" || sZbanfn2 !== null) {
				sZbanfn = sZbanfn2;
			} else {
				sZbanfn = sZbanfn1;
			}

			aNewFilters.push(new Filter("Objectid", sap.ui.model.FilterOperator.EQ, sZbanfn));
			aNewFilters.push(new Filter("Objtype", sap.ui.model.FilterOperator.EQ, "01"));

			oNewFilter = new Filter({
				filters: aNewFilters,
				and: true
			});

			var oParam = {
				filters: aNewFilters,
				success: function(oData) {
					var aAtta = [];
					aAtta = oData.results;
					that.getModel("local").setProperty("/ZzAttachment", aAtta);
					that.getModel("local").refresh();
				}.bind(that),
				error: function(oError) {
					var sErrorMessage;
					if (oError.statusCode === "500") {

					}
					try {
						var oJsonMessage = JSON.parse(oError.responseText);
						sErrorMessage = oJsonMessage.error.message.value;
					} catch (e) {
						sErrorMessage = oError.responseText;
					}

				}.bind(that)
			};
			that.getModel("Attachment").read("/UploadSet", oParam);

		}

	});
});