sap.ui.define([
	"./BaseController",
	"../../model/based/formatter",
    "./messages",
    "sap/m/MessageToast",
    "sap/m/Button",
    "sap/m/MessageBox",
    "sap/ui/core/message/Message",
    "sap/ui/core/library",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/HashChanger",
    "sap/ui/core/format/NumberFormat",
], function (BaseController, formatter, messages, MessageToast, Button, MessageBox, Message, library, Fragment, JSONModel, HashChanger,NumberFormat) {
	"use strict";
    // shortcut for sap.ui.core.MessageType
    var MessageType = library.MessageType;
	return BaseController.extend("FICO.dailybalanceapproval.controller.based.DailyBalance_based", {

		formatter : formatter,

		onInit: function () {
            this._LocalData = this.getOwnerComponent().getModel("local");
            this._oDataModel = this.getOwnerComponent().getModel("based");
            this._ResourceBundle = this.getOwnerComponent().getModel("i18n_based").getResourceBundle();

            var oMessageManager, oView;
			oView = this.getView();
            // set message model
			oMessageManager = sap.ui.getCore().getMessageManager();
            oView.setModel(oMessageManager.getMessageModel(), "messages");
            oMessageManager.registerObject(oView, true);

            this.oRouter = this.getRouter();
            this.oRouter.getRoute("DailyBalance_based").attachMatched(this._onRouteMatched, this);
            this.InitModel = this.getOwnerComponent().getModel("init");

            this.insertHistorySection();
            
		},

        //当路径导航到此页面时，设置页面的数据绑定
        _onRouteMatched : function (oEvent) {
            // set title
            this.byId("idDailyBalanceCreate").setTitle(this._LocalData.getProperty("/NodeName"));

            this._LocalData.setProperty("/processBusy", false);
            this.byId("idUser").setValueState("None");
            //localmodel中当前行的绑定路径
            var oArgs = oEvent.getParameter("arguments");
            // 显示界面
            this._LocalData.setProperty("/viewEditable", false);
            // this.byId("idChange").setVisible(true);
            // this.byId("idChange").setText(this._ResourceBundle.getText("ChangeButton"));

            if (oArgs.contextPath) {
                // 转换数据
                var sPath = "ZzShopDailyBalanceSet(" + oArgs.contextPath.split("(")[1];
                var oHeader = this._oDataModel.getProperty("/" + sPath);
                this.initialLocalModel_dis(oHeader);
                this.tableConverted_dis(sPath);
            }
            sap.ui.getCore().getMessageManager().removeAllMessages();

        },

        onAddLine: function (oEvent, sTableId) {
            var sPath = "";
            var iMaxLength = 0;
            if (sTableId == "idCashIncomeTable") {
                sPath = "/CashIncome";
                iMaxLength = 15;
            } else if (sTableId == "idCashPaymentTable") {
                sPath = "/CashPayment";
                iMaxLength = 25;
            }
            var aCashModel = this._LocalData.getProperty(sPath);
            if (aCashModel.length >= iMaxLength) {
                return;
            }
            if (sTableId == "idCashIncomeTable") {
                aCashModel.push({"NYKN_KINGAKU":"0"});
            } else if (sTableId == "idCashPaymentTable") {
                aCashModel.push({"SHKN_KINGAKU":"0"});
            }
            this._LocalData.refresh();
        },

        onDeleteLine: function (oEvent, sTableId) {
            var sPath = "";
            if (sTableId == "idCashIncomeTable") {
                sPath = "/CashIncome";
            } else if (sTableId == "idCashPaymentTable") {
                sPath = "/CashPayment";
            }
            var oTable = this.byId(sTableId);
            var aSelectedPaths = oTable.getSelectedContextPaths();
            var aSelectedIndex = [];
            aSelectedPaths.forEach( element => {
                aSelectedIndex.push(parseInt(element.substring(sPath.length + 1)));
            });
            var aCahsModel = this._LocalData.getProperty(sPath);
            aSelectedIndex.sort();
            aSelectedIndex.reverse();
            aSelectedIndex.forEach( element => {
                aCahsModel.splice(element,1);
            });
            oTable.removeSelections();
            this.collectionIncome();
            this.collectionPayment();
            this._LocalData.refresh();
        },

        onMulti: function (oEvent, sParam) {
            var oFormat = NumberFormat.getFloatInstance();
            this.setValueToZero(oEvent);
            var value = oEvent.getSource().getValue();
            value = oFormat.parse(value);
            try {
                value = this.formatter.accMul(value, sParam);
            } catch (e) {}
            var sPath = oEvent.getSource().getBindingContext("local").getPath();
            this._LocalData.setProperty(sPath + "/Amount",value);
            var sTablePath = "/" + sPath.split("/")[1];
            var oTable = this._LocalData.getProperty(sTablePath);
            var total = "";
            oTable.Item.forEach(function (line) {
                total = this.formatter.accAdd(total,line.Amount);
            }.bind(this));
            var sTotalPath = "/" + sPath.split("/")[1] + "/Total";
            this._LocalData.setProperty(sTotalPath, total);

            this.onCurrencyTable4ValueChange();
        },

        // 日记表数据保存
        onBalanceSave: function (sAction) {
            if (this.checkRequired()) {
                MessageToast.show(this._ResourceBundle.getText("inputRequired"));
                return;
            }

            var oDailyBalance = this._LocalData.getProperty("/dailyBalance")[0];
            if (sAction == "Posting") {
                this.onConfirmBox(sAction);
            } else {
                var postDoc = this.prepareBalanceSaveBody();
                postDoc.EIGYO_BI = this.formatter.date_8(postDoc.EIGYO_BI);
                delete postDoc.__metadata;
                this.postBalanceSave(postDoc,sAction);
            }

        },

        onConfirmBox: function (sAction) {
            var sTitle = this._ResourceBundle.getText("ConfirmTitle");
            var sText = this._ResourceBundle.getText("PostingConfirmMsg");
            MessageBox.confirm(sText, {
                title: sTitle,
                icon: MessageBox.Icon.WARNING,
                styleClass: "sapUiSizeCompact",
                actions: [
                    MessageBox.Action.YES,
                    MessageBox.Action.NO
                ],
                onClose: function (sResult) {
                    if (sResult === MessageBox.Action.YES) {
                        var postDoc = this.prepareBalanceSaveBody();
                        postDoc.EIGYO_BI = this.formatter.date_8(postDoc.EIGYO_BI);
                        delete postDoc.__metadata;
                        this.postingTips(postDoc);
                        this.postBalanceSave(postDoc,sAction);
                    }
                }.bind(this)
            });
        },

        postingTips: function (postDoc) {
            var aIndex = [];
            var sTips = ""
            var sMessage = "";
            var aCash = postDoc.to_ZzCashIncome;
            aCash.forEach( function (line, index) {
                if (line.JIDOUTENKIFUYO) {
                    aIndex.push(index + 1);
                }
            });
            aIndex.forEach(function (rowIndex, index) {
                sMessage = sMessage + rowIndex;
                if (index < aIndex.length - 1) {
                    sMessage = sMessage + "、";
                }
            });
            if (sMessage) {
                sTips = this._ResourceBundle.getText("msg3", [sMessage]);
            }

            aIndex = [];
            sMessage = "";
            aCash = postDoc.to_ZzCashPayment;
            aCash.forEach( function (line, index) {
                if (line.JIDOUTENKIFUYO) {
                    aIndex.push(index + 1);
                }
            });
            if (aIndex.length > 0 && sTips) {
                sTips = sTips + "\n\r"
            }
            aIndex.forEach(function (rowIndex, index) {
                sMessage = sMessage + rowIndex;
                if (index < aIndex.length - 1) {
                    sMessage = sMessage + "、";
                }
            });
            if (sMessage) {
                sTips = sTips + this._ResourceBundle.getText("msg4", [sMessage]);
            }
            if (sTips) {
                messages.showText(sTips);
            }
            
        },


        // 准备保存需要的数据
        prepareBalanceSaveBody: function() {
            var aDailyBalance = this._LocalData.getProperty("/dailyBalance");
            aDailyBalance = JSON.parse(JSON.stringify(aDailyBalance));
            // 1.2.3.4.5
            var postDoc = aDailyBalance[0];
            // // 获取并转换数据
            // postDoc = this.convertTables(postDoc);
            //その他現金収入 その他現金支出
            this.getCashTable(postDoc);
            //金庫内現金内訳
            this.getTreasuryCash(postDoc);
            return postDoc;
        },

        postBalanceSave: function (postData, sAction) {
            this.convertToString(postData);
            var i = 1;
            var mParameters = {
                groupId: "DailyBalanceSave" + Math.floor(i / 100),
                changeSetId: i,
                success: function (oData) {
                    this.byId("idDailyBalanceCreate").setBusy(false);
                    this._LocalData.setProperty("/dailyBalance/0/KIHYO_NO", oData.KIHYO_NO);
                    this._LocalData.setProperty("/dailyBalance/0/NIKKEIHYO_STATUS_CD", oData.NIKKEIHYO_STATUS_CD);
                    this.byId("idDailyBalanceCreate").setTitle(oData.KIHYO_NO);
                    messages.showText(oData.Message);
                }.bind(this),
                error: function (oError) {
                    this.byId("idDailyBalanceCreate").setBusy(false);
                    this.removeLeadingMessage();
                }.bind(this),
            };
            this.getOwnerComponent().getModel("based").setHeaders({"button":sAction});
            //复杂结构
            this.getOwnerComponent().getModel("based").create("/ZzShopDailyBalanceSet", postData, mParameters);
            this.byId("idDailyBalanceCreate").setBusyIndicatorDelay(0);
            this.byId("idDailyBalanceCreate").setBusy(true);
        },

        convertToString: function (obj) {
            if (obj instanceof Object) {
                for (var item in obj) {
                    if (obj[item] instanceof Object) {
                        this.convertToString(obj[item]);
                    } else {
                        if (typeof obj[item] != "boolean" && !(obj[item] instanceof Date)) {
                            if (obj[item] == null || obj[item] == undefined) {
                                obj[item] = "";
                            } else {
                                obj[item] = obj[item].toString();
                            }
                        }
                    }
                }
            }
        },

        removeLeadingMessage: function () {postBalanceApply
            var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
            if (aMessages.length > 1) {
                if (
                    // 后端触发异常的方式会添加一个code为SY/530的leading message
                    aMessages[0].getCode() == "SY/530"
                ) {
                    sap.ui.getCore().getMessageManager().removeMessages(aMessages[0]);
                }
            }
        },

        // 获取 现金收入支出的值
        getCashTable: function (postDoc) {
            var aTable = [];
            aTable = this._LocalData.getProperty("/CashIncome");
            aTable = JSON.parse(JSON.stringify(aTable));
            postDoc.to_ZzCashIncome = aTable;

            aTable = this._LocalData.getProperty("/CashPayment");
            aTable = JSON.parse(JSON.stringify(aTable));
            postDoc.to_ZzCashPayment = aTable;

            return postDoc;
        },
        //获取 金庫内現金内訳
        getTreasuryCash: function (postDoc) {
            var convertedTable = {};
            var aTable1 = [], aTable2 = [], aTable3 = [], aTable4 = [];
            aTable1 = this._LocalData.getProperty("/CurrencyTable1/Item");
            aTable2 = this._LocalData.getProperty("/CurrencyTable2/Item");
            aTable3 = this._LocalData.getProperty("/CurrencyTable3/Item");
            aTable4 = this._LocalData.getProperty("/CurrencyTable4");
            //有効貨幣明細
            var aField1 = ["YUUKOU_MAISUU_1MAN", "YUUKOU_MAISUU_5SEN", "YUUKOU_MAISUU_2SEN", "YUUKOU_MAISUU_SEN", "YUUKOU_MAISUU_500EN",
                "YUUKOU_MAISUU_100EN", "YUUKOU_MAISUU_50EN", "YUUKOU_MAISUU_10EN", "YUUKOU_MAISUU_5EN", "YUUKOU_MAISUU_1EN"];
            aTable1.forEach(function (line, index) {
                convertedTable[aField1[index]] = line.Quantity;
            });
            convertedTable.YUUKOU_GKI_AMT = this._LocalData.getProperty("/CurrencyTable1/Total");
            //破損貨幣明細
            var aField2 = ["HASON_MAISUU_1MAN", "HASON_MAISUU_5SEN", "HASON_MAISUU_2SEN", "HASON_MAISUU_SEN", "HASON_MAISUU_500EN"];
            aTable2.forEach(function (line, index) {
                convertedTable[aField2[index]] = line.Quantity;
            });
            convertedTable.HASON_GKI_AMT = this._LocalData.getProperty("/CurrencyTable2/Total");
            //準備金明細
            var aField3 = ["ZYUNBIKIN_AMT_1", "ZYUNBIKIN_AMT_2", "ZYUNBIKIN_AMT_3", "ZYUNBIKIN_AMT_4", "ZYUNBIKIN_AMT_5", "ZYUNBIKIN_AMT_6"];
            aTable3.forEach(function (line, index) {
                convertedTable[aField3[index]] = line.Amount;
            });
            convertedTable.ZYUNBIKIN_GKI_AMT = this._LocalData.getProperty("/CurrencyTable3/Total");
            //送金予定明細
            var aField4 = ["YOKUZITUSOHUKIN", "YOKUZITURYOUGAEKIN", "YOKUZITUNYUUKIN", "YOKUZITUKINKONAI", "HONZITUKURIKOSI_SANSYO",
                "YOKUZITUKITEIMOTOKIN", "SAGAKU"];
            aTable4.forEach(function (line, index) {
                convertedTable[aField4[index]] = line.Amount;
            });

            convertedTable.BIKOU2 = this.byId("idBIKOU2").getValue();

            postDoc.to_ZzTreasuryCash = [convertedTable];
            return postDoc;
        },
        

        onTableColumnSum: function (oEvent,sId) {
            this.setValueToZero(oEvent);
            var oTable = this.byId(sId);
            var sTablePath = oTable.getBinding("rows").getPath();
            var aTable = this._LocalData.getProperty(sTablePath);
            var total = "";
            aTable.forEach(function (line) {
                total = this.formatter.accAdd(total,line.Amount);
            }.bind(this));
            var sTotalPath = "/" + sTablePath.split("/")[1] + "/Total";
            this._LocalData.setProperty(sTotalPath, total);
            
            this.onCurrencyTable4ValueChange();
        },

        onCurrencyTable4ValueChange: function (oEvent) {
            this.setValueToZero(oEvent);
            var total1 = this._LocalData.getProperty("/CurrencyTable1/Total");
            var total2 = this._LocalData.getProperty("/CurrencyTable2/Total");
            var total3 = this._LocalData.getProperty("/CurrencyTable3/Total");
            var aCurrencyTable4 = this._LocalData.getProperty("/CurrencyTable4");
            //本日繰越元金
            var amount1 = this._LocalData.getProperty("/dailyBalance/0/HNJTS_KRKSH_GANKIN");
            if (!amount1) {
                amount1 = "0";
            }
            //翌日銀行入金総額
            aCurrencyTable4[2].Amount = this.formatter.accAdd(aCurrencyTable4[0].Amount, aCurrencyTable4[1].Amount);
            //翌日金庫内現金総額
            aCurrencyTable4[3].Amount = this.formatter.accAdd(total1, total2);
            aCurrencyTable4[3].Amount = this.formatter.accAdd(aCurrencyTable4[3].Amount, total3);
            aCurrencyTable4[3].Amount = this.formatter.accAdd(aCurrencyTable4[3].Amount, aCurrencyTable4[2].Amount);

            //本日繰越高(日計表1枚目参照）
            aCurrencyTable4[4].Amount = amount1;
            //差額 [Ⅻ]-[Ⅳ]
            aCurrencyTable4[6].Amount = this.formatter.accSub(aCurrencyTable4[3].Amount, aCurrencyTable4[4].Amount);
            this._LocalData.refresh();
            
        },

        // 明细界面的值都会影响结果

        collectionIncome: function (oEvent) {
            this.setValueToZero(oEvent);
            var aTable = this._LocalData.getProperty("/CashIncome");
            var total = "0";
            aTable.forEach(function (line) {
                total = this.formatter.accAdd(total, line.NYKN_KINGAKU);
            }.bind(this));
            //その他現金収入合計
            this._LocalData.setProperty("/dailyBalance/0/SNT_GNKN_SHNY_GKI", total)
            //その他現金支出合計
            var result = this._LocalData.getProperty("/dailyBalance/0/SNT_GNKN_SHSHT_GKI")
            //収支差額
            result = this.formatter.accSub(total, result);
            var value = this._LocalData.getProperty("/dailyBalance/0/GENKIN_URIAGE");
            result = this.formatter.accAdd(value, result);
            this._LocalData.setProperty("/dailyBalance/0/SHUSHI_SAGAKU", result)
            this.resultCalc();
            this._LocalData.refresh();
        },
        collectionPayment: function (oEvent) {
            this.setValueToZero(oEvent);
            var aTable = this._LocalData.getProperty("/CashPayment");
            var total = "0";
            aTable.forEach(function (line) {
                total = this.formatter.accAdd(total, line.SHKN_KINGAKU);
            }.bind(this));
            //その他現金支出合計
            this._LocalData.setProperty("/dailyBalance/0/SNT_GNKN_SHSHT_GKI", total)
            //その他現金収入合計
            var result = this._LocalData.getProperty("/dailyBalance/0/SNT_GNKN_SHNY_GKI")
            //収支差額
            result = this.formatter.accSub(result, total);
            var value = this._LocalData.getProperty("/dailyBalance/0/GENKIN_URIAGE");
            result = this.formatter.accAdd(value, result);
            this._LocalData.setProperty("/dailyBalance/0/SHUSHI_SAGAKU", result)
            this.resultCalc();
            this._LocalData.refresh();
        },
        // Ⅳ本日繰越元金
        resultCalc: function (oEvent) {
            this.setValueToZero(oEvent);
            //前日繰越元金[Ⅰ]
            var value1 = this._LocalData.getProperty("/dailyBalance/0/ZNJTS_KRKSH_GANKIN");
            //その他現金収入合計[Ⅱ]
            var value2 = this._LocalData.getProperty("/dailyBalance/0/SNT_GNKN_SHNY_GKI");
            //その他現金支出合計[Ⅲ]
            var value3 = this._LocalData.getProperty("/dailyBalance/0/SNT_GNKN_SHSHT_GKI");
            //規定元金 [Ⅴ]
            var value4 = this._LocalData.getProperty("/dailyBalance/0/KITEI_GANKIN");
            //本日繰越元金 [Ⅳ]
            var result = "0";
            //本日繰越元金 [Ⅳ] = 前日繰越元金[Ⅰ] + その他現金収入合計[Ⅱ] - その他現金支出合計[Ⅲ]
            result = this.formatter.accAdd(value1, value2);
            result = this.formatter.accSub(result, value3);
            // result = this.formatter.accSub(result, value4);
            this._LocalData.setProperty("/dailyBalance/0/HNJTS_KRKSH_GANKIN", result);
            //銀行入金予定額 [Ⅵ] = 本日繰越元金 [Ⅳ] - 規定元金 [Ⅴ]
            result = this.formatter.accSub(result, value4);
            this._LocalData.setProperty("/dailyBalance/0/GNK_AZKR_YTIGK", result);
            //本日繰越高(日計表1枚目参照） [Ⅳ]
            this._LocalData.setProperty("/CurrencyTable4/4/Amount", result);
            //翌日金庫内現金総額  [Ⅻ]
            var value5 = this._LocalData.getProperty("/CurrencyTable4/3/Amount");
            //差額 [Ⅻ]-[Ⅳ]
            result = this.formatter.accSub(value5, result);
            this._LocalData.setProperty("/CurrencyTable4/6/Amount", result);
            // //Ⅶアムエリア振替(Ⅳ-Ⅵ)
            // this.resultCalc1();
            this._LocalData.refresh();
        },

        onSuspend: function () {
            this.onNavBackAndReresh();
        },

        tableConverted_dis: function (sKey) {
            var aHeaderKey = this._oDataModel.getProperty("/" + sKey + "/to_Header");
            var aCahsIncomKey = this._oDataModel.getProperty("/" + sKey + "/to_ZzCashIncome");
            var aCahsPaymentKey = this._oDataModel.getProperty("/" + sKey + "/to_ZzCashPayment");
            var aTreasuryCashKey = this._oDataModel.getProperty("/" + sKey + "/to_ZzTreasuryCash");

            //获取数据
            var oHeader = this._oDataModel.getProperty("/" + aHeaderKey[0]);
            oHeader = JSON.parse(JSON.stringify(oHeader));
            var aCahsIncome = [], aCahsPayment = [];
            aCahsIncomKey.forEach(function (path) {
                var item = this._oDataModel.getProperty("/" + path);
                delete item.__metadata;
                aCahsIncome.push(item);
            }.bind(this));
            aCahsPaymentKey.forEach(function (path) {
                var item = this._oDataModel.getProperty("/" + path);
                delete item.__metadata;
                aCahsPayment.push(item);
            }.bind(this));
            var oTreasuryCash = this._oDataModel.getProperty("/" + aTreasuryCashKey[0]);

            this.setLocalModel_dis(oHeader);

            // 转换数据
            this._LocalData.setProperty("/dailyBalance", [oHeader]);
            // this.byId("idSelectWeather").setSelectedKey(oHeader.TENKI);
            //その他現金収入/その他現金支出
            this.getCashTable_dis(aCahsIncome, aCahsPayment);
            //金庫内現金内訳
            this.getTreasuryCash_dis(oTreasuryCash);

            this._LocalData.refresh();
        },

        setLocalModel_dis: function (oHeader) {

            var shop = oHeader.TENPO_CD;
            var aFI0004 = this._LocalData.getProperty("/FI0004");
            var aCurrencyTable3 = this._LocalData.getProperty("/CurrencyTable3/Item");
            //準備金明細
            // var aFI0004a = aFI0004.filter( line => line.Value2 === shop);
            var aFI0004a = aFI0004;
            aCurrencyTable3.forEach(function (line, index) {
                //aFI0004a中的条目数可能少于aCurrencyTable3
                try {
                    line.Title = aFI0004a[index].Value4;
                } catch (e) {}
            });
            this._LocalData.setProperty("/CurrencyTable3/Item", aCurrencyTable3);

            this._LocalData.refresh();
        },

        // 获取 现金收入支出的值
        getCashTable_dis: function (aCahsIncome, aCahsPayment) {
            this._LocalData.setProperty("/CashIncome",aCahsIncome);
            this._LocalData.setProperty("/CashPayment",aCahsPayment);
        },
        //获取 金庫内現金内訳
        getTreasuryCash_dis: function (oTreasuryCash) {
            //aTreasuryCash 只有一条数据
            var convertedTable = {};
            var aTable1 = [], aTable2 = [], aTable3 = [], aTable4 = [];
            aTable1 = this._LocalData.getProperty("/CurrencyTable1/Item");
            aTable2 = this._LocalData.getProperty("/CurrencyTable2/Item");
            aTable3 = this._LocalData.getProperty("/CurrencyTable3/Item");
            aTable4 = this._LocalData.getProperty("/CurrencyTable4");

            //字段顺序必须与表格相同
            //有効貨幣明細
            var aField1 = ["YUUKOU_MAISUU_1MAN", "YUUKOU_MAISUU_5SEN", "YUUKOU_MAISUU_2SEN", "YUUKOU_MAISUU_SEN", "YUUKOU_MAISUU_500EN",
                "YUUKOU_MAISUU_100EN", "YUUKOU_MAISUU_50EN", "YUUKOU_MAISUU_10EN", "YUUKOU_MAISUU_5EN", "YUUKOU_MAISUU_1EN"];
            aTable1.forEach(function (line, index) {
                line.Quantity = oTreasuryCash[aField1[index]];
                line.Amount = this.formatter.accMul(line.Monetary, line.Quantity);
            }.bind(this));
            this._LocalData.setProperty("/CurrencyTable1/Total",oTreasuryCash.YUUKOU_GKI_AMT);
            //破損貨幣明細
            var aField2 = ["HASON_MAISUU_1MAN", "HASON_MAISUU_5SEN", "HASON_MAISUU_2SEN", "HASON_MAISUU_SEN", "HASON_MAISUU_500EN"];
            aTable2.forEach(function (line, index) {
                line.Quantity = oTreasuryCash[aField2[index]];
                line.Amount = this.formatter.accMul(line.Monetary, line.Quantity);
            }.bind(this));
            this._LocalData.setProperty("/CurrencyTable2/Total", oTreasuryCash.HASON_GKI_AMT);
            //準備金明細
            var aField3 = ["ZYUNBIKIN_AMT_1", "ZYUNBIKIN_AMT_2", "ZYUNBIKIN_AMT_3", "ZYUNBIKIN_AMT_4", "ZYUNBIKIN_AMT_5", "ZYUNBIKIN_AMT_6"];
            aTable3.forEach(function (line, index) {
                line.Amount = oTreasuryCash[aField3[index]];
            });
            // oTreasuryCash.ZYUNBIKIN_GKI_AMT = this._LocalData.getProperty("/CurrencyTable3/Total");
            this._LocalData.setProperty("/CurrencyTable3/Total", oTreasuryCash.ZYUNBIKIN_GKI_AMT);
            //送金予定明細
            var aField4 = ["YOKUZITUSOHUKIN", "YOKUZITURYOUGAEKIN", "YOKUZITUNYUUKIN", "YOKUZITUKINKONAI", "HONZITUKURIKOSI_SANSYO",
                "YOKUZITUKITEIMOTOKIN", "SAGAKU"];
            aTable4.forEach(function (line, index) {
                line.Amount = oTreasuryCash[aField4[index]];
            });

            this.byId("idBIKOU2").setValue(oTreasuryCash.BIKOU2);
        },
    

        initialLocalModel_dis: function (oHeader) {
            //清空日记表
            this._LocalData.setProperty("/dailyBalance",[{}]);
            this._LocalData.setProperty("/CashIncome", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CashIncome"))));
            this._LocalData.setProperty("/CashPayment", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CashPayment"))));
            this._LocalData.setProperty("/CurrencyTable1", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CurrencyTable1"))));
            this._LocalData.setProperty("/CurrencyTable2", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CurrencyTable2"))));
            this._LocalData.setProperty("/CurrencyTable3", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CurrencyTable3"))));
            this._LocalData.setProperty("/CurrencyTable4", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CurrencyTable4"))));
            
            this._LocalData.refresh();
        },

        /* onSelectWeather: function (oEvent) {
            this._LocalData.setProperty("/dailyBalance/0/TENKI", this.byId("idSelectWeather").getSelectedKey());
            this.changeValueState(oEvent);
        }, */

        onUserChange: function (oEvent) {
            this.changeValueState(oEvent);
        },

        changeValueState: function (oEvent) {
            if (oEvent.getParameter("value") == "") {
                oEvent.getSource().setValueState("Warning");
            } else {
                oEvent.getSource().setValueState("None");
            }
        },

        checkRequired: function () {
            var isError = false;
            if (this.byId("idUser").getValue() == "") {
                this.byId("idUser").setValueState("Warning");
                isError = true;
            } 
            /* if (this.byId("idSelectWeather").getSelectedKey() == "") {
                this.byId("idSelectWeather").setValueState("Warning");
                isError = true;
            }  */
            return isError;
        },

        onChangePress: function (oEvent) {
            var oDailyBalance = this._LocalData.getProperty("/dailyBalance")[0];

            var oButton = oEvent.getSource();
            var isEdit = this._LocalData.getProperty("/viewEditable");
            if (isEdit) {
                this._LocalData.setProperty("/viewEditable", false);
                oButton.setText(this._ResourceBundle.getText("ChangeButton"));

            } else {
                this._LocalData.setProperty("/viewEditable", true);
                oButton.setText(this._ResourceBundle.getText("DisplayButton"));
            }
        },

        onCashCheckBox: function (oEvent) {
            var sPath = oEvent.getSource().getBindingContext("local").sPath;
            this._LocalData.setProperty(sPath + "/JIDOUTENKIFUYO", oEvent.getParameter("selected"));
        },

        onNavBackAndReresh: function () {
            var filterbarDOM = $( "div[id$='smartFilterBarProcess']" );
            try {
                sap.ui.getCore().byId(filterbarDOM[filterbarDOM.length - 1].id).search();
            } catch (e) {}
            this.onNavBack();
        },

        onCheckInValueHelp: function(oEvent, valueHelpPath) {
            var sValue = oEvent.getParameter("value");
            var sCompany = this._LocalData.getProperty("/dailyBalance/0/KAISHA_CD");
            var aValueHelp = this._LocalData.getProperty("/" + valueHelpPath);
            if (valueHelpPath == "AccountVH" || valueHelpPath == "ProfitVH" || valueHelpPath == "CostVH") {
                var aFiltered = aValueHelp.filter( e => e.Key1 == sValue && e.Key2 == sCompany);
            } else {
                var aFiltered = aValueHelp.filter( e => e.Key1 == sValue);
            }
            var sPath = oEvent.getSource().getBindingContext("local").sPath;
            sPath = sPath + "/" + oEvent.getSource().getBindingInfo("value").binding.getPath();

            var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
            var targetMessage = aMessages.filter(e => e.target == sPath);
            sap.ui.getCore().getMessageManager().removeMessages(targetMessage);
            if (aFiltered.length == 0) {
                if (sValue != "") {
                    var oMessage = new Message({
                        message: "無効なエントリ",
                        type: "Error",
                        target: sPath,
                        processor: this.getView().getModel("local")
                    });
                    sap.ui.getCore().getMessageManager().addMessages(oMessage);
                }
            }
        },
        
        onAccountText: function (oEvent, sTextProperty) {
            var sAccount = oEvent.getParameter("value");
            var sCompany = this._LocalData.getProperty("/dailyBalance/0/KAISHA_CD");
            var aAccount = this._LocalData.getProperty("/AccountVH");
            var aAccountFiltered = aAccount.filter( e => e.Key1 == sAccount && e.Key2 == sCompany);
            var sPath = oEvent.getSource().getBindingContext("local").sPath;

            var sTargetPath = sPath + "/" + oEvent.getSource().getBindingInfo("value").binding.getPath();
            var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
            var targetMessage = aMessages.filter(e => e.target == sTargetPath);
            sap.ui.getCore().getMessageManager().removeMessages(targetMessage);

            if (aAccountFiltered.length > 0) {
                this._LocalData.setProperty(sPath + "/" + sTextProperty, aAccountFiltered[0].Value1);
            } else {
                if (sAccount != "") {
                    var oMessage = new Message({
                        message: "無効なエントリ",
                        type: "Error",
                        target: sTargetPath,
                        processor: this.getView().getModel("local")
                    });
                    sap.ui.getCore().getMessageManager().addMessages(oMessage);
                } else {
                    this._LocalData.setProperty(sPath + "/" + sTextProperty, "");
                }
            }
        },

        onMessagePopoverPress : function (oEvent) {
			var oSourceControl = oEvent.getSource();
			this._getMessagePopover().then(function(oMessagePopover){
				oMessagePopover.openBy(oSourceControl);
			});
		},
        
        _getMessagePopover: function () {
			var oView = this.getView();

			// create popover lazily (singleton)
			if (!this._pMessagePopover) {
				this._pMessagePopover = Fragment.load({
					id: oView.getId(),
					name: "pstore003.view.fragment.MessagePopover"
				}).then(function (oMessagePopover) {
					oView.addDependent(oMessagePopover);
					return oMessagePopover;
				});
			}
			return this._pMessagePopover;
		},

        setValueToZero: function (oEvent) {
            if (oEvent) {
                if (oEvent.getSource().getValue().trim() == "" ) {
                    oEvent.getSource().setValue("0");
                }
            }
        },

        onApprovalConfirm: function() {
            if (!this.pDialog) {
                this.pDialog = this.loadFragment({
                    name: "FICO.dailybalanceapproval.view.fragment.Comments"
                });
            } else {
                this.byId("idComments").setValue("");
            }
            this.pDialog.then(function(oDialog) {
                var beginButton = new Button({
                    type: "Emphasized",
                    text: this._ResourceBundle.getText("Yes"),
                    //按钮
                    press: function () {
                        var postData = this.getApprovalData();
                        this.postAction(postData);
                        oDialog.close();
                    }.bind(this)
                });
                var endButton = new Button({
                    text: this._ResourceBundle.getText("No"),
                    press: function () {
                        oDialog.close();
                    }.bind(this)
                });
                // 添加按钮
                if (oDialog.getButtons().length === 0){
                    oDialog.addButton(beginButton);
                    oDialog.addButton(endButton);
                }
                oDialog.open();
            }.bind(this));
        },
        // 审批用
        handleFullScreen: function (oEvent) {
            var sNextLayout = "MidColumnFullScreen"
            this.oRouter.navTo("DailyBalance_based", {layout: sNextLayout});
            // 用以控制第二页面全屏的按钮
            this._LocalData.setProperty("/actionButtonsInfo/midColumn/exitFullScreen","OneColumn");
            this._LocalData.setProperty("/actionButtonsInfo/midColumn/fullScreen",null);
        },
        // 审批用
        handleExitFullScreen: function (oEvent) {
            var sNextLayout = "TwoColumnsMidExpanded"
            this.oRouter.navTo("DailyBalance_based", {layout: sNextLayout});
            // 用以控制第二页面全屏的按钮
            this._LocalData.setProperty("/actionButtonsInfo/midColumn/fullScreen","MidColumnFullScreen");
            this._LocalData.setProperty("/actionButtonsInfo/midColumn/exitFullScreen",null);
        },
        // 审批用
        handleClose: function () {
            var sNextLayout = "OneColumn";
            this.oRouter.navTo("ApprovalList", {layout: sNextLayout});
        },
        // 审批用
        approvalAction:function (sAction) {
            this.sAction = sAction;
            this.onApprovalConfirm();
        },
        // 审批用
        getApprovalData: function () {
            var oRecord = this._LocalData.getProperty("/dailyBalance/0");
            var postData = {
                KIHYO_NO: oRecord.KIHYO_NO,
                NODE: this._LocalData.getProperty("/Node"),
                COMMENTS: this.byId("idComments").getValue()
            };
            return postData
        },
        // 审批用
        postAction: function (postData) {
            var mParameters = {
                groupId: "DailyBalanceApproval" + Math.floor(1 / 100),
                changeSetId: 1,
                refreshAfterChange:true,
                success: function (oData) {
                    this.byId("idDailyBalanceCreate").setBusy(false);
                    messages.showText(oData.MESSAGE);
                    HashChanger.getInstance().replaceHash("");
                }.bind(this),
                error: function (oError) {
                    this.byId("idDailyBalanceCreate").setBusy(false);
                    messages.showError(messages.parseErrors(oError));
                    HashChanger.getInstance().replaceHash("");
                }.bind(this),
            };
            this.getOwnerComponent().getModel().setHeaders({"objecttype":"FI04", "action":this.sAction});

            this.getOwnerComponent().getModel().create("/ZzApprovalListSet", postData, mParameters);
            this.byId("idDailyBalanceCreate").setBusyIndicatorDelay(0);
            this.byId("idDailyBalanceCreate").setBusy(true);
        },
        // 审批用
        insertHistorySection: function () {
            var oView = this.getView();
            var oPage = this.byId("ObjectPageLayout");
			// create popover lazily (singleton)
			if (!this.HistorySection) {
                this.HistorySection = this.loadFragment({
                    id: oView.getId(),
                    name: "FICO.dailybalanceapproval.view.fragment.ApprovalHistory"
                }).then(function (oHistorySection) {
                    oPage.insertSection(oHistorySection, 10);
				});
			}
        },
        
	});

});