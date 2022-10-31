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

                //汇总model
                this._sum = {
                    "PUriage": 0, //1. a + b
                    "SUriage": 0, //2. c + d
                    "GenkinUragGokei": 0, //3. a + c
                    "UriageSogokei": 0, //4. 1 + 2
                    "KadoHanbaiGokei": 0, //5.
                    "SonotaNyukinKei": 0, //6
                    "SonotaShunyuKei": 0,//7
                    "SyunyuGokei": 0, //A:  3 + 5 + 6
                    "KeihinShirdk": 0, //8
                    "ShishutsuGokei": 0, //B: 7 + 8 
                    "HnjtsKrkshdk": 0, //I - II + III + A - B
                    "HnjtsHnshSofukin": 0, //A - B
                    "SofukinGokei": 0, //送付金合计A - B + 前日までの本社送付金累計 + 両替金戻し
                    "HnjtsKrkshdkUgki": 0, //IV 本日繰越高内訳合計 = 送付金合计(A - B + 前日までの本社送付金累計 + 両替金戻し) + 規定元金金額
                    "Yokuzitunyuukin": 0, // XI
                    "YuukouGkiAmt": 0, //VIII
                    "HasonGkiAmt": 0, //IX
                    "ZyunbikinGkiAmt": 0, //X
                    "Yokuzitukinkonai": 0, //XII = [Ⅷ]+[Ⅸ]+[Ⅹ]+[Ⅺ]
                    "Sagaku": 0, //XII - IV
                    "Waers": 'JPY'
                };

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

                            that._sum.PUriage = oResponse.mParameters.data.PUriage;
                            that._sum.SUriage = oResponse.mParameters.data.SUriage;
                            that._sum.GenkinUragGokei = oResponse.mParameters.data.GenkinUragGokei;
                            that._sum.UriageSogokei = oResponse.mParameters.data.UriageSogokei;
                            that._sum.KadoHanbaiGokei = oResponse.mParameters.data.KadoHanbaiGokei;
                            that._sum.SonotaNyukinKei = oResponse.mParameters.data.SonotaNyukinKei;
                            that._sum.SonotaShunyuKei = oResponse.mParameters.data.SonotaShunyuKei;
                            that._sum.SyunyuGokei = oResponse.mParameters.data.SyunyuGokei;
                            that._sum.KeihinShirdk = oResponse.mParameters.data.KeihinShirdk;
                            that._sum.ShishutsuGokei = oResponse.mParameters.data.ShishutsuGokei;
                            that._sum.HnjtsKrkshdk = oResponse.mParameters.data.HnjtsKrkshdk;
                            that._sum.HnjtsHnshSofukin = oResponse.mParameters.data.HnjtsHnshSofukin;
                            that._sum.SofukinGokei = oResponse.mParameters.data.SofukinGokei;
                            that._sum.HnjtsKrkshdkUgki = oResponse.mParameters.data.HnjtsKrkshdkUgki;
                            that._sum.Yokuzitunyuukin = oResponse.mParameters.data.Fi1007.Yokuzitunyuukin;
                            that._sum.YuukouGkiAmt = oResponse.mParameters.data.Fi1007.YuukouGkiAmt;
                            that._sum.HasonGkiAmt = oResponse.mParameters.data.Fi1007.HasonGkiAmt;
                            that._sum.ZyunbikinGkiAmt = oResponse.mParameters.data.Fi1007.ZyunbikinGkiAmt;
                            that._sum.Yokuzitukinkonai = oResponse.mParameters.data.Fi1007.Yokuzitukinkonai;
                            that._sum.Sagaku = oResponse.mParameters.data.Fi1007.Sagaku;
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



                var oSumModel = new JSONModel(this._sum, "sum");
                oView.setModel(oSumModel, "sum");
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

            _addNewRow: function (oContext, sModelName, sTabName, sBindingProperty, oObj, oEvent = null) {
                var oModel = oContext.getView().getModel(sModelName);
                oContext[sBindingProperty] = oModel.getData();

                if (oContext[sBindingProperty].length === 0) {
                    oObj.MeisaiNo = '10';
                } else {
                    var last = oContext[sBindingProperty][oContext[sBindingProperty].length - 1];
                    oObj.MeisaiNo = (parseInt(last.MeisaiNo) + 10).toString();
                }

                oContext[sBindingProperty].push(oObj);
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
                var oNewObj = {};
                oNewObj.Loekz = false;
                oNewObj.KaishaCd = this._KaishaCd;
                oNewObj.TenpoCd = this._TenpoCd;
                oNewObj.EigyoBi = this._EigyoBi;
                oNewObj.KihyoNo = this._KihyoNo;
                oNewObj.KeijoBusho = "";
                oNewObj.DrkamokuCd = "";
                oNewObj.NyknSaki = "";
                oNewObj.NyknTekiyo = "";
                oNewObj.Waers = 'JPY';
                oNewObj.NyknKingaku = 0;
                oNewObj.NyknKamokuCd = "";
                oNewObj.NyknKamokuNm = "";
                oNewObj.ZeiCd = "";
                oNewObj.Jidoutenkifuyo = false;
                this._addNewRow(this, "InCash", "tabInCash", "_InCashSet", oNewObj, oEvent);
            },

            onTabInCashDelete: function (oEvent) {
                this._deleteRow(this, "InCash", "tabInCash", "_InCashSet", oEvent);
            },

            onTabOutCashAdd: function (oEvent) {
                var oNewObj = {};
                oNewObj.Loekz = false;
                oNewObj.KaishaCd = this._KaishaCd;
                oNewObj.TenpoCd = this._TenpoCd;
                oNewObj.EigyoBi = this._EigyoBi;
                oNewObj.KihyoNo = this._KihyoNo;
                oNewObj.KeihiFutanBusho = "";
                oNewObj.ShknSaki = "";
                oNewObj.ShknTekiyo = "";
                oNewObj.Waers = 'JPY';
                oNewObj.ShknKingaku = 0;
                oNewObj.ShknKamokuCd = "";
                oNewObj.ShknKamokuNm = "";
                oNewObj.ZeiCd = "";
                oNewObj.Jidoutenkifuyo = false;
                this._addNewRow(this, "OutCash", "tabOutCash", "_OutCashSet", oNewObj, oEvent);
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
            onLineAmountChange: function (oEvent) {
                var aItems = this.byId("tabGoods").getRows();
                var amount = 0, waers = '', lineAmount = 0;
                for (var item of aItems) {
                    var data = item.getBindingContext().getObject();
                    var qty = Number(data.SyohinZenjtsZan) + Number(data.SyohinShirSu) - Number(data.SyohinSyukoSu);
                    lineAmount = qty * Number(data.SyohinTanka);
                    amount += lineAmount;
                    waers = (waers === '') ? data.Waers : 'JPY';
                }

                // 7.
                this._sum.KeihinShirdk = amount;

                //B: sum 7 + 8
                this._sum.ShishutsuGokei = this._calcCurrencySum(this._sum.SonotaShunyuKei, this._sum.KeihinShirdk);

                //Sum I - II + III + A - B   
                this.onCalcHnjtsKrkshdk(oEvent);

                //送付金合计 A - B + ZnjtsHnshSfknRk + RyogaekinModoshi;
                this.onCalcSofukinGokei(oEvent);

                //本日繰越高内訳合計 = 送付金合计(A - B + 前日までの本社送付金累計 + 両替金戻し) + 規定元金金額
                this.onCalcHnjtsKrkshdkUgki(oEvent);
            },

            _calcCashSumAmount: function (oContext, sTableId, sSumFieldId) {
                var oCurrencyParse = NumberFormat.getFloatInstance();
                var aItems = oContext.byId(sTableId).getRows();
                var amount = 0, waers = '', lineAmount = 0;
                for (var item of aItems) {
                    var oBindingContext = item.getBindingContext();
                    if (oBindingContext) {
                        var data = item.getBindingContext().getObject();
                        lineAmount = oCurrencyParse.parse(data.Desc) * Number(data.Man);
                        amount += lineAmount;
                        waers = (waers === '') ? data.Waers : 'JPY';
                    }
                }

                var oCurrencyFormat = NumberFormat.getCurrencyInstance({ showMeasure: false });
                if (sSumFieldId) {
                    var sFormatAmount = oCurrencyFormat.format(amount, waers);
                    this.byId(sSumFieldId).setText(sFormatAmount);
                }

                return amount;
            },

            _calcTableColumnSum: function (oContext, sBindingPath, sTableId, sColumnId, sSumFieldId) {
                var oCurrencyParse = NumberFormat.getFloatInstance();
                var aItems = oContext.byId(sTableId).getRows();
                var amount = 0, waers = '', lineAmount = 0;
                var oBindingContext, oData;
                for (var item of aItems) {
                    if (sBindingPath) {
                        oBindingContext = item.getBindingContext(sBindingPath);
                        // data = item.getBindingContext(sBindingPath).getObject();
                    } else {
                        oBindingContext = item.getBindingContext();
                        // data = item.getBindingContext().getObject();
                    }

                    if (oBindingContext) {
                        oData = oBindingContext.getObject();
                        var colVal = "0";
                        if (oData[sColumnId]) {
                            colVal = oData[sColumnId].toString();
                        }
                        lineAmount = oCurrencyParse.parse(colVal);
                        amount += lineAmount;
                        waers = (waers === '') ? oData.Waers : 'JPY';
                    }
                }

                if (sSumFieldId != null) {
                    var oCurrencyFormat = NumberFormat.getCurrencyInstance({ showMeasure: false });
                    this.byId(sSumFieldId).setText(oCurrencyFormat.format(amount, waers));
                }

                return amount;
            },

            onEffectiveCashManChange: function (oEvent) {
                //Sum VIII
                this._sum.YuukouGkiAmt = this._calcCashSumAmount(this, "tabEffectiveCash", null);
                //Sum [Ⅷ]+[Ⅸ]+[Ⅹ]+[Ⅺ]
                this.onCalcYokuzitunyuukin(oEvent);
            },

            onLossCashManChange: function (oEvent) {
                //Sum IX
                this._sum.HasonGkiAmt = this._calcCashSumAmount(this, "tabLossCash", null);

                //Sum [Ⅷ]+[Ⅸ]+[Ⅹ]+[Ⅺ]
                this.onCalcYokuzitunyuukin(oEvent);
            },

            onPlanCashAmountChange: function (oEvent) {
                //Sum X
                this._sum.ZyunbikinGkiAmt = this._calcTableColumnSum(this, null, "tabPlanCash", "Amount", null);

                //Sum [Ⅷ]+[Ⅸ]+[Ⅹ]+[Ⅺ]
                this.onCalcYokuzitunyuukin(oEvent);
            },

            onTabInCashRowUpdate: function (oEvent) {
                //sum 6.
                this._sum.SonotaNyukinKei = this._calcTableColumnSum(this, "InCash", "tabInCash", "NyknKingaku", null);

                //A:  3 + 5 + 6
                this._sum.SyunyuGokei = this._calcCurrencySum(this._sum.GenkinUragGokei,
                    this._sum.KadoHanbaiGokei,
                    this._sum.SonotaNyukinKei);

                //Sum I - II + III + A - B   
                this.onCalcHnjtsKrkshdk(oEvent);

                //A - B
                this._sum.HnjtsHnshSofukin = this._sum.SyunyuGokei - this._sum.ShishutsuGokei;

                //送付金合计 A - B + ZnjtsHnshSfknRk + RyogaekinModoshi;
                this.onCalcSofukinGokei(oEvent);

                //本日繰越高内訳合計 = 送付金合计(A - B + 前日までの本社送付金累計 + 両替金戻し) + 規定元金金額
                this.onCalcHnjtsKrkshdkUgki(oEvent);
            },

            onTabOutCashRowUpdate: function (oEvent) {

                //sum 7.
                this._sum.SonotaShunyuKei = this._calcTableColumnSum(this, "OutCash", "tabOutCash", "ShknKingaku", null);

                //B: sum: 7 + 8
                this._sum.ShishutsuGokei = this._calcCurrencySum(this._sum.SonotaShunyuKei, this._sum.KeihinShirdk);

                //Sum I - II + III + A - B   
                this.onCalcHnjtsKrkshdk(oEvent);

                //A - B
                this._sum.HnjtsHnshSofukin = this._sum.SyunyuGokei - this._sum.ShishutsuGokei;

                //送付金合计 A - B + ZnjtsHnshSfknRk + RyogaekinModoshi;
                this.onCalcSofukinGokei(oEvent);

                //本日繰越高内訳合計 = 送付金合计(A - B + 前日までの本社送付金累計 + 両替金戻し) + 規定元金金額
                this.onCalcHnjtsKrkshdkUgki(oEvent);
            },

            _calcFieldsSum(...fields) {
                var oCurrencyParse = NumberFormat.getFloatInstance();
                var sum = 0;
                for (var f of fields) {
                    var fVal = this.byId(f).getValue();
                    fVal = this._convertInputValue(fVal);

                    sum += oCurrencyParse.parse(fVal);
                }

                return sum;
            },

            _calcCurrencySum(...fields) {
                var oCurrencyParse = NumberFormat.getFloatInstance();
                var sum = 0;
                for (var f of fields) {
                    sum += oCurrencyParse.parse(f.toString());
                }

                return sum;
            },

            onCalcPUriage: function (oEvent) {
                //1. a + b
                this._sum.PUriage = this._calcFieldsSum("txtPGenkinUriage", "txtPCardUriage");

                //3. a + c
                this._sum.GenkinUragGokei = this._calcFieldsSum("txtPGenkinUriage", "txtSGenkinUriage");

                //4. 1 + 2
                this._sum.UriageSogokei = this._calcCurrencySum(this._sum.PUriage, this._sum.SUriage);

                //A:  3 + 5 + 6
                this._sum.SyunyuGokei = this._calcCurrencySum(this._sum.GenkinUragGokei,
                    this._sum.KadoHanbaiGokei,
                    this._sum.SonotaNyukinKei);

                //Sum I - II + III + A - B   
                this.onCalcHnjtsKrkshdk(oEvent);

                //A - B
                this._sum.HnjtsHnshSofukin = this._sum.SyunyuGokei - this._sum.ShishutsuGokei;

                //送付金合计 A - B + ZnjtsHnshSfknRk + RyogaekinModoshi;
                this.onCalcSofukinGokei(oEvent);

                //本日繰越高内訳合計 = 送付金合计(A - B + 前日までの本社送付金累計 + 両替金戻し) + 規定元金金額
                this.onCalcHnjtsKrkshdkUgki(oEvent);
            },

            onCalcSUriage: function (oEvent) {
                //2.c + d
                this._sum.SUriage = this._calcFieldsSum("txtSGenkinUriage", "txtSCardUriage");

                //3. a + c
                this._sum.GenkinUragGokei = this._calcFieldsSum("txtPGenkinUriage", "txtSGenkinUriage");

                //4. 1 + 2 
                this._sum.UriageSogokei = this._calcCurrencySum(this._sum.PUriage, this._sum.SUriage);

                //A: 3 + 5 + 6
                this._sum.SyunyuGokei = this._calcCurrencySum(this._sum.GenkinUragGokei,
                    this._sum.KadoHanbaiGokei,
                    this._sum.SonotaNyukinKei);

                //Sum I - II + III + A - B   
                this.onCalcHnjtsKrkshdk(oEvent);

                //A - B
                this._sum.HnjtsHnshSofukin = this._sum.SyunyuGokei - this._sum.ShishutsuGokei;

                //送付金合计 A - B + ZnjtsHnshSfknRk + RyogaekinModoshi;
                this.onCalcSofukinGokei(oEvent);

                //本日繰越高内訳合計 = 送付金合计(A - B + 前日までの本社送付金累計 + 両替金戻し) + 規定元金金額
                this.onCalcHnjtsKrkshdkUgki(oEvent);
            },

            onCalcKadoHanbaiGokei: function (oEvent) {
                //sum 5.
                var oCurrencyParse = NumberFormat.getFloatInstance();
                var fHanbaiAmt = this.byId("txtHanbaiAmt").getValue();
                var fSekisanAmt = this.byId("txtSekisanAmt").getValue();

                fHanbaiAmt = this._convertInputValue(fHanbaiAmt);
                fSekisanAmt = this._convertInputValue(fSekisanAmt);

                //5.
                this._sum.KadoHanbaiGokei = oCurrencyParse.parse(fHanbaiAmt) - oCurrencyParse.parse(fSekisanAmt);

                //A: 3 + 5 + 6
                this._sum.SyunyuGokei = this._calcCurrencySum(this._sum.GenkinUragGokei,
                    this._sum.KadoHanbaiGokei,
                    this._sum.SonotaNyukinKei);

                //Sum I - II + III + A - B   
                this.onCalcHnjtsKrkshdk(oEvent);

                //A - B
                this._sum.HnjtsHnshSofukin = this._sum.SyunyuGokei - this._sum.ShishutsuGokei;

                //送付金合计 A - B + ZnjtsHnshSfknRk + RyogaekinModoshi;
                this.onCalcSofukinGokei(oEvent);

                //本日繰越高内訳合計 = 送付金合计(A - B + 前日までの本社送付金累計 + 両替金戻し) + 規定元金金額
                this.onCalcHnjtsKrkshdkUgki(oEvent);
            },

            _convertInputValue(sVal) {
                if (sVal === undefined || sVal === null || sVal.trim() === '') {
                    return '0';
                }

                return sVal;
            },

            onCalcHnjtsKrkshdk: function (oEvent) { 
                //Sum I - II + III + A - B
                var oCurrencyParse = NumberFormat.getFloatInstance();
                var fZnjtsKrkshGankin = this.byId("txtZnjtsKrkshGankin").getValue();
                var fGnkNyukinSogaku = this.byId("txtGnkNyukinSogaku").getValue();
                var fRyogaekinUkeire = this.byId("txtRyogaekinUkeire").getValue();

                fZnjtsKrkshGankin = this._convertInputValue(fZnjtsKrkshGankin);
                fGnkNyukinSogaku = this._convertInputValue(fGnkNyukinSogaku);
                fRyogaekinUkeire = this._convertInputValue(fRyogaekinUkeire);

                this._sum.HnjtsKrkshdk = oCurrencyParse.parse(fZnjtsKrkshGankin) -
                    oCurrencyParse.parse(fGnkNyukinSogaku) +
                    oCurrencyParse.parse(fRyogaekinUkeire) +
                    oCurrencyParse.parse(this._sum.SyunyuGokei.toString()) -
                    oCurrencyParse.parse(this._sum.ShishutsuGokei.toString());
            },

            onCalcSofukinGokei: function (oEvent) {
                //送付金合计 A - B + ZnjtsHnshSfknRk + RyogaekinModoshi;
                var fZnjtsHnshSfknRk = this.byId("txtZnjtsHnshSfknRk").getValue();
                var fRyogaekinModoshi = this.byId("txtRyogaekinModoshi").getValue();

                fZnjtsHnshSfknRk = this._convertInputValue(fZnjtsHnshSfknRk);
                fRyogaekinModoshi = this._convertInputValue(fRyogaekinModoshi);

                var oCurrencyParse = NumberFormat.getFloatInstance();

                this._sum.SofukinGokei = this._sum.HnjtsHnshSofukin
                    + oCurrencyParse.parse(fZnjtsHnshSfknRk)
                    + oCurrencyParse.parse(fRyogaekinModoshi);
            },

            onCalcHnjtsKrkshdkUgki: function (oEvent) {
                //本日繰越高内訳合計 = 送付金合计(A - B + 前日までの本社送付金累計 + 両替金戻し) + 規定元金金額
                var oCurrencyParse = NumberFormat.getFloatInstance();
                var fKiteiGankinAmt = this.byId("txtKiteiGankinAmt").getValue();
                fKiteiGankinAmt = this._convertInputValue(fKiteiGankinAmt);

                this._sum.HnjtsKrkshdkUgki = this._sum.SofukinGokei + oCurrencyParse.parse(fKiteiGankinAmt);
            },

            onCalcYokuzitunyuukin: function (oEvent) { 
                //Sum XI
                this._sum.Yokuzitunyuukin = this._calcFieldsSum("txtYokuzitusohukin", "txtYokuzituryougaekin");

                //Sum [Ⅷ]+[Ⅸ]+[Ⅹ]+[Ⅺ]
                this._sum.Yokuzitukinkonai = this._calcCurrencySum(this._sum.YuukouGkiAmt,
                    this._sum.HasonGkiAmt,
                    this._sum.ZyunbikinGkiAmt,
                    this._sum.Yokuzitunyuukin
                );

                //Sum XII - IV
                this._sum.Sagaku = this._sum.Yokuzitukinkonai - this._sum.HnjtsKrkshdkUgki;

            }


        });
    });