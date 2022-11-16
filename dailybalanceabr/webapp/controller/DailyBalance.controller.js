sap.ui.define([
	"FICO/dailybalanceabr/controller/BaseController",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"../model/formatter",
    "./messages",
    "sap/m/MessageToast",
    "sap/m/Button"
], function (BaseController, History, UIComponent, formatter, messages, MessageToast, Button) {
	"use strict";

	return BaseController.extend("FICO.dailybalanceabr.controller.DailyBalance", {

		formatter : formatter,

		onInit: function () {
			this._LocalData = this.getOwnerComponent().getModel("local");
            this._oDataModel = this.getOwnerComponent().getModel();
            this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            var oRouter = this.getRouter();
            oRouter.getRoute("DailyBalance").attachMatched(this._onRouteMatched, this);
            this.InitModel = this.getOwnerComponent().getModel("init");
		},

        //当路径导航到此页面时，设置页面的数据绑定
        _onRouteMatched : function (oEvent) {
            this._LocalData.setProperty("/processBusy", false);
            this.byId("idUser").setValueState("None");
            //localmodel中当前行的绑定路径
            var oArgs = oEvent.getParameter("arguments");
            if (oArgs.view == "Display") { 
                this._LocalData.setProperty("/viewEditable", false);
                this.byId("idChange").setVisible(true);
                this.byId("idChange").setText(this._ResourceBundle.getText("ChangeButton"));
                this.byId("idPosting").setVisible(true);

                var oHeader = this._oDataModel.getProperty("/" + oArgs.contextPath);
                this.byId("idDailyBalanceCreate").setTitle(oHeader.KIHYO_NO);
                // this.byId("idSelectWeather").setForceSelection(false);
                this.initialLocalModel_dis(oHeader);
                this.tableConverted_dis(oArgs.contextPath);
            } else {
                this._LocalData.setProperty("/viewEditable", true);
                this.byId("idDailyBalanceCreate").setTitle(this._ResourceBundle.getText("DailyBalanceCreatePage"));
                this.byId("idChange").setVisible(false);
                this.byId("idPosting").setVisible(false);
                // this.byId("idSelectWeather").setForceSelection(false);
            }
            // this.byId("idSelectWeather").setSelectedKey("雪");
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
            aCashModel.push({});
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
            this._LocalData.refresh();
        },

        onMulti: function (oEvent, sParam) {
            var value = oEvent.getSource().getValue();
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
            if (this.chekcRequired()) {
                MessageToast.show(this._ResourceBundle.getText("inputRequired"));
                return;
            }
            var postDoc = this.prepareBalanceSaveBody();
            postDoc.EIGYO_BI = this.formatter.date_8(postDoc.EIGYO_BI);
            delete postDoc.__metadata;
            this.postBalanceSave(postDoc,sAction);
        },

        //申请 确认
        onApplyConfirm: function() {
            if (!this.pDialog) {
                this.pDialog = this.loadFragment({
                    name: "FICO.dailybalanceabr.view.fragment.ApplyConfirm"
                });
            } 
            this.pDialog.then(function(oDialog) {
                var beginButton = new Button({
                    type: "Emphasized",
                    text: this._ResourceBundle.getText("Yes"),
                    //登录按钮
                    press: function () {
                        this.onBalanceApply();
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
        //申请
        onBalanceApply: function () {
            var postDoc = this.prepareBalanceApplyBody();
            delete postDoc.__metadata;
            this.postBalanceApply(postDoc);
        },

        // 准备保存需要的数据
        prepareBalanceSaveBody: function() {
            var aDailyBalance = this._LocalData.getProperty("/dailyBalance");
            aDailyBalance = JSON.parse(JSON.stringify(aDailyBalance));
            // 1.2.3.4.5
            var postDoc = aDailyBalance[0];
            // 获取并转换数据
            postDoc = this.convertTables(postDoc);
            //その他現金収入 その他現金支出
            this.getCashTable(postDoc);
            //金庫内現金内訳
            this.getTreasuryCash(postDoc);
            return postDoc;
        },

        //准备申请需要的数据
        prepareBalanceApplyBody: function () {
            var aDailyBalance = this._LocalData.getProperty("/dailyBalance");
            var postDoc = {};
            postDoc.KAISHA_CD = aDailyBalance[0].KAISHA_CD;
            postDoc.KIHYO_NO = aDailyBalance[0].KIHYO_NO;
            return postDoc;
        },

        postBalanceSave: function (postData, sAction) {
            var i = 1;
            var mParameters = {
                groupId: "DailyBalanceSave" + Math.floor(i / 100),
                changeSetId: i,
                success: function (oData) {
                    this.byId("idDailyBalanceCreate").setBusy(false);
                    this._LocalData.setProperty("/dailyBalance/0/KIHYO_NO", oData.KIHYO_NO);
                    this.byId("idDailyBalanceCreate").setTitle(oData.KIHYO_NO);
                    messages.showText(oData.Message);
                    // this._LocalData.setProperty("/differenceConfirmDetail" , oData.to_Item.results);
                }.bind(this),
                error: function (oError) {
                    this.byId("idDailyBalanceCreate").setBusy(false);
                    messages.showError(messages.parseErrors(oError));
                    // this._LocalData.setProperty("/differenceConfirmDetail/" + i + "/Type", "E");
                    // this._LocalData.setProperty("/differenceConfirmDetail/" + i + "/Message", messages.parseErrors(oError));
                }.bind(this),
            };
            this.getOwnerComponent().getModel().setHeaders({"button":sAction});
            //复杂结构
            this.getOwnerComponent().getModel().create("/ZzShopDailyBalanceSet", postData, mParameters);
            this.byId("idDailyBalanceCreate").setBusyIndicatorDelay(0);
            this.byId("idDailyBalanceCreate").setBusy(true);
        },

        postBalanceApply: function (postData, i) {
            i = 1;
            var mParameters = {
                groupId: "DailyBalanceApply" + Math.floor(i / 100),
                changeSetId: i,
                success: function (oData) {
                    this.byId("idDailyBalanceCreate").setBusy(false);
                    messages.showText(oData.Message);
                    // this._LocalData.setProperty("/differenceConfirmDetail" , oData.to_Item.results);
                }.bind(this),
                error: function (oError) {
                    this.byId("idDailyBalanceCreate").setBusy(false);
                    messages.showError(messages.parseErrors(oError));
                    // this._LocalData.setProperty("/differenceConfirmDetail/" + i + "/Type", "E");
                    // this._LocalData.setProperty("/differenceConfirmDetail/" + i + "/Message", messages.parseErrors(oError));
                }.bind(this),
            };
            this.getOwnerComponent().getModel().setHeaders({"button":"Apply"});
            //复杂结构
            this.getOwnerComponent().getModel().create("/ZzShopDailyBalanceSet", postData, mParameters);
            this.byId("idDailyBalanceCreate").setBusyIndicatorDelay(0);
            this.byId("idDailyBalanceCreate").setBusy(true);
        },
        
        onSelectTicket: function (oEvent) {
            // this._LocalData.setProperty("/");
            var sPath = oEvent.getSource().getParent().getBindingContext("local");
            this._LocalData.setProperty(sPath + "/Ticket", oEvent.getSource().getSelectedKey());
        },

        convertTables: function (postDoc) {
            //6 販促値引
            postDoc = this.convertTable6(postDoc);
            //7 券売上（劇場前売券、社員割引等）
            Object.assign(postDoc, this.convertTableA("7", "KENURIAGE"));
            //8 掛売上（クレジット、電子マネー、QR決済）
            Object.assign(postDoc, this.convertTableA("8", "KUA"));
            //9 掛売上（汎用：自店のみ）
            Object.assign(postDoc, this.convertTableB("9", "KUAJ"));
            //10 掛売上（汎用：他店のみ）
            Object.assign(postDoc, this.convertTableB("10", "KUAT"));
            //11 掛売上（シネマ券）
            postDoc = this.convertTable11(postDoc);
            //12 委託販売
            postDoc = this.convertTable12(postDoc);
            return postDoc;
        },

        //获取 6 販促値引 的值
        convertTable6: function (postDoc) {
            var convertedTable = {};
            var aTable = this._LocalData.getProperty("/table6");
            aTable.forEach(line => {
                switch (line.Id) {
                    case "1"://特会員
                        convertedTable.TOKKAIIN_KENSUU6 = line.Quantity;
                        convertedTable.TOKKAIIN_AMT6 = line.Amount;
                        convertedTable.TOKKAIIN_BIKOU6 = line.Remark;
                        break;
                    case "2"://販シニア
                        convertedTable.HANSINIA_KENSUU6 = line.Quantity;
                        convertedTable.HANSINIA_AMT6 = line.Amount;
                        convertedTable.HANSINIA_BIKOU6 = line.Remark;
                        break;
                    case "3"://その他
                        convertedTable.SONOTA_KENSUU6 = line.Quantity;
                        convertedTable.SONOTA_AMT6 = line.Amount;
                        convertedTable.SONOTA_BIKOU6 = line.Remark;
                        break;
                    case "4"://合計
                        convertedTable.NEBIKI_GKI_KENSUU6 = line.Quantity;
                        convertedTable.NEBIKI_GKI_AMT6 = line.Amount;
                }
            });
            return Object.assign(postDoc,convertedTable);
        },
        //7 8
        convertTableA: function (tableNo, sTableName) {
            var sTablePath = "/table" + tableNo;
            var convertedTable = {};
            var aTable = this._LocalData.getProperty(sTablePath);
            var sProperty = "";
            aTable.forEach( line => {
                if (line.Id != aTable.length) {
                    //件数 KENSUU
                    sProperty = sTableName + "_KENSUU_" + tableNo + "_" + line.Id;
                    convertedTable[sProperty] = line.Quantity;
                    //金額 AMT
                    sProperty = sTableName + "_AMT_" + tableNo + "_" + line.Id;
                    convertedTable[sProperty] = line.Amount;
                    //備考 BIKOU
                    sProperty = sTableName + "_BIKOU_" + tableNo + "_" + line.Id;
                    convertedTable[sProperty] = line.Remark;
                //合计
                } else {
                    //件数 KENSUU
                    sProperty = sTableName + "_GKI_KENSUU" + tableNo;
                    convertedTable[sProperty] = line.Quantity;
                    //金額 AMT
                    sProperty = sTableName + "_GKI_AMT" + tableNo;
                    convertedTable[sProperty] = line.Amount;
                }
            });
            return convertedTable;
        },
        //9 10
        convertTableB: function (tableNo, sTableName) {
            var sTablePath = "/table" + tableNo;
            var convertedTable = {};
            var aTable = this._LocalData.getProperty(sTablePath);
            var sProperty = "";
            aTable.forEach( line => { 
                if (line.Id != aTable.length) {
                    //項目名 KOUMOKU
                    sProperty = sTableName + "_KOUMOKU_" + tableNo + "_" + line.Id;
                    convertedTable[sProperty] = line.Title;
                    //金額 AMT
                    sProperty = sTableName + "_AMT_" + tableNo + "_" + line.Id;
                    convertedTable[sProperty] = line.Amount;
                    //借方科目 DRKAMOKU
                    sProperty = sTableName + "_DRKAMOKU_" + tableNo + "_" + line.Id;
                    convertedTable[sProperty] = line.AccountD;
                    //借方税 DRTAX
                    sProperty = sTableName + "_DRTAX_" + tableNo + "_" + line.Id;
                    convertedTable[sProperty] = line.TaxD;
                //合计
                } else {
                    //金額 AMT
                    sProperty = sTableName + "_GKI_AMT" + tableNo;
                    convertedTable[sProperty] = line.Amount;
                }
                //借方店舗 DRTENPO
                if (line.Id != aTable.length && tableNo == "10") {
                    sProperty = sTableName + "_DRTENPO_" + tableNo + "_" + line.Id;
                    convertedTable[sProperty] = line.ShopD;
                }
            });
            return convertedTable;
        },

        convertTable11: function (postDoc) {
            var tableNo = "11";
            var sTableName = "KUAS";
            var convertedTable = {};
            var aTable = this._LocalData.getProperty("/table11");
            aTable.forEach( line => {
                var sProperty = ""
                if (line.Id != aTable.length) {
                    //作品名 SAKUHINMEI
                    sProperty = sTableName + "_SAKUHINMEI_" + tableNo + "_" + line.Id;
                    convertedTable[sProperty] = line.WorksTitle;
                    //券種 KENSYU
                    sProperty = sTableName + "_KENSYU_" + tableNo + "_" + line.Id;
                    convertedTable[sProperty] = line.Ticket;
                    //件数 KENSUU
                    sProperty = sTableName + "_KENSUU_" + tableNo + "_" + line.Id;
                    convertedTable[sProperty] = line.Quantity;
                    //金額 AMT
                    sProperty = sTableName + "_AMT_" + tableNo + "_" + line.Id;
                    convertedTable[sProperty] = line.Amount;
                    //配給 HAIKYUU
                    sProperty = sTableName + "_HAIKYUU_" + tableNo + "_" + line.Id;
                    convertedTable[sProperty] = line.Supply;
                //合计
                } else {
                    //件数 KENSUU
                    sProperty = sTableName + "_GKI_KENSUU" + tableNo;
                    convertedTable[sProperty] = line.Quantity;
                    //金額 AMT
                    sProperty = sTableName + "_GKI_AMT" + tableNo;
                    convertedTable[sProperty] = line.Amount;
                }
            });    
            return Object.assign(postDoc,convertedTable); 
        },

        convertTable12: function (postDoc) {
            var convertedTable = {};
            var aTable = this._LocalData.getProperty("/table12");
            aTable.forEach( line => {
                switch (line.Id) {
                    case "1":
                        convertedTable.ITK_KENSUU_12_1 = line.Quantity;
                        convertedTable.ITK_AMT_12_1 = line.Amount;
                        convertedTable.ITK_BIKOU_12_1 = line.Remark;
                        break;
                    case "2":
                        convertedTable.ITK_KENSUU_12_2 = line.Quantity;
                        convertedTable.ITK_AMT_12_2 = line.Amount;
                        convertedTable.ITK_BIKOU_12_2 = line.Remark;
                        convertedTable.ITK_TENPO_12_2 = line.Shop;
                }
            });
            return Object.assign(postDoc,convertedTable); 
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
        
        //dailyBalanceCalc
        onDailyBalanceCalc: function () {
            var aFields = [
                    "INSHOKU_URIAGE",
                    "BENTO_URIAGE",
                    "GAME_URIAGE",
                    "LANE_URIAGE",
                    "SHOES_URIAGE",
                    "PRO_SHOP_URIAGE",
                    "BILLIARD_URIAGE",
                    "JITEN_TVG_URIAGE",
                    "KYOWA_TVG_URIAGE",
                    "LOCKER_DAI_URIAGE",
                    "KARAOKE_URIAGE",
                    "FK_URIAGE8",
                    "FK_URIAGE10",
                    "NYUJORYO_URIAGE",
                    "HANSOKUHIN_URIAGE",
                    "KOKA_URIAGE",
                    "HAIBUN_URIAGE",
                    "JIHANKI_URIAGE",
                    "BUPPAN_URIAGE8",
                    "BUPPAN_URIAGE10",
                    "REJI_URIAGE",
                    "EVENT_URIAGEA8",
                    "EVENT_URIAGEB8",
                    "EVENT_URIAGEA10",
                    "EVENT_URIAGEB10",
                    "SONOTA_URIAGEA8",
                    "SONOTA_URIAGEB8",
                    "SONOTA_URIAGEA10",
                    "SONOTA_URIAGEB10",
                    "URIAGE_NEBIKI"//売上値引
                ];
            var sPath = "";
            var value = "";
            var total = "0";
            aFields.forEach(function (field) {
                sPath = "/dailyBalance/0/" + field;
                value = this._LocalData.getProperty(sPath);
                total = this.formatter.accAdd(total, value);
            }.bind(this));
            //売上合計
            this._LocalData.setProperty("/dailyBalance/0/URIAGE_GOKEI", total);

            this.salesDetialCalc();
            this._LocalData.refresh();
        },
        

        //table6 table7 table8 table11 共用
        onTable6Calc: function (sTablePath) {
            var aTable = this._LocalData.getProperty(sTablePath);
            var total1 = "0";
            var total2 = "0";
            aTable.forEach(function (line, index) {
                if (index == aTable.length - 1) {
                    line.Quantity = total1;
                    line.Amount = total2;
                    if (sTablePath == "/table6") {
                         //売上値引
                         this._LocalData.setProperty("/dailyBalance/0/URIAGE_NEBIKI", this.formatter.accMul(total2, -1));
                        //売上合計
                        this.onDailyBalanceCalc();
                    }
                    return;
                }
                //数量
                total1 = this.formatter.accAdd(total1, line.Quantity);
                //金额
                total2 = this.formatter.accAdd(total2, line.Amount);
            }.bind(this));


            this.sumTable7ToTable12();
            this.salesDetialCalc();
            this._LocalData.refresh();
        },
        //table9 table10 共用
        onTable9Calc: function (sTablePath) {
            var aTable = this._LocalData.getProperty(sTablePath);
            var total1 = "0";
            aTable.forEach(function (line, index) {
                if (index == aTable.length - 1) {
                    line.Amount = total1;
                    return;
                }
                //金额
                total1 = this.formatter.accAdd(total1, line.Amount);
            }.bind(this));

            this.sumTable7ToTable12();
            this.salesDetialCalc();
            this._LocalData.refresh();
        },

        //table7-table12的汇总
        sumTable7ToTable12: function () {
            var aTablePath = ["/table7", "/table8", "/table9", "/table10", "/table11"];
            var total = "0";
            aTablePath.forEach(function (sPath) {
                var aTable = this._LocalData.getProperty(sPath);
                total = this.formatter.accAdd(total, aTable[aTable.length - 1].Amount);
            }.bind(this));
            var aTable12 = this._LocalData.getProperty("/table12");
            aTable12.forEach(function (line) {
                total = this.formatter.accAdd(total, line.Amount);
            }.bind(this));
            this._LocalData.setProperty("/dailyBalance/0/KAKEURI_TO",total);

            this.salesDetialCalc();
            this._LocalData.refresh();
        },

        onTable12AmountChange: function () {
            this.sumTable7ToTable12();
            this.salesDetialCalc();
        },

        onTableColumnSum: function (oEvent,sId) {
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

        onCurrencyTable4ValueChange: function () {
            var total1 = this._LocalData.getProperty("/CurrencyTable1/Total");
            var total2 = this._LocalData.getProperty("/CurrencyTable2/Total");
            var total3 = this._LocalData.getProperty("/CurrencyTable3/Total");
            var aCurrencyTable4 = this._LocalData.getProperty("/CurrencyTable4");
            //本日繰越高
            var amount1 = this._LocalData.getProperty("/dailyBalance/0/HONZITUKURIKOSI");
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
        salesDetialCalc: function () {
            //売上合計
            var value1 = this._LocalData.getProperty("/dailyBalance/0/URIAGE_GOKEI");
            // 掛売上
            var value2 = this._LocalData.getProperty("/dailyBalance/0/KAKEURI_TO");
            // 現金売上 = 売上合計 - 掛売上
            var result = this.formatter.accSub(value1,value2);
            this._LocalData.setProperty("/dailyBalance/0/GENKIN_URIAGE",result);
            //売上収入内訳計 = 売上合計
            this._LocalData.setProperty("/dailyBalance/0/URAG_SHNY_UCHWK_KI",value1);

            this.collectionIncome();
            this.collectionPayment();
            this._LocalData.refresh();
        },

        collectionIncome: function () {
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
        collectionPayment: function () {
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
        // Ⅳ本日繰越高
        resultCalc: function () {
            //前日繰越元金
            var value1 = this._LocalData.getProperty("/dailyBalance/0/ZNJTS_KRKSH_GANKIN");
            //銀行入金総額
            var value2 = this._LocalData.getProperty("/dailyBalance/0/GNK_NYUKIN_SOGAKU");
            //両替金受入
            var value3 = this._LocalData.getProperty("/dailyBalance/0/RYOGAEKIN_UKEIRE");
            //収支差額
            var value4 = this._LocalData.getProperty("/dailyBalance/0/SHUSHI_SAGAKU");
            //Ⅳ本日繰越高(アム閉店時現金有高)
            var result = "0";
            //Ⅳ本日繰越高(アム閉店時現金有高) = 前日繰越元金 - 銀行入金総額 + 両替金受入 + 収支差額
            result = this.formatter.accSub(value1, value2);
            result = this.formatter.accAdd(result, value3);
            result = this.formatter.accAdd(result, value4);
            this._LocalData.setProperty("/dailyBalance/0/HONZITUKURIKOSI", result);
            //本日繰越高(日計表1枚目参照） [Ⅳ]
            this._LocalData.setProperty("/CurrencyTable4/4/Amount", result);
            //翌日金庫内現金総額  [Ⅻ]
            var value5 = this._LocalData.getProperty("/CurrencyTable4/3/Amount");
            //差額 [Ⅻ]-[Ⅳ]
            result = this.formatter.accSub(value5, result);
            this._LocalData.setProperty("/CurrencyTable4/6/Amount", result);
            //Ⅶアムエリア振替(Ⅳ-Ⅵ)
            this.resultCalc1();
            this._LocalData.refresh();
        },

        //Ⅶアムエリア振替(Ⅳ-Ⅵ)
        resultCalc1: function() {
            //Ⅵ元金金額
            var value1 = this._LocalData.getProperty("/dailyBalance/0/GANKIN_AMT");
            //Ⅳ本日繰越高(アム閉店時現金有高)
            var value2 = this._LocalData.getProperty("/dailyBalance/0/HONZITUKURIKOSI");

            var result = "0";
            result = this.formatter.accSub(value2, value1);
            this._LocalData.setProperty("/dailyBalance/0/AMAREA_FURIKAE", result);
            this._LocalData.refresh();
        },

        onSuspend: function () {
            this.onNavBack();
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
            // 用于参考，如果是参考创建就需要将之前的起票号码清除
            if (!this._LocalData.getProperty("/isCreate")) {
                oHeader.KIHYO_NO = "";
            }
            this._LocalData.setProperty("/dailyBalance", [oHeader]);
            this.byId("idSelectWeather").setSelectedKey(oHeader.TENKI);
            var table6 = this._LocalData.getProperty("/table6");
            table6.forEach(function (line, index) {
                switch (index) {
                    case 0://特会員
                        line.Quantity = oHeader.TOKKAIIN_KENSUU6;
                        line.Amount = oHeader.TOKKAIIN_AMT6;
                        line.Remark = oHeader.TOKKAIIN_BIKOU6;
                        break;
                    case 1://販シニア
                        line.Quantity = oHeader.HANSINIA_KENSUU6;
                        line.Amount = oHeader.HANSINIA_AMT6;
                        line.Remark = oHeader.HANSINIA_BIKOU6;
                        break;
                    case 2://その他
                        line.Quantity = oHeader.SONOTA_KENSUU6;
                        line.Amount = oHeader.SONOTA_AMT6;
                        line.Remark = oHeader.SONOTA_BIKOU6;
                        break;
                    case 3://合計
                        line.Quantity = oHeader.NEBIKI_GKI_KENSUU6;
                        line.Amount = oHeader.NEBIKI_GKI_AMT6;
                }
            }.bind(this));

            //7 券売上（劇場前売券、社員割引等）
            this.convertTableA_dis("7", "KENURIAGE", oHeader)
            //8 掛売上（クレジット、電子マネー、QR決済）
            this.convertTableA_dis("8", "KUA", oHeader)
            //9 掛売上（汎用：自店のみ）
            this.convertTableB_dis("9", "KUAJ", oHeader);
            //10 掛売上（汎用：他店のみ）
            this.convertTableB_dis("10", "KUAT", oHeader);
            //11 掛売上（シネマ券）
            this.convertTable11_dis(oHeader);
            //12 委託販売
            this.convertTable12_dis(oHeader);
            //その他現金収入/その他現金支出
            this.getCashTable_dis(aCahsIncome, aCahsPayment);
            //金庫内現金内訳
            this.getTreasuryCash_dis(oTreasuryCash);

            this._LocalData.refresh();
        },

        setLocalModel_dis: function (oHeader) {
            // 写入店铺code
            var aTable8 = this._LocalData.getProperty("/table8");
            var aTable9 = this._LocalData.getProperty("/table9");
            var aTable10 = this._LocalData.getProperty("/table10");
            aTable8.forEach(function (line, index) {
                // 最后一行不处理
                if (index >= aTable8.length - 1) {
                    return;
                }
                line.Shop = oHeader.TENPO_CD;
            });
            aTable9.forEach(function (line, index) {
                // 最后一行不处理
                if (index >= aTable9.length - 1) {
                    return;
                }
                line.ShopD = oHeader.TENPO_CD;
                line.ShopC = oHeader.TENPO_CD;
            });
            aTable10.forEach(function (line, index) {
                // 最后一行不处理
                if (index >= aTable10.length - 1) {
                    return;
                }
                line.ShopC = oHeader.TENPO_CD;
            });

            var shop = oHeader.TENPO_CD;
            var aFI0004 = this._LocalData.getProperty("/FI0004");
            var aCurrencyTable3 = this._LocalData.getProperty("/CurrencyTable3/Item");
            //準備金明細
            var aFI0004a = aFI0004.filter( line => line.Value2 === shop);
            aCurrencyTable3.forEach(function (line, index) {
                //aFI0004a中的条目数可能少于aCurrencyTable3
                try {
                    line.Title = aFI0004a[index].Value4;
                } catch (e) {}
            });
            this._LocalData.setProperty("/CurrencyTable3/Item", aCurrencyTable3);

            //掛売上（クレジット、電子マネー、QR決済）
            var aFI0007 = this._LocalData.getProperty("/FI0007");
            var aTable8 = this._LocalData.getProperty("/table8");
            if (aFI0007.length > 0) {
                aTable8.forEach(function (line, index) {
                    try {
                        line.Title = aFI0007[index].Value4;
                    } catch (e) {}
                });
                this._LocalData.setProperty("/table8", aTable8);
            }

            this._LocalData.setProperty("/table12/0/Shop", oHeader.TENPO_CD);
            this._LocalData.refresh();
        },

         //7 8
        convertTableA_dis: function (tableNo, sTableName, oHeader) {
            var sTablePath = "/table" + tableNo;
            var sProperty = "";
            var aTable = this._LocalData.getProperty(sTablePath);
            aTable.forEach(function (line) {
                if (line.Id != aTable.length) {
                    //件数 KENSUU
                    sProperty = sTableName + "_KENSUU_" + tableNo + "_" + line.Id;
                    line.Quantity = oHeader[sProperty];
                    //金額 AMT
                    sProperty = sTableName + "_AMT_" + tableNo + "_" + line.Id;
                    line.Amount = oHeader[sProperty];
                    //備考 BIKOU
                    sProperty = sTableName + "_BIKOU_" + tableNo + "_" + line.Id;
                    line.Remark = oHeader[sProperty];
                // 合计
                } else {
                    //件数 KENSUU
                    sProperty = sTableName + "_GKI_KENSUU" + tableNo;
                    line.Quantity = oHeader[sProperty];
                    //金額 AMT
                    sProperty = sTableName + "_GKI_AMT" + tableNo;
                    line.Amount = oHeader[sProperty];
                }
            });
        },

        //9 10
        convertTableB_dis: function (tableNo, sTableName, oHeader) {
            var sTablePath = "/table" + tableNo;
            var aTable = this._LocalData.getProperty(sTablePath);
            var sProperty = "";
            aTable.forEach( line => { 
                if (line.Id != aTable.length) {
                    //項目名 KOUMOKU
                    sProperty = sTableName + "_KOUMOKU_" + tableNo + "_" + line.Id;
                    line.Title = oHeader[sProperty];
                    //金額 AMT
                    sProperty = sTableName + "_AMT_" + tableNo + "_" + line.Id;
                    line.Amount = oHeader[sProperty];
                    //借方科目 DRKAMOKU
                    sProperty = sTableName + "_DRKAMOKU_" + tableNo + "_" + line.Id;
                    line.AccountD = oHeader[sProperty];
                    //借方税 DRTAX
                    sProperty = sTableName + "_DRTAX_" + tableNo + "_" + line.Id;
                    line.TaxD = oHeader[sProperty];
                //合计
                } else {
                    //金額 AMT
                    sProperty = sTableName + "_GKI_AMT" + tableNo;
                    line.Amount = oHeader[sProperty];
                }
                //借方店舗 DRTENPO
                if (line.Id != aTable.length && tableNo == "10") {
                    sProperty = sTableName + "_DRTENPO_" + tableNo + "_" + line.Id;
                    line.ShopD = oHeader[sProperty];
                }
            });
        },

        convertTable11_dis: function (oHeader) {
            var tableNo = "11";
            var sTableName = "KUAS";
            var aTable = this._LocalData.getProperty("/table11");
            aTable.forEach( line => {
                var sProperty = ""
                if (line.Id != aTable.length) {
                    //作品名 SAKUHINMEI
                    sProperty = sTableName + "_SAKUHINMEI_" + tableNo + "_" + line.Id;
                    line.WorksTitle = oHeader[sProperty];
                    //券種 KENSYU
                    sProperty = sTableName + "_KENSYU_" + tableNo + "_" + line.Id;
                    line.Ticket = oHeader[sProperty];
                    //件数 KENSUU
                    sProperty = sTableName + "_KENSUU_" + tableNo + "_" + line.Id;
                    line.Quantity = oHeader[sProperty];
                    //金額 AMT
                    sProperty = sTableName + "_AMT_" + tableNo + "_" + line.Id;
                    line.Amount = oHeader[sProperty];
                    //配給 HAIKYUU
                    sProperty = sTableName + "_HAIKYUU_" + tableNo + "_" + line.Id;
                    line.Supply = oHeader[sProperty];
                //合计
                } else {
                    //件数 KENSUU
                    sProperty = sTableName + "_GKI_KENSUU" + tableNo;
                    line.Quantity = oHeader[sProperty];
                    //金額 AMT
                    sProperty = sTableName + "_GKI_AMT" + tableNo;
                    line.Amount = oHeader[sProperty];
                }
            });    
        },

        convertTable12_dis: function (oHeader) {
            var aTable = this._LocalData.getProperty("/table12");
            aTable.forEach( line => {
                switch (line.Id) {
                    case "1":
                        line.Quantity = oHeader.ITK_KENSUU_12_1;
                        line.Amount = oHeader.ITK_AMT_12_1;
                        line.Remark = oHeader.ITK_BIKOU_12_1;
                        break;
                    case "2":
                        line.Quantity = oHeader.ITK_KENSUU_12_2;
                        line.Amount = oHeader.ITK_AMT_12_2;
                        line.Remark = oHeader.ITK_BIKOU_12_2;
                        line.Shop = oHeader.ITK_TENPO_12_2;
                }
            });
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
            oTreasuryCash.ZYUNBIKIN_GKI_AMT = this._LocalData.getProperty("/CurrencyTable3/Total");
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
            this._LocalData.setProperty("/table6", JSON.parse(JSON.stringify(this.InitModel.getProperty("/table6"))));
            this._LocalData.setProperty("/table7", JSON.parse(JSON.stringify(this.InitModel.getProperty("/table7"))));
            this._LocalData.setProperty("/table8", JSON.parse(JSON.stringify(this.InitModel.getProperty("/table8"))));
            this._LocalData.setProperty("/table9", JSON.parse(JSON.stringify(this.InitModel.getProperty("/table9"))));
            this._LocalData.setProperty("/table10", JSON.parse(JSON.stringify(this.InitModel.getProperty("/table10"))));
            this._LocalData.setProperty("/table11", JSON.parse(JSON.stringify(this.InitModel.getProperty("/table11"))));
            this._LocalData.setProperty("/table12", JSON.parse(JSON.stringify(this.InitModel.getProperty("/table12"))));
            this._LocalData.setProperty("/CashIncome", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CashIncome"))));
            this._LocalData.setProperty("/CashPayment", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CashPayment"))));
            this._LocalData.setProperty("/CurrencyTable1", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CurrencyTable1"))));
            this._LocalData.setProperty("/CurrencyTable2", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CurrencyTable2"))));
            this._LocalData.setProperty("/CurrencyTable3", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CurrencyTable3"))));
            this._LocalData.setProperty("/CurrencyTable4", JSON.parse(JSON.stringify(this.InitModel.getProperty("/CurrencyTable4"))));
            
            this._LocalData.refresh();
        },

        onSelectWeather: function (oEvent) {
            this._LocalData.setProperty("/dailyBalance/0/TENKI", this.byId("idSelectWeather").getSelectedKey());
            this.changeValueState(oEvent);
        },

        oonUserChange: function (oEvent) {
            this.changeValueState(oEvent);
        },

        changeValueState: function (oEvent) {
            if (oEvent.getParameter("value") == "") {
                oEvent.getSource().setValueState("Warning");
            } else {
                oEvent.getSource().setValueState("None");
            }
        },

        chekcRequired: function () {
            var isError = false;
            if (this.byId("idUser").getValue() == "") {
                this.byId("idUser").setValueState("Warning");
                isError = true;
            } 
            if (this.byId("idSelectWeather").getSelectedKey() == "") {
                this.byId("idSelectWeather").setValueState("Warning");
                isError = true;
            } 
            return isError;
        },

        onChangePress: function (oEvent) {

            var oButton = oEvent.getSource();
            var isEdit = this._LocalData.getProperty("/viewEditable");
            if (isEdit) {
                this._LocalData.setProperty("/viewEditable", false);
                oButton.setText(this._ResourceBundle.getText("ChangeButton"));

            } else {
                this._LocalData.setProperty("/viewEditable", true);
                oButton.setText(this._ResourceBundle.getText("DisplayButton"));
            }
        }

        
	});

});