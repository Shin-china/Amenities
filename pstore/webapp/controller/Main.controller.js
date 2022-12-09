sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,
	JSONModel) {
        "use strict";

        return Controller.extend("com.shin.pstore.pstore.controller.Main", {
            onInit: function () {
                var that = this;
                var oDataModel = this.getOwnerComponent().getModel();
                oDataModel.read("/AuthSet", {
                   urlParameters: {
                    "$skip": 0,
                    "$top": 1
                   },
                   
                   success: function(oData, oResponse) {
                       var oauthModel = new JSONModel(oData.results[0]);
                       that.getView().setModel(oauthModel, "auth");
                   },
    
                   error: function(oError) {
    
                   }
                });
            }
        });
    });
