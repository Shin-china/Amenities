sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/NumberFormat",
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
        NumberFormat,
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
                this._InCashSet = [];
                this._OutCashSet = [];
                var that = this;
                //oView.bindElement(sPath);
                oView.bindElement({
                    path: sPath,
                    parameters: {
                        expand: 'InCashSet,OutCashSet'
                    },
                    events: {
                        dataReceived: function (oResponse) {
                            that._InCashSet = oResponse.mParameters.data.InCashSet;
                            that._OutCashSet = oResponse.mParameters.data.OutCashSet;
                            var oInCashModel = new JSONModel(that._InCashSet);
                            that.getView().setModel(oInCashModel, "InCash");

                            var oOutCashModel = new JSONModel(that._OutCashSet);
                            that.getView().setModel(oOutCashModel, "OutCash");

                            that._KaishaCd = oResponse.mParameters.data.KaishaCd;
                            that._TenpoCd = oResponse.mParameters.data.TenpoCd;
                            that._EigyoBi = oResponse.mParameters.data.EigyoBi;
                            that._KihyoNo = oResponse.mParameters.data.KihyoNo;
                        }
                    }
                });

                //每次进入详细页面，默认会保存上一次的section，滚动到页头第一个section
                var oPageLayout = this.byId("objectPageLayout");
                oPageLayout.scrollToSection(this.byId("section1").getId());

                this._viewState.editable = false;

                var viewStateModel = new sap.ui.model.json.JSONModel(this._viewState);
                oView.setModel(viewStateModel, "viewState");

                this.byId("btnMessagePopover").setVisible(false);

                //读取关联表到jsonmodel，本地添加删除行
                // this._InCashSet = [];
                // this._OutCashSet = [];
                // var oModel = this.getOwnerComponent().getModel();
                // if (oModel) {
                //     oModel.read(sPath, {
                //         urlParameters: {
                //             "$expand": "InCashSet,OutCashSet"
                //         },
                //         success: function (oData, oResponse) {
                //             this._InCashSet = oData.InCashSet;
                //             this._OutCashSet = oData.OutCashSet;
                //         },

                //         error: function (oData, oResponse) { 
                //         }
                //     });
                // }
            },

            checkEditData: function () {
                var oInputUserName = this.byId("txtKihyoshaName");
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

                //Deep Entities
                d.GoodsSet = this._comm.getTableData(this, "tabGoods", null);
                // var goods = this.byId("tabGoods").getRows();
                // for(var g of goods){
                //     var good = g.getBindingContext().getObject();
                //     delete good.__metadata;
                //     d.GoodsSet.push(good);
                // }

                d.EffectiveCashSet = this._comm.getTableData(this, "tabEffectiveCash", null);
                d.LossCashSet = this._comm.getTableData(this, "tabLossCash", null);
                d.PlanCashSet = this._comm.getTableData(this, "tabPlanCash", "Amount");
                d.InCashSet = this._InCashSet;//this._comm.getTableData(this, "tabInCash");
                d.OutCashSet = this._OutCashSet;//this._comm.getTableData(this, "tabOutCash");
                d.InCashSet = this._comm.convertCashData(d.InCashSet);
                d.OutCashSet = this._comm.convertCashData(d.OutCashSet);

                debugger;

                delete d.__metadata;

                d.Fi1007 = this._comm.convertJsonNumberToString(d.Fi1007);
                d = this._comm.convertJsonNumberToString(d);

                // for(var f in d){
                //     if(typeof(d[f]) === 'number'){
                //         d[f] = d[f].toString();
                //     }
                // }

                var o = {};
                d.MessageSet = [];
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
                        oModel.refresh();
                    },
                    error: function (oError) {
                        that._busyDialog.close();
                        MessageToast.show('OData Error:' + oError.message);
                    }
                });



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

            _addNewRow: function (oContext, sModelName, sTabName, sBindingProperty, oEvent = null) {
                var oModel = oContext.getView().getModel(sModelName);
                oContext[sBindingProperty] = oModel.getData();
                var obj = {};
                obj.Loekz = false;
                obj.KaishaCd = this._KaishaCd;
                obj.TenpoCd = this._TenpoCd;
                obj.EigyoBi = this._EigyoBi;
                obj.KihyoNo = this._KihyoNo;
                obj.Jidoutenkifuyo = false;

                if (oContext[sBindingProperty].length === 0) {
                    obj.MeisaiNo = '10';
                } else {
                    var last = oContext[sBindingProperty][oContext[sBindingProperty].length - 1];
                    obj.MeisaiNo = (parseInt(last.MeisaiNo) + 10).toString();
                }

                oContext[sBindingProperty].push(obj);
                oModel.refresh();

                var index = oContext[sBindingProperty].length - 1;
                oContext.byId(sTabName).setFirstVisibleRow(index);
            },

            _deleteRow: function (oContext, sModelName, sTabName, sBindingProperty, oEvent = null) {
                var indices = oContext.byId(sTabName).getSelectedIndices();
                var oModel = oContext.getView().getModel(sModelName);
                oContext[sBindingProperty] = oModel.getData();
                for (var i of indices) {
                    var oSelObj = oContext.byId(sTabName).getContextByIndex(i).getObject();
                    var sMeisaiNo = oSelObj.MeisaiNo;

                    if (sMeisaiNo) {
                        for (var j = 0; j < oContext[sBindingProperty].length; j++) {
                            if (oContext[sBindingProperty][j].MeisaiNo === sMeisaiNo) {
                                oContext[sBindingProperty][j].Loekz = true;
                            }
                        }
                    }
                }

                oModel.refresh();

                var filter = [];
                filter.push(new sap.ui.model.Filter("Loekz", sap.ui.model.FilterOperator.EQ, false));

                oContext.byId(sTabName).getBinding("rows").filter(new sap.ui.model.Filter(filter, true));

            },

            onTabInCashAdd: function (oEvent) {
                this._addNewRow(this, "InCash", "tabInCash", "_InCashSet", oEvent);
            },

            onTabInCashDelete: function (oEvent) {
                this._deleteRow(this, "InCash", "tabInCash", "_InCashSet", oEvent);
            },

            onTabOutCashAdd: function (oEvent) {
                this._addNewRow(this, "OutCash", "tabOutCash", "_OutCashSet", oEvent);
            },

            onTabOutCashDelete: function (oEvent) {
                this._deleteRow(this, "OutCash", "tabOutCash", "_OutCashSet", oEvent);
            },

            onMessagePopoverPress: function (oEvent) {
                if (this._oMessagePopover) {
                    this._oMessagePopover.toggle(oEvent.getSource());
                }
            },

            onSyohinCdChange: function (oEvent) {
                var oSource = oEvent.getSource()
                var oContext = oSource.getBindingContext();
                var sValue = oEvent.mParameters.newValue.toUpperCase();
                oSource.setValue(sValue);

                var oModel = oContext.getModel();
                var sPath = "/MaterialSet(TenpoCd='" + oContext.getProperty("TenpoCd") +
                    "',Hyojibasho='" + oContext.getProperty("Hyojibasho") +
                    "',ShohinCd='" + sValue + "')";

                var that = this;
                that._goodsSource = oSource;
                //读取物料单价
                oModel.read(sPath, {
                    success: function (oData, oResponse) {
                        oModel.setProperty(oContext.sPath + "/SyohinTanka", oData.ShohinTanka);
                        //更新景品仕入高合计
                        that.onLineAmountChange();
                    },
                    error: function (oError) {
                        that._goodsSource.setValueState("Error");
                    }
                });
 
            },

            //景品仕入高合计
            onLineAmountChange: function () {
                var aItems = this.byId("tabGoods").getRows();
                var amount = 0, waers = '', lineAmount = 0;
                for (var item of aItems) {
                    var data = item.getBindingContext().getObject();
                    var qty = Number(data.SyohinZenjtsZan) + Number(data.SyohinShirSu) - Number(data.SyohinSyukoSu);
                    lineAmount = qty * Number(data.SyohinTanka);
                    amount += lineAmount;
                    waers = (waers === '') ? data.Waers : 'JPY';
                }

                var oCurrencyFormat = NumberFormat.getCurrencyInstance({ showMeasure: false });
                this.byId("txtKeihinShirdk").setText(oCurrencyFormat.format(amount, waers));
            },

            _calcCashSumAmount: function (oContext, sTableId, sSumFieldId) {
                var oCurrencyParse = NumberFormat.getFloatInstance();
                var aItems = oContext.byId(sTableId).getRows();
                var amount = 0, waers = '', lineAmount = 0;
                for (var item of aItems) {
                    var data = item.getBindingContext().getObject();
                    lineAmount = oCurrencyParse.parse(data.Desc) * Number(data.Man);
                    amount += lineAmount;
                    waers = (waers === '') ? data.Waers : 'JPY';
                }

                var oCurrencyFormat = NumberFormat.getCurrencyInstance({ showMeasure: false });
                this.byId(sSumFieldId).setText(oCurrencyFormat.format(amount, waers));
            },

            _calcTableColumnSum: function (oContext, sTableId, sColumnId, sSumFieldId) {
                var oCurrencyParse = NumberFormat.getFloatInstance();
                var aItems = oContext.byId(sTableId).getRows();
                var amount = 0, waers = '', lineAmount = 0;
                for (var item of aItems) {
                    var data = item.getBindingContext().getObject();
                    var colVal = data[sColumnId].toString();
                    lineAmount = oCurrencyParse.parse(colVal);
                    amount += lineAmount;
                    waers = (waers === '') ? data.Waers : 'JPY';
                }

                var oCurrencyFormat = NumberFormat.getCurrencyInstance({ showMeasure: false });
                this.byId(sSumFieldId).setText(oCurrencyFormat.format(amount, waers));
            },

            onEffectiveCashManChange: function () {
                this._calcCashSumAmount(this, "tabEffectiveCash", "txtYuukouGkiAmt");
            },

            onLossCashManChange: function () {
                this._calcCashSumAmount(this, "tabLossCash", "txtHasonGkiAmt");
            },

            onPlanCashAmountChange: function () {
                this._calcTableColumnSum(this, "tabPlanCash", "Amount", "txtZyunbikinGkiAmt");
            },

            // onTab3JidoutenkifuyoCheck: function(oEvent){
            //     debugger;
            // }
        });
    });