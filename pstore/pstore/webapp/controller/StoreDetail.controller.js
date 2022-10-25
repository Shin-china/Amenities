sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "com/shin/pstore/pstore/utils/Common",
    "../model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,
	MessageToast,
	UIComponent,
	JSONModel, 
    Common,
	formatter) {
        "use strict";

        return Controller.extend("com.shin.pstore.pstore.controller.StoreDetail", {
            formatter: formatter,
            onInit: function () {
                if (!this._viewState) {
                    this._viewState = {};
                }

                if (!this._comm) {
                    this._comm = new Common();
                }

                this._oRouter = UIComponent.getRouterFor(this);
                this._oRouter.getRoute("StoreDetail").attachPatternMatched(this._onDetailMatched, this);


            },

            _onDetailMatched: function (oEvent) {
                this._path = oEvent.getParameter("arguments").path;
                var sPath = "/" + this._path;

                var oView = this.getView();
                oView.bindElement(sPath);

                //每次进入详细页面，默认会保存上一次的section，滚动到页头第一个section
                var oPageLayout = this.byId("objectPageLayout");
                oPageLayout.scrollToSection(this.byId("section1").getId());

                this._viewState.editable = false;

                var viewStateModel = new sap.ui.model.json.JSONModel(this._viewState);
                this.getView().setModel(viewStateModel, "viewState");

                this.byId("btnMessagePopover").setVisible(false);
            },

            checkEditData: function() {
                var oInputUserName = this.byId("txtInvUserName");
                if (oInputUserName.getValue() == '') {
                    oInputUserName.setValueState("Error");
                    return false;
                }

                return true;
            },

            onSave: function () {
                var checkOk = this.checkEditData();
                if (!checkOk) {
                    return;
                }

                this._busyDialog = new sap.m.BusyDialog({});
                this._busyDialog.open();
                var that = this;

                var elem = this.getView().getBindingContext();  
                var oModel = elem.getModel(); 
                var d = elem.getObject();
                d.PUriage = this._comm.parseCurrency(this.byId("txtPUriage").getText());
                delete d.__metadata;

                for(var f in d){
                    if(typeof(d[f]) === 'number'){
                        d[f] = d[f].toString();
                    }
                }
                 
                var o = {};
                d.MessageSet = [];
                d.OutDataSet = [];
                d.InDataSet = [];
                d.Cash = {};
                d.Action = 'U';
                 
                o.d = d;
                oModel.create('/StoreSet', o, {
                    success: function (oData, oResponse) {   
                        var oMessage = {};
                        oMessage.MessageSet = oData.MessageSet.results;
                        var logModel = new JSONModel(oMessage);
                        that.getView().setModel(logModel, "log");
                        that._busyDialog.close();
                        that._comm.showMessagePopoverFor(that, "log", "/MessageSet", "btnMessagePopover")

                    },
                    error: function (oError) { 
                        MessageToast.show('OData Error:' + oError.message); 
                    }
                });

                oModel.refresh();

            },

            onChange: function () {
                this._viewState.editable = true;
                this.getView().getModel("viewState").refresh();
                //this._comm.showMessagePopoverFor(this, "Message", "btnMessagePopover")
            },

            onRequest: function () {

            },

            onGenerate: function () {

            },

            onStop: function () {
                if (this._comm) {
                    this._comm.navBackFrom(this);
                }
            },

            onTab3Add: function () {
                if (!this._oModel) {
                    this._oModel = this.getView().getModel();
                }

                this._InData = this.getView().getBindingContext().getObject().InData;//this._oModel.getData().DataSet[this._pathId].InData;
                var obj = {};
                this._InData.push(obj);
                this._oModel.refresh();
                var index = this._InData.length - 1;
                this.byId("tab3").setFirstVisibleRow(index);

            },

            onTab3Delete: function (oEvent) {
                var index = this.byId("tab3").getSelectedIndex();

                if (index != -1) {
                    this._InData.splice(index, 1);
                    if (this._oModel) {
                        this._oModel.refresh();
                    }
                }
            },

            onTab4Add: function () {
                if (!this._oModel) {
                    this._oModel = this.getView().getModel();
                }

                this._OutData = this.getView().getBindingContext().getObject().OutData;//this._oModel.getData().DataSet[this._pathId].OutData;
                var obj = {};
                this._OutData.push(obj);
                this._oModel.refresh();
                var index = this._OutData.length - 1;
                this.byId("tab4").setFirstVisibleRow(index);

            },

            onTab4Delete: function (oEvent) {
                var index = this.byId("tab4").getSelectedIndex();

                if (index != -1) {
                    this._OutData.splice(index, 1);
                    if (this._oModel) {
                        this._oModel.refresh();
                    }
                }
            },

            onMessagePopoverPress: function (oEvent) {
                if (this._oMessagePopover) {
                    this._oMessagePopover.toggle(oEvent.getSource());
                }
            }
        });
    });