sap.ui.define([
    "FICO/dailybalanceapproval/controller/BaseController",
    "sap/m/MessageToast",
	"sap/ui/Device",
	"sap/base/Log",
    "sap/ui/model/Filter",
    "sap/ui/core/Element"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, MessageToast, Device, Log, Filter, Element) {
        "use strict";

        return BaseController.extend("FICO.dailybalanceapproval.controller.Main", {
            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
			    this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

                this.oRouter = this.getOwnerComponent().getRouter();
                // this.oRouter.attachRouteMatched(this.onRouteMatched, this);
                this.oRouter.attachBeforeRouteMatched(this.onBeforeRouteMatched, this);
            },
    
            onBeforeRouteMatched: function(oEvent) {
    
                var sLayout = oEvent.getParameters().arguments.layout;
    
                // If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
                if (!sLayout) {
                    var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(0);
                    sLayout = oNextUIState.layout;
                }
    
                //Update the layout of the FlexibleColumnLayout
                if (sLayout) {
                    this._LocalData.setProperty("/layout", sLayout);
                }
            },
    
            // onRouteMatched: function (oEvent) {
            //     var sRouteName = oEvent.getParameter("name"),
            //         oArguments = oEvent.getParameter("arguments");
    
            //     this._updateUIElements();
    
            //     // Save the current route name
            //     this.currentRouteName = sRouteName;
            //     this.currentProduct = oArguments.product;
            //     this.currentSupplier = oArguments.supplier;
            // },
    
            // onStateChanged: function (oEvent) {
            //     var bIsNavigationArrow = oEvent.getParameter("isNavigationArrow"),
            //         sLayout = oEvent.getParameter("layout");
    
            //     this._updateUIElements();
    
            //     // Replace the URL with the new layout if a navigation arrow was used
            //     if (bIsNavigationArrow) {
            //         this.oRouter.navTo(this.currentRouteName, {layout: sLayout, product: this.currentProduct, supplier: this.currentSupplier}, true);
            //     }
            // },
    
            // // Update the close/fullscreen buttons visibility
            // _updateUIElements: function () {
            //     var oModel = this.getOwnerComponent().getModel();
            //     var oUIState = this.getOwnerComponent().getHelper().getCurrentUIState();
            //     oModel.setData(oUIState);
            // },
    
            // onExit: function () {
            //     this.oRouter.detachRouteMatched(this.onRouteMatched, this);
            //     this.oRouter.detachBeforeRouteMatched(this.onBeforeRouteMatched, this);
            // },
        });
    });
