sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, UIComponent) {
        "use strict";

        return Controller.extend("com.shin.pstore.pstore.controller.StoreDetail", {
            onInit: function () {
                if (!this._viewState) {
                    this._viewState = {};
                }

                this._viewState.editable = true;

                var viewStateModel = new sap.ui.model.json.JSONModel(this._viewState);
                this.getView().setModel(viewStateModel, "viewState");

                var page = this.getView().byId("objectPageLayout");
                page.setSelectedSection("section1");

                this._oRouter = UIComponent.getRouterFor(this);
                this._oRouter.getRoute("StoreDetail").attachPatternMatched(this._onDetailMatched, this);
            },

            _onDetailMatched: function (oEvent) {
                var sPath = "/DataSet/" + oEvent.getParameter("arguments").id;
                var oView = this.getView();
                oView.bindElement(sPath);
            },

            onSave: function () {

            },

            onChange: function () {

            },

            onRequest: function () {

            },

            onGenerate: function () {

            },

            onStop: function () {

            }
        });
    });