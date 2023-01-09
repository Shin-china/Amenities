sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "com/shin/pstore/pstore/utils/Common",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "../model/formatter",
    "./messages",
    "sap/m/Button",
], function (
    Controller,
	UIComponent,
	Common,
	DateFormat,
	JSONModel,
	MessageToast,
	formatter,
    messages,
    Button
) {
    "use strict";

    return Controller.extend("com.shin.pstore.pstore.controller.DailyTabulation", {
        formatter: formatter,
        onInit: function () {
            this._LocalData = this.getOwnerComponent().getModel("local");
            this._oDataModel = this.getOwnerComponent().getModel();
            this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            if (!this._comm) {
                this._comm = new Common();
            }

            if(!this._filter){
                this._filter = {};
                var dDate = new Date();
                var nDay = dDate.getUTCDate();
                
                if(nDay === 1){
                    this._filter.StartDate = this._comm.getFirstDayOfLastMonth();
                    this._filter.EndDate = this._comm.getFirstDayOfMonth();
                }else{
                    this._filter.StartDate = this._comm.getFirstDayOfMonth();
                    this._filter.EndDate = this._comm.getLastDayOfMonth();
                }
                
                var oModel = new JSONModel(this._filter);
                this.getView().setModel(oModel, "filter");
            }

            //Authorization
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
        },

        onNavigate: function (oEvent) {
            var oRouter = UIComponent.getRouterFor(this);
            var oItem = oEvent.getSource();
            var oBindingContext = oItem.getBindingContext();
            var path = oBindingContext.getPath();
            var path = path.substr(path.lastIndexOf("/") + 1);
            oRouter.navTo("StoreDetail", {
                path: path,
                mode: 'V'
            });
        },

        onShowAddDialog: function () {
            this._comm.openDialog(this, "com.shin.pstore.pstore.view.AddStore");
            //this._comm.openDialog(this, "com.shin.pstore.pstore.view.ShowLog");
        },

        onShowCopyDialog: function () {
            var oTable = this.byId("table1").getTable();
            var aIndex = oTable.getSelectedIndices();

            if (aIndex.length <= 0) {
                MessageToast.show(this._comm.getI18nMessage(this, "select_at_least_row"));
                return;
            }

            if (aIndex.length > 1) {
                MessageToast.show(this._comm.getI18nMessage(this, "select_one_row"));
                return;
            }

            var srcKaishaCd = oTable.getContextByIndex(aIndex[0]).getProperty("KaishaCd");
            var srcTenpoCd = oTable.getContextByIndex(aIndex[0]).getProperty("TenpoCd");

            this._comm.openCopyDialog(this, "com.shin.pstore.pstore.view.CopyStore", srcKaishaCd, srcTenpoCd);
        },

        onShowDeleteDialog: function () {
            var oTable = this.byId("table1").getTable();
            var aIndex = oTable.getSelectedIndices();

            if (aIndex.length <= 0) {
                MessageToast.show(this._comm.getI18nMessage(this, "select_at_least_row"));
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
                //d.EigyoBi = this._comm.convertFrontendDateToOdata(this.byId("inputTab1Col04").getValue());
                var oDateFormatter = DateFormat.getDateInstance();
                d.EigyoBi = oDateFormatter.parse(this.byId("inputTab1Col04").getValue(), true, true);
                d.Action = 'A';
                d.MessageSet = [];
                d.OutCashSet = [];
                d.InCashSet = [];
                d.GoodsSet = [];
                d.EffectiveCashSet = [];
                d.LossCashSet = [];
                d.PlanCashSet = [];
                d.Fi1007 = {};
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
                            var bSuccess; 
                            for (var r of oMessage.MessageSet) {
                                if (r.Type == 'Error') {
                                    bSuccess = false;
                                    break;
                                } else {
                                    bSuccess = true;
                                }
                            }

                            if (bSuccess) {
                                var oRouter = UIComponent.getRouterFor(that);
                                var oDate = sap.ui.model.odata.ODataUtils.formatValue(oData.EigyoBi, "Edm.DateTime");
                                var sPath = "StoreSet(KaishaCd='" + oData.KaishaCd + "',TenpoCd='" + oData.TenpoCd + "',EigyoBi=" +
                                oDate  + ",KihyoNo='" + oData.KihyoNo + "')";
                                var sEncodeUri = encodeURIComponent(sPath);
                                oRouter.navTo("StoreDetail", {
                                    path: sEncodeUri,
                                    mode: "C"
                                });
                            } else {
                                oDialog.setModel(new sap.ui.model.json.JSONModel(oMessage), "log");
                                oDialog.open();
                            }
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
            var oTable = this.byId("table1").getTable();
            var aIndex = oTable.getSelectedIndices();

            var oBindingData = oTable.getContextByIndex(aIndex[0]).getObject();
            var checkOk = this.checkCreateInput();
            if (checkOk) {
                this._busyDialog = new sap.m.BusyDialog({});
                this._busyDialog.open();
                var that = this;

                var d = {}, o = {};
                d.KaishaCd = this.byId("inputTab1Col02").getValue();
                d.TenpoCd = this.byId("inputTab1Col05").getValue();
                //d.EigyoBi = this._comm.convertFrontendDateToOdata(this.byId("inputTab1Col04").getValue());
                var oDateFormatter = DateFormat.getDateInstance();
                d.EigyoBi = oDateFormatter.parse(this.byId("inputTab1Col04").getValue(), true, true);
                d.RefKaishaCd = oBindingData.KaishaCd;
                d.RefTenpoCd = oBindingData.TenpoCd;
                d.RefEigyoBi = oBindingData.EigyoBi;
                d.RefKihyoNo = oBindingData.KihyoNo;
                d.Action = 'C';
                d.MessageSet = [];
                d.OutCashSet = [];
                d.InCashSet = [];
                d.GoodsSet = [];
                d.EffectiveCashSet = [];
                d.LossCashSet = [];
                d.PlanCashSet = [];
                d.Fi1007 = {};
                o.d = d;

                var oModel = this.getOwnerComponent().getModel();

                oModel.create("/StoreSet", o, {
                    success: function (oData, oResponse) {
                        that._busyDialog.close();
                        that._comm.closeDialog(that, "copyDialog");

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

                oModel.refresh(true);
            }
        },

        onDeleteStore: function () {
            var oTable = this.byId("table1").getTable();
            var aIndex = oTable.getSelectedIndices();

            if (aIndex.length <= 0) {
                MessageToast.show(this._comm.getI18nMessage(this, "select_at_least_row"));
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
                    var o = {}, d = {};
                    d.KaishaCd = oData.KaishaCd;
                    d.TenpoCd = oData.TenpoCd;
                    d.EigyoBi = oData.EigyoBi;
                    d.KihyoNo = oData.KihyoNo;
                    d.Action = 'D';
                    d.MessageSet = [];
                    d.OutCashSet = [];
                    d.InCashSet = [];
                    d.GoodsSet = [];
                    d.EffectiveCashSet = [];
                    d.LossCashSet = [];
                    d.PlanCashSet = [];
                    d.Fi1007 = {};
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

        onGenerateDoc: function () {
            var oTable = this.byId("table1").getTable();
            var aIndex = oTable.getSelectedIndices();

            if (aIndex.length <= 0) {
                MessageToast.show(this._comm.getI18nMessage(this, "select_at_least_row"));
                return;
            }

            this.onCloseGenerateDialog();

            this._busyDialog = new sap.m.BusyDialog({});
            this._busyDialog.open();

            var oMessage = {}, completeCount = 0, that = this;
            var oModel = this.getOwnerComponent().getModel();


            var p = new Promise(function (resolve, reject) {
                for (var i = 0; i < aIndex.length; i++) {
                    var oContext = oTable.getContextByIndex(aIndex[i]);
                    var oData = oContext.getObject();
                    var o = {}, d = {};
                    d.KaishaCd = oData.KaishaCd;
                    d.TenpoCd = oData.TenpoCd;
                    d.EigyoBi = oData.EigyoBi;
                    d.KihyoNo = oData.KihyoNo;
                    d.Action = 'G';
                    d.MessageSet = [];
                    d.OutCashSet = [];
                    d.InCashSet = [];
                    d.GoodsSet = [];
                    d.EffectiveCashSet = [];
                    d.LossCashSet = [];
                    d.PlanCashSet = [];
                    d.Fi1007 = {};
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

        onExportPdf: function () {
            var oTable = this.byId("table1").getTable();
            var aIndex = oTable.getSelectedIndices();

            for (var i = 0; i < aIndex.length; i++) {
                var oContext = oTable.getContextByIndex(aIndex[i]);
                var oData = oContext.getObject();
                var sUrl = "/sap/opu/odata/sap/ZZPSTORE_SRV/ExportSet(KaishaCd='" + oData.KaishaCd + "',TenpoCd='" + oData.TenpoCd + "',KihyoNo='" + oData.KihyoNo + "')/$value";
                // window.open(sUrl, "_blank");
                var sShop = oData.TenpoCd;
                    if (sShop.length == 3) {
                        sShop = "0" + sShop;
                    }
                    var sFielName = "Amenities_P店舗_" + sShop + "_" + this.formatter.date_8(oData.EigyoBi) + oData.NikkeihyoStatus;
                    this.download(sUrl, sFielName);
            }
        },
        download: function (url, sFielName) {
            this.getBlob(url).then(blob => {
              this.saveAs(blob, sFielName);
            });
        },
        getBlob: function (url) {
            return new Promise(resolve => {
              const xhr = new XMLHttpRequest();
        
              xhr.open('GET', url, true);
              xhr.responseType = 'blob';
              xhr.onload = () => {
                if (xhr.status === 200) {
                  resolve(xhr.response);
                }
              };
        
              xhr.send();
            });
        },
        saveAs: function (blob, filename) {
            if (window.navigator.msSaveOrOpenBlob) {
              navigator.msSaveBlob(blob, filename);
            } else {
              const link = document.createElement('a');
              const body = document.querySelector('body');
        
              link.href = window.URL.createObjectURL(blob);
              link.download = filename;
        
              // fix Firefox
              link.style.display = 'none';
              body.appendChild(link);
        
              link.click();
              body.removeChild(link);
        
              window.URL.revokeObjectURL(link.href);
            }
        },

        onShowCompanyHelp: function (oEvent) {
            var aFilters = [];
            this._comm.showCustomSearchHelpDialog(
                this,
                oEvent,
                this._comm.getI18nMessage(this, "tab1_col02"),
                "com.shin.pstore.pstore.view.SearchHelp",
                "CompanySet",
                "Bukrs",
                aFilters);
        },

        onShowStoreCodeHelp: function (oEvent) {
            var aFilters = [];
            this._comm.showCustomSearchHelpDialog(
                this,
                oEvent,
                this._comm.getI18nMessage(this, "tab1_col02"),
                "com.shin.pstore.pstore.view.SearchHelp",
                "StoreCodeSet",
                "TenpoCd",
                aFilters);
        },

        onRebingTable: function (oEvent) {
            var binding = oEvent.getParameter("bindingParams");
            var oFilter;
            for (var o of this._aFilters) {
                oFilter = new sap.ui.model.Filter(o.field, sap.ui.model.FilterOperator.EQ, o.value);
                binding.filters.push(oFilter);
            }
        },

        onSelectLine: function (oEvent) {
            var data;
            if (oEvent.sId === 'cellClick') {
                data = oEvent.mParameters.rowBindingContext.getObject();
            } else {
                data = oEvent.getParameter("rowContext").getObject();
            }

            if (data && data[this._sBindingField]) {
                if (this._inputSource) {
                    this._inputSource.setValue(data[this._sBindingField]);
                    this._inputSource.fireChange({});
                }
            }

            this.onCloseSearchDialog();
        },

        onCloseSearchDialog: function () {
            this.byId("dialogSelect").close();
            this.byId("dialogSelect").destroy();
        },

        onPressHistory: function(oEvent) {
            var sObjectid = oEvent.getSource().getBindingContext().getObject().KihyoNo;
            this.getApprovalHistory(sObjectid).then(function (res) {
                try {
                    var aApprovalHistory = [];
                    res.forEach(function (item) {
                        var sTime = this.formatter.dateTime(item.CREATE_DATE, item.CREATE_TIME);
                        aApprovalHistory.push({
                            user: item.CREATE_USER,
                            name: item.USERNAME,
                            time: new Date(sTime),
                            comments: item.COMMENTS,
                            action: item.ACTION,
                            nodename: item.NODENAME
                        });
                    }, this)
                } catch (error) {}
                this._LocalData.setProperty("/approvalHistory", aApprovalHistory);
                this.approvalHistoryDialog();
            }.bind(this));
        },
        getApprovalHistory: function (sObjectid) {
            var promise = new Promise( function (resolve, reject) {
                var mParameters = {
                    refreshAfterChange: false,
                    success: function (oData) {
                        resolve(oData.results);
                    }.bind(this),
                    error: function (oError) {
                        messages.showError(messages.parseErrors(oError));
                    }.bind(this)
                };
                this.getOwnerComponent().getModel().setHeaders({"objectid":sObjectid});
                this.getOwnerComponent().getModel().read("/ZzApprovalHistorySet", mParameters);
            }.bind(this));
            return promise;
        },
        // 显示审批履历
        approvalHistoryDialog: function () {
            this.byId("dynamicPage1").setBusyIndicatorDelay(0);
            this.byId("dynamicPage1").setBusy(true);
            var oView = this.getView();
            if (!this.HistoryDialog) {
                this.HistoryDialog = this.loadFragment({
                    id: oView.getId(),
                    name: "com.shin.pstore.pstore.view.ApprovalHistory"
                })
            }
            this.HistoryDialog.then(function (oHistoryDialog) {
                var endButton = new Button({
                    text: this._ResourceBundle.getText("Suspend"),
                    press: function () {
                        oHistoryDialog.close();
                    }.bind(this)
                });
                // 添加按钮
                if (oHistoryDialog.getButtons().length === 0){
                    oHistoryDialog.addButton(endButton);
                }
                oHistoryDialog.open();
                this.byId("dynamicPage1").setBusy(false);
            }.bind(this));
        },
        onDestroy : function(oEvent){
            var oSource = oEvent.getSource();
            if(oSource){
                oSource.destroy();
            }
        }
    });
});