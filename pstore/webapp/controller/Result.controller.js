sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/json/JSONModel",
    "com/shin/pstore/pstore/utils/Common",
    "../model/formatter"
], function (
    Controller,
    MessageToast,
    DateFormat,
    JSONModel,
    Common,
    formatter
) {
    "use strict";

    return Controller.extend("com.shin.pstore.pstore.controller.Result", {
        formatter: formatter,
        onInit: function () {
            if (!this._comm) {
                this._comm = new Common();
            }

            //Authorization
            var that = this;
            var oDataModel = this.getOwnerComponent().getModel();
            oDataModel.read("/AuthSet", {
                urlParameters: {
                    "$skip": 0,
                    "$top": 1
                },

                success: function (oData, oResponse) {
                    var oauthModel = new JSONModel(oData.results[0]);
                    that.getView().setModel(oauthModel, "auth");
                },

                error: function (oError) {

                }
            });
        },



        onShowCancelDialog: function () {
            var oTable = this.byId("table2").getTable();
            var aIndex = oTable.getSelectedIndices();

            if (aIndex.length <= 0) {
                MessageToast.show(this._comm.getI18nMessage(this, "select_at_least_row"));
                return;
            }

            this._comm.openDialog(this, "com.shin.pstore.pstore.view.CancelDoc");
        },

        onCloseCancelDialog: function () {
            this._comm.closeDialog(this, "cancelDialog");
        },

        onCloseLogDialog: function () {
            this._comm.closeDialog(this, "showLogDialog");
        },

        onCancelDoc: function () {
            var oTable = this.byId("table2").getTable();
            var aIndex = oTable.getSelectedIndices();

            if (aIndex.length <= 0) {
                MessageToast.show(this._comm.getI18nMessage(this, "select_at_least_row"));
                return;
            }


            var sStgrd = this.byId("selectStgrd").getSelectedKey();
            var dBudat = this.byId("datePostingDate").getValue();
            if (sStgrd === "") {
                this.byId("selectStgrd").setValueState("Error");
                return;
            }

            // if (dBudat === "") {
            //     this.byId("datePostingDate").setValueState("Error");
            //     return;
            // }
            var oDateFormatter = DateFormat.getDateInstance();
            if (dBudat !== '') {
                dBudat = oDateFormatter.parse(dBudat, true, true);
            }


            this._busyDialog = new sap.m.BusyDialog({});
            this._busyDialog.open();

            var oMessage = {}, completeCount = 0, that = this;
            oMessage.MessageSet = [];
            var oModel = this.getOwnerComponent().getModel();
            this._comm.closeDialog(this, "cancelDialog");

            var p = new Promise(function (resolve, reject) {
                for (var i = 0; i < aIndex.length; i++) {
                    var oContext = oTable.getContextByIndex(aIndex[i]);
                    var oData = oContext.getObject();
                    var param = {
                        KaishaCd: oData.KaishaCd,
                        TenpoCd: oData.TenpoCd,
                        EigyoBi: oData.EigyoBi,
                        Stgrd: sStgrd, 
                        Belnr: oData.Belnr,
                        Gjahr: oData.Gjahr
                    };

                    if(dBudat !== ''){
                        param.dBudat = dBudat;
                    }

                    oModel.callFunction("/CancelAccDoc", {
                        method: "GET",
                        urlParameters: param,
                        success: function (oData, oResponse) {
                            completeCount++;
                            oMessage.MessageSet = oMessage.MessageSet.concat(oData.results);
                            if (completeCount === aIndex.length) {
                                resolve();
                            }
                        },
                        error: function (oError) {
                            reject();
                        }
                    });
                }
            });

            p.then(function () {
                that._busyDialog.close();

                that.loadFragment({
                    name: "com.shin.pstore.pstore.view.ShowLog"
                }).then(function (o) {
                    o.setModel(new sap.ui.model.json.JSONModel(oMessage), "log");
                    o.open();
                });

            }, function (oError) {
                that._busyDialog.close();
                MessageToast.show('OData Error:' + oError.message);
            });

            oModel.refresh();
        },

        onDestroy : function(oEvent){
            var oSource = oEvent.getSource();
            if(oSource){
                oSource.destroy();
            }
        }
    });
});