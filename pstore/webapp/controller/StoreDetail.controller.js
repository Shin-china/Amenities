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
                this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
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
                var mode = oEvent.getParameter("arguments").mode;
                var sPath = "/" + this._path;

                var oView = this.getView();
                this._InCashSet = [];
                this._OutCashSet = [];
                this._Error = false;
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

                var that = this;

                var oModel = this.getView().getModel();

                oView.bindElement({
                    path: sPath,
                    parameters: {
                        expand: "GoodsSet,EffectiveCashSet,LossCashSet,PlanCashSet"
                    },
                    events: {
                        dataReceived: function (oResponse) {
                            var oData = oResponse.mParameters.data;
                            that._KaishaCd = oData.KaishaCd;
                            that._TenpoCd = oData.TenpoCd;
                            that._EigyoBi = oData.EigyoBi;
                            that._KihyoNo = oData.KihyoNo; 
                            // var title = that._comm.getI18nMessage(that, "detail_title");
                            // title = title.concat(" " + oData.KihyoNo);
                            var title
                            if (mode === 'C') {
                                title = that._comm.getI18nMessage(that, "detail_title");
                            } else {
                                title = oData.KihyoNo;
                            }
                            that.byId("detailPage").setTitle(title);
                            that._sum.PUriage = oData.PUriage;
                            that._sum.SUriage = oData.SUriage;
                            that._sum.GenkinUragGokei = oData.GenkinUragGokei;
                            that._sum.UriageSogokei = oData.UriageSogokei;
                            that._sum.KadoHanbaiGokei = oData.KadoHanbaiGokei;
                            that._sum.SonotaNyukinKei = oData.SonotaNyukinKei;
                            that._sum.SonotaShunyuKei = oData.SonotaShunyuKei;
                            that._sum.SyunyuGokei = oData.SyunyuGokei;
                            that._sum.KeihinShirdk = oData.KeihinShirdk;
                            that._sum.ShishutsuGokei = oData.ShishutsuGokei;
                            that._sum.HnjtsKrkshdk = oData.HnjtsKrkshdk;
                            that._sum.HnjtsHnshSofukin = oData.HnjtsHnshSofukin;
                            that._sum.SofukinGokei = oData.SofukinGokei;
                            that._sum.HnjtsKrkshdkUgki = oData.HnjtsKrkshdkUgki;
                            that._sum.Yokuzitunyuukin = oData.Fi1007.Yokuzitunyuukin;
                            that._sum.YuukouGkiAmt = oData.Fi1007.YuukouGkiAmt;
                            that._sum.HasonGkiAmt = oData.Fi1007.HasonGkiAmt;
                            that._sum.ZyunbikinGkiAmt = oData.Fi1007.ZyunbikinGkiAmt;
                            that._sum.Yokuzitukinkonai = oData.Fi1007.Yokuzitukinkonai;
                            that._sum.Sagaku = oData.Fi1007.Sagaku;


                            var oSumModel = new JSONModel(that._sum, "sum");
                            that.getView().setModel(oSumModel, "sum");
                        },
                        change: function (oEvent) {
                            // Get the context binding object
                            var oContextBinding = oEvent.getSource();

                            // Refresh the binding.
                            // This triggers a network call.
                            oContextBinding.refresh(false);
                        }.bind(this)
                    }
                });



                var sInCashPath = sPath + "/InCashSet";
                oModel.read(sInCashPath, {
                    success: function (oResponse) {
                        that._InCashSet = oResponse.results;
                        var oInCashModel = new JSONModel(that._InCashSet);
                        that.getView().setModel(oInCashModel, "InCash");
                    }
                });

                var sOutCashPath = sPath + "/OutCashSet";
                oModel.read(sOutCashPath, {
                    success: function (oResponse) {
                        that._OutCashSet = oResponse.results;
                        var oOutCashModel = new JSONModel(that._OutCashSet);
                        that.getView().setModel(oOutCashModel, "OutCash");
                    }
                });


                //每次进入详细页面，默认会保存上一次的section，滚动到页头第一个section
                var oPageLayout = this.byId("objectPageLayout");
                oPageLayout.scrollToSection(this.byId("section1").getId());

                if(mode === 'C'){
                    this._viewState.editable = true;
                }else{
                    this._viewState.editable = false;
                }

                var viewStateModel = new sap.ui.model.json.JSONModel(this._viewState);
                oView.setModel(viewStateModel, "viewState");

                this.byId("btnMessagePopover").setVisible(false);
                this.byId("btnChange").setText( this._comm.getI18nMessage(this, "footer_f2"));
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
                // that._comm.removeAllMessages();
                // this._comm.showMessagePopoverFor(that, "log", "", "btnMessagePopover");
                this.byId("btnMessagePopover").setVisible(false);
                var checkOk = this.checkEditData();
                if (!checkOk || this._Error == true) {
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

                d.EffectiveCashSet = this._comm.getTableData(this, "tabEffectiveCash", null);
                d.LossCashSet = this._comm.getTableData(this, "tabLossCash", null);
                d.PlanCashSet = this._comm.getTableData(this, "tabPlanCash", "Amount");
                d.InCashSet = this._InCashSet;//this._comm.getTableData(this, "tabInCash");
                d.OutCashSet = this._OutCashSet;//this._comm.getTableData(this, "tabOutCash");
                d.InCashSet = this._comm.convertCashData(d.InCashSet);
                d.OutCashSet = this._comm.convertCashData(d.OutCashSet);

                delete d.__metadata;

                d.Fi1007 = this._comm.convertJsonNumberToString(d.Fi1007);
                d.EffectiveCashSet = this._comm.convertCashData(d.EffectiveCashSet);
                d.PlanCashSet = this._comm.convertCashData(d.PlanCashSet);
                d.LossCashSet = this._comm.convertCashData(d.LossCashSet);
                d.GoodsSet = this._comm.convertCashData(d.GoodsSet);
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
                        //oModel.refresh();
                    },
                    error: function (oError) {
                        that._busyDialog.close();
                        MessageToast.show('OData Error:' + oError.message);
                    }
                });



            },

            onChange: function () {
                // this._viewState.editable = true;
                // this.getView().getModel("viewState").refresh();

                var isEdit = this._viewState.editable;
                if (isEdit) {
                    this._viewState.editable = false;
                    // this.setText( this._comm.getI18nMessage(this, "footer_f2_2"));
                    this.byId("btnChange").setText( this._comm.getI18nMessage(this, "footer_f2"));
                } else {
                    this._viewState.editable = true;
                    this.byId("btnChange").setText( this._comm.getI18nMessage(this, "footer_f2_2"));
                }
                this.getView().getModel("viewState").refresh();
            },

            onRequest: function () {
                this._comm.openDialog(this, "com.shin.pstore.pstore.view.ApplyConfirm");
            },
            onApplyConfirm: function () {
                this._busyDialog = new sap.m.BusyDialog({});
                this._busyDialog.open();
                var that = this;

                var elem = this.getView().getBindingContext();
                var oModel = elem.getModel();
                var d = elem.getObject();

                //Deep Entities
                d.GoodsSet = []

                d.EffectiveCashSet = [];
                d.LossCashSet = [];
                d.PlanCashSet = [];
                d.InCashSet = [];
                d.OutCashSet = [];
                d.InCashSet = [];
                d.OutCashSet = [];
                delete d.__metadata;

                d.Fi1007 = [];

                var o = {};
                d.MessageSet = [];
                d.Action = 'R';
                // 获取申请是时的备注
                d.COMMENTS = this.byId("idApplyConfirm").getValue();
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
                this._comm.closeDialog(this, "applyConfirmDialog");
            },
            onCloseApplyConfirmDialog: function () {
                this._comm.closeDialog(this, "applyConfirmDialog");
            },
            onGenerate: function () {
                // var checkOk = this.checkEditData();
                // if (!checkOk) {
                //     return;
                // }

                this._busyDialog = new sap.m.BusyDialog({});
                this._busyDialog.open();
                var that = this;

                var elem = this.getView().getBindingContext();
                var oModel = elem.getModel();
                var d = elem.getObject();

                //Deep Entities
                d.GoodsSet = []

                d.EffectiveCashSet = [];
                d.LossCashSet = [];
                d.PlanCashSet = [];
                d.InCashSet = [];
                d.OutCashSet = [];
                d.InCashSet = [];
                d.OutCashSet = [];
                delete d.__metadata;

                d.Fi1007 = [];

                var o = {};
                d.MessageSet = [];
                d.Action = 'G';

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
                // oContext.byId(sTabName).setFirstVisibleRow(index);
            },

            onCashCheckBox: function (oEvent) {
                // var sPath = oEvent.getSource().getBindingContext("local").sPath;
                // this._LocalData.setProperty(sPath + "/Jidoutenkifuyo", oEvent.getParameter("selected"));
            },

            _deleteRow: function (oContext, sModelName, sTabName, sBindingProperty, oEvent) {
                // var sPath = "";
                var oTable = this.byId(sTabName);
                var aSelectedPaths = oTable.getSelectedContextPaths();
                var aSelectedIndex = [];
                aSelectedPaths.forEach( element => {
                    aSelectedIndex.push(parseInt(element.substring(1)));
                });
                var oModel = oContext.getView().getModel(sModelName);
                var aCahsModel = oModel.getData();
                
                aSelectedIndex.sort();
                aSelectedIndex.reverse();
                aSelectedIndex.forEach( element => {
                    aCahsModel.splice(element,1);
                });
                oTable.removeSelections();
                oModel.refresh();
            },

            // _deleteRow: function (oContext, sModelName, sTabName, sBindingProperty, oEvent) {
            //     var indices = oContext.byId(sTabName).getSelectedIndices();
            //     var oModel = oContext.getView().getModel(sModelName);
            //     oContext[sBindingProperty] = oModel.getData();
            //     for (var i of indices) {
            //         var oSelObj = oContext.byId(sTabName).getContextByIndex(i).getObject();
            //         var sMeisaiNo = oSelObj.MeisaiNo;

            //         if (sMeisaiNo) {
            //             for (var j = 0; j < oContext[sBindingProperty].length; j++) {
            //                 if (oContext[sBindingProperty][j].MeisaiNo === sMeisaiNo) {
            //                     oContext[sBindingProperty][j].Loekz = true;
            //                 }
            //             }
            //         }
            //     }

            //     oModel.refresh();

            //     var filter = [];
            //     filter.push(new sap.ui.model.Filter("Loekz", sap.ui.model.FilterOperator.EQ, false));

            //     oContext.byId(sTabName).getBinding("rows").filter(new sap.ui.model.Filter(filter, true));

            // },

            onTabInCashAdd: function (oEvent) {
                var oNewObj = {};
                oNewObj.Loekz = false;
                oNewObj.KaishaCd = this._KaishaCd;
                oNewObj.TenpoCd = this._TenpoCd;
                oNewObj.EigyoBi = this._EigyoBi;
                oNewObj.KihyoNo = this._KihyoNo;
                oNewObj.KeijoBusho = "";
                oNewObj.DrkamokuCd = "111000";
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
                this.onTabInCashRowUpdate(oEvent);
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
                this.onTabOutCashRowUpdate(oEvent);
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
                this.onSetDefaultValue(oEvent);
                this.onInpuValidation(oEvent,'6','0');
                if (this._Error) {
                    return;
                };

                var aItems = this.byId("tabGoods").getRows();
                var amount = 0, waers = '', lineAmount = 0;
                for (var item of aItems) {
                    var data = item.getBindingContext().getObject();
                    var qty = Number(data.SyohinShirSu);
                    lineAmount = Math.round(qty * Number(data.SyohinTanka), 0);
                    amount += lineAmount;
                    waers = (waers === '') ? data.Waers : 'JPY';
                }

                // 7.
                this._sum.KeihinShirdk = amount;

                //B: sum 7 + 8
                this._sum.ShishutsuGokei = this._calcCurrencySum(this._sum.SonotaShunyuKei, this._sum.KeihinShirdk);

                //送付金合计A-B
                this._sum.HnjtsHnshSofukin = this._sum.SyunyuGokei - this._sum.ShishutsuGokei;

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
                this.onSetDefaultValue(oEvent);
                //sum 6.
                // this._sum.SonotaNyukinKei = this._calcTableColumnSum(this, "InCash", "tabInCash", "NyknKingaku", null);
                this._sum.SonotaNyukinKei = this._collectionIncome(this, "InCash", "NyknKingaku");

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
                this.onSetDefaultValue(oEvent);
                //sum 7.
                // this._sum.SonotaShunyuKei = this._calcTableColumnSum(this, "OutCash", "tabOutCash", "ShknKingaku", null);
                this._sum.SonotaShunyuKei = this._collectionIncome(this, "OutCash", "ShknKingaku");

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

            _collectionIncome: function (oContext, sBindingPath, sColumnId) {
                // this.setValueToZero(oEvent);
                var oModel = oContext.getView().getModel(sBindingPath);
                var aTable = oModel.getData();
                var total = "0";
                aTable.forEach(function (line) {
                    total = this.formatter.accAdd(total, line[sColumnId]);
                }.bind(oContext));
                return total;
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

                this.onSetDefaultValue(oEvent);
                this.onInpuValidation(oEvent,'15','2');
                if (this._Error) {
                    return;
                };
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
                this.onSetDefaultValue(oEvent);
                this.onInpuValidation(oEvent,'15','2');
                if (this._Error) {
                    return;
                };
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
                this.onSetDefaultValue(oEvent);
                this.onInpuValidation(oEvent,'15','2');
                if (this._Error) {
                    return;
                };
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

            onCalcHnjtsKrkshdk:function (oEvent,precision,scale) {
                this.onSetDefaultValue(oEvent);
                // this.onInpuValidation(oEvent,'15','2');
                this.onInpuValidation(oEvent,precision,scale);
                
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

                // this._sum.HnjtsKrkshdkUgki = this._sum.HnjtsKrkshdk;   
            },

            onCalcSofukinGokei: function (oEvent) {
                this.onSetDefaultValue(oEvent);
                this.onInpuValidation(oEvent,'15','2');
                if (this._Error) {
                    return;
                }; 
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
                this.onSetDefaultValue(oEvent);
                this.onInpuValidation(oEvent,'15','2');
                if (this._Error) {
                    return;
                }; 
                //本日繰越高内訳合計 = 送付金合计(A - B + 前日までの本社送付金累計 + 両替金戻し) + 規定元金金額
                var oCurrencyParse = NumberFormat.getFloatInstance();
                var fKiteiGankinAmt = this.byId("txtKiteiGankinAmt").getValue();
                fKiteiGankinAmt = this._convertInputValue(fKiteiGankinAmt);

                this._sum.HnjtsKrkshdkUgki = this._sum.SofukinGokei + oCurrencyParse.parse(fKiteiGankinAmt);
            },

            onCalcYokuzitunyuukin: function (oEvent) {

                this.onSetDefaultValue(oEvent);
                this.onInpuValidation(oEvent,'15','2');
                if (this._Error) {
                    return;
                };

                this.onSetDefaultValue(oEvent);
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

            },

            onShowKeijoBusho: function (oEvent) {

                var aFilters = [];
                var filter = { field: "Kokrs", value: this._KaishaCd };
                aFilters.push(filter);

                this._comm.showCustomSearchHelpDialog(
                    this,
                    oEvent,
                    this._comm.getI18nMessage(this, "tab3_col1"),
                    "com.shin.pstore.pstore.view.SearchHelp",
                    "ProfitCenterSet",
                    "Prctr",
                    aFilters);
            },

            onShowCreditAccount: function (oEvent) {
                var aFilters = [];
                this._comm.showCustomSearchHelpDialog(
                    this,
                    oEvent,
                    this._comm.getI18nMessage(this, "tab3_col2_1"),
                    "com.shin.pstore.pstore.view.SearchHelp",
                    "B01AccountSet",
                    "Hkont",
                    aFilters);
            },

            onShowNyknKamokuCd: function (oEvent) {
                var aFilters = [];
                // var filter = { field: "Ktopl", value: this._KaishaCd };
                var filter = { field: "Ktopl", value: "1000" };
                aFilters.push(filter);
                this._comm.showCustomSearchHelpDialog(
                    this,
                    oEvent,
                    this._comm.getI18nMessage(this, "tab3_col5"),
                    "com.shin.pstore.pstore.view.SearchHelp",
                    "AccountSet",
                    "Saknr",
                    aFilters);
            },

            onShowKeihiFutanBusho: function (oEvent) {
                var aFilters = [];
                var filter = { field: "Kokrs", value: this._KaishaCd };
                aFilters.push(filter);
                this._comm.showCustomSearchHelpDialog(
                    this,
                    oEvent,
                    this._comm.getI18nMessage(this, "tab3_col1"),
                    "com.shin.pstore.pstore.view.SearchHelp",
                    "CostCenterSet",
                    "Kostl",
                    aFilters);
            },

            onShowInCashTax: function (oEvent) {
                var aFilters = [];
                aFilters.push({ field: "Mwart", value: 'A' });
                this._comm.showCustomSearchHelpDialog(
                    this,
                    oEvent,
                    this._comm.getI18nMessage(this, "tab3_col7"),
                    "com.shin.pstore.pstore.view.SearchHelp",
                    "TaxSet",
                    "Mwskz",
                    aFilters);
            },

            onShowShknKamokuCd: function (oEvent) {
                var aFilters = [];
                // var filter = { field: "Ktopl", value: this._KaishaCd };
                var filter = { field: "Ktopl", value: "1000" };
                aFilters.push(filter);
                this._comm.showCustomSearchHelpDialog(
                    this,
                    oEvent,
                    this._comm.getI18nMessage(this, "tab3_col5"),
                    "com.shin.pstore.pstore.view.SearchHelp",
                    "AccountSet",
                    "Saknr",
                    aFilters);
            },

            onShowOutCashTax: function (oEvent) {
                var aFilters = [];
                aFilters.push({ field: "Mwart", value: "V" });
                this._comm.showCustomSearchHelpDialog(
                    this,
                    oEvent,
                    this._comm.getI18nMessage(this, "tab3_col7"),
                    "com.shin.pstore.pstore.view.SearchHelp",
                    "TaxSet",
                    "Mwskz",
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

            _getAccountDesc: function (oEvent, sBindingPath,sModelName) {
                var oInput = oEvent.getSource();
                var account = oInput.getValue();
                // var oBindingContext = oInput.getParent().getRowBindingContext();
                var oBindingContext = oInput.getParent().getBindingContext(sModelName);
                var sPath = oBindingContext.sPath + sBindingPath;
                var oModel = oBindingContext.getModel();

                var oDataModel = this.getView().getModel();
                // var sReadPath = "/AccountSet(Ktopl='" + this._KaishaCd + "',Saknr='" + account + "',Spras='J'" + ")";
                var sReadPath = "/AccountSet(Ktopl='" + "1000" + "',Saknr='" + account + "',Spras='J'" + ")";
                oDataModel.read(sReadPath, {
                    success: function (oData) {
                        if (oData.Txt20 === undefined || oData.Txt20 === null || oData.Txt20 === '') {
                            oInput.setValueState("Error");
                        } else {
                            oInput.setValueState("None");
                            oModel.setProperty(sPath, oData.Txt20);
                            //oModel.refresh();
                        }
                    },
                    error: function (oError) {
                        oInput.setValueState("Error");
                    }
                });
            },

            onGetNyknKamokuNm: function (oEvent) {
                this._getAccountDesc(oEvent, "/NyknKamokuNm", "InCash");
            },

            onGetShknKamokuNm: function (oEvent) {
                this._getAccountDesc(oEvent, "/ShknKamokuNm", "OutCash");
            },

            onDestroy : function(oEvent){
                var oSource = oEvent.getSource();
                if(oSource){
                    oSource.destroy();
                }
            },

            onSetDefaultValue: function(oEvent){ 
                var oSource = oEvent.getSource();
                var name = oSource.getMetadata().getName();
                if(name === 'sap.m.Input'){
                    var sVal = oSource.getValue().trim();
                    if(sVal === ''){ 
                        oSource.setValue("0");
                    }
                }
            },

            onSetDefaultValuetab1Col7: function(oEvent){ 
                this.onSetDefaultValue(oEvent);
                this.onInpuValidation(oEvent,'6','0');
                if (this._Error) {
                    return;
                }; 
            },

            onSetDefaultValuetab: function(oEvent){ 
                this.onSetDefaultValue(oEvent);
                this.onInpuValidation(oEvent,'15','2');
                if (this._Error) {
                    return;
                }; 
            },

            onInpuValidation: function (oEvent,precision,scale) {
                this.onSetDefaultValue(oEvent);

                var oFormat = NumberFormat.getFloatInstance();
                var iIntager = precision - scale;
                var oSource = oEvent.getSource();
                var value = oEvent.getParameter("value");
                if (value == "") {
                    value = "0";
                }
                value = oFormat.parse(value);
                // var value = oSource.getBindingContext().getObject().Amount;
                oSource.setValueState("None");
                this._Error = false;
                if (isNaN(value)) {
                    oSource.setValueState("Error");
                    oSource.setValueStateText(this._ResourceBundle.getText("notNumber"));
                    this._Error = true;
                } else {
                    var aSplitNumber = value.toString().split(".");
                    if (aSplitNumber[0].length > iIntager) {
                        oSource.setValueState("Error");
                        oSource.setValueStateText(this._ResourceBundle.getText("integerLengthError",[iIntager]));
                        this._Error = true;
                    }
                    if (aSplitNumber[1] && aSplitNumber[1].length > scale) {
                        oSource.setValueState("Error");
                        oSource.setValueStateText(this._ResourceBundle.getText("fractionLengthError",[scale]));
                        this._Error = true;
                    }
                }

            },

        });
    });