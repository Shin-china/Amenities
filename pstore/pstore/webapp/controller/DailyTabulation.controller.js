sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "com/shin/pstore/pstore/utils/Common",
    "sap/m/MessageToast",
    "../model/formatter"
], function (
    Controller,
    UIComponent,
    Common,
    MessageToast,
    formatter
) {
    "use strict";

    return Controller.extend("com.shin.pstore.pstore.controller.DailyTabulation", {
        formatter: formatter,
        onInit: function () {
            if (!this._comm) {
                this._comm = new Common();
            }
        },

        onNavigate: function (oEvent) {
            var oRouter = UIComponent.getRouterFor(this);
            var oItem = oEvent.getSource();
            var oBindingContext = oItem.getBindingContext();
            var path = oBindingContext.getPath();
            var path = path.substr(path.lastIndexOf("/") + 1);
            oRouter.navTo("StoreDetail", {
                path: path
            });
        },

        onShowAddDialog: function () {
            this._comm.openDialog(this, "com.shin.pstore.pstore.view.AddStore");
            //this._comm.openDialog(this, "com.shin.pstore.pstore.view.ShowLog");
        },

        onShowCopyDialog: function () {
            this._comm.openDialog(this, "com.shin.pstore.pstore.view.CopyStore");
        },

        onShowDeleteDialog: function () {
            var oTable = this.byId("table1");
            var aIndex = oTable.getSelectedIndices();

            if (aIndex.length <= 0) {
                MessageToast.show("少なくとも1行を選択してください。");
                return;
            }

            this._comm.openDialog(this, "com.shin.pstore.pstore.view.DeleteStore");
        },

        onShowGenerateDialog: function () {
            this._comm.openDialog(this, "com.shin.pstore.pstore.view.GenerateDoc");
        },

        onCloseAddDialog: function () {
            this._comm.closeDialog(this, "addDialog");
        },

        onCloseCopyDialog: function () {
            this._comm.closeDialog(this, "copyDialog");
        },

        onCloseDeleteDialog: function () {
            this._comm.closeDialog(this, "deleteDialog");
        },

        onCloseGenerateDialog: function () {
            this._comm.closeDialog(this, "generateDialog");
        },

        onCloseLogDialog: function () {
            this._comm.closeDialog(this, "showLogDialog");
        },

        checkCreateInput: function () {
            var f1 = this.byId("inputTab1Col02");

            if (f1.getValue() == "") {
                f1.setValueState("Error");
                return false;
            } else {
                f1.setValueState("None");
            }

            var f2 = this.byId("inputTab1Col05");
            if (f2.getValue() == "") {
                f2.setValueState("Error");
                return false;
            } else {
                f2.setValueState("None");
            }

            var f3 = this.byId("inputTab1Col04");

            if (f3.getValue() == "") {
                f3.setValueState("Error");
                return false;
            } else {
                f3.setValueState("None");
            }

            return true;
        },

        onAddStore: function () {
            var checkOk = this.checkCreateInput();
            if (checkOk) {
                this._busyDialog = new sap.m.BusyDialog({});
                this._busyDialog.open();
                var that = this;

                var d = {}, o = {};
                d.KaishaCd = this.byId("inputTab1Col02").getValue();
                d.TenpoCd = this.byId("inputTab1Col05").getValue();
                d.EigyoBi = this._comm.convertFrontendDateToOdata(this.byId("inputTab1Col04").getValue());
                d.Action = 'A';
                d.MessageSet = [];
                d.OutDataSet = [];
                d.InDataSet = [];
                d.Cash = {};
                o.d = d;

                var oModel = this.getOwnerComponent().getModel(); 
                
                oModel.create("/StoreSet", o, {
                    success: function (oData, oResponse) { 
                        that._busyDialog.close();
                        that._comm.closeDialog(that, "addDialog");

                        that.loadFragment({
                            name: "com.shin.pstore.pstore.view.ShowLog"
                        }).then(function (oDialog) {
                            var oMessage = {};
                            oMessage.MessageSet = oData.MessageSet.results;
                            oDialog.setModel(new sap.ui.model.json.JSONModel(oMessage), "log");
                            oDialog.open();
                        });

                    },
                    error: function (oError) {
                        MessageToast.show('OData Error:' + oError.message);
                        that._busyDialog.close();
                    }
                });

                oModel.refresh();
            }
        },

        onCopyStore: function () {

        },

        onDeleteStore: function () {
            var oTable = this.byId("table1");
            var aIndex = oTable.getSelectedIndices();

            if (aIndex.length <= 0) {
                MessageToast.show("少なくとも1行を選択してください。");
                return;
            }

            this.onCloseDeleteDialog();

            this._busyDialog = new sap.m.BusyDialog({});
            this._busyDialog.open();

            var oMessage = {}, completeCount = 0, that = this;
            var oModel = this.getOwnerComponent().getModel();
        

            var p = new Promise(function (resolve, reject) {
                for (var i = 0; i < aIndex.length; i++) {
                    var oContext = oTable.getContextByIndex(aIndex[i]); 
                    var oData = oContext.getObject();
                    var o= {}, d = {};
                    d.KaishaCd = oData.KaishaCd;
                    d.TenpoCd = oData.TenpoCd;
                    d.EigyoBi = oData.EigyoBi;
                    d.KihyoNo = oData.KihyoNo;
                    d.Action = 'D';
                    d.MessageSet = [];
                    d.OutDataSet = [];
                    d.InDataSet = [];
                    d.Cash = {};
                    o.d = d;
                    oMessage.MessageSet = [];
                    oModel.create("/StoreSet", o, {
                        success: function (oData, oResponse) {
                            completeCount++;
                            oMessage.MessageSet = oMessage.MessageSet.concat(oData.MessageSet.results);
                            if (completeCount == aIndex.length) {
                                resolve();
                            }
                        },
                        error: function (oError) {
                            reject(oError);
                        }
                    });
                }
            });

            p.then(function () {
                that._busyDialog.close();

                that.loadFragment({
                    name: "com.shin.pstore.pstore.view.ShowLog"
                }).then(function(o){
                    o.setModel(new sap.ui.model.json.JSONModel(oMessage), "log");
                    o.open();
                });

            }, function (oError) {
                that._busyDialog.close();
                MessageToast.show('OData Error:' + oError.message);
            });

            oModel.refresh();

        },

        onGenerateDoc: function () {

        },

        onExportPdf: function () {

        }
    });
});