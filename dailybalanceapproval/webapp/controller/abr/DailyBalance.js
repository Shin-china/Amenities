sap.ui.define([
	"FICO/dailybalanceapproval/controller/BaseController",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"FICO/dailybalanceapproval/model/formatter",
    "FICO/dailybalanceapproval/controller/messages"
], function (BaseController, History, UIComponent, formatter, messages) {
	"use strict";

	return BaseController.extend("FICO.dailybalanceapproval.controller.abr.DailyBalance", {

		formatter : formatter,

		onInit: function () {
			this._LocalData = this.getOwnerComponent().getModel("local");
            this._oDataModel = this.getOwnerComponent().getModel();
            this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		onNavBack: function () {
			var oHistory, sPreviousHash;

			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("RouteMain", {}, true /*no history*/ );
			}
		},

        onAddLine: function (oEvent, sTableId) {
            var sPath = "";
            if (sTableId == "idCashIncomeTable") {
                sPath = "/CashIncome";
            } else if (sTableId == "idCashPaymentTable") {
                sPath = "/CashPayment";
            }
            var aCashModel = this._LocalData.getProperty(sPath);
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
                    "LOCKER_DAI_URIAG",
                    "KARAOKE_URIAGE",
                    "FK_URIAGE8",
                    "FK_URIAGE10",
                    "NYUJORYO_URIAGE",
                    "HANSOKUHIN_URIAG",
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
            var amount1 = this._LocalData.getProperty("/dailyBalance/HONZITUKURIKOSI");
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
            //翌日規程元金金額
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
            this._LocalData.refresh();
        },

        onSuspend: function () {
            this.onNavBack();
        },

        tableConverted_dis: function (sKey) {
            var aHeaderKey = this._abrModel.getProperty("/" + sKey + "/to_Header");
            var aCahsIncomKey = this._abrModel.getProperty("/" + sKey + "/to_ZzCashIncome");
            var aCahsPaymentKey = this._abrModel.getProperty("/" + sKey + "/to_ZzCashPayment");
            var aTreasuryCashKey = this._abrModel.getProperty("/" + sKey + "/to_ZzTreasuryCash");

            //获取数据
            var oHeader = this._abrModel.getProperty("/" + aHeaderKey[0]);
            var aCahsIncome = [], aCahsPayment = [];
            aCahsIncomKey.forEach(function (path) {
                var item = this._abrModel.getProperty("/" + path);
                delete item.__metadata;
                aCahsIncome.push(item);
            }.bind(this));
            aCahsPaymentKey.forEach(function (path) {
                var item = this._abrModel.getProperty("/" + path);
                delete item.__metadata;
                aCahsPayment.push(item);
            }.bind(this));
            var oTreasuryCash = this._abrModel.getProperty("/" + aTreasuryCashKey[0]);

            this.setLocalModel_dis(oHeader);

            // 转换数据
            //用于参考，如果是参考创建就需要将之前的起票号码清除
            if (!this._LocalData.getProperty("/isCreate")) {
                oHeader.KIHYO_NO = "";
            }
            this._LocalData.setProperty("/dailyBalance", [oHeader]);
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
            //
            this.getCashTable_dis(aCahsIncome, aCahsPayment);
            //
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
            });
            this._LocalData.setProperty("/CurrencyTable1/Total",oTreasuryCash.YUUKOU_GKI_AMT);
            //破損貨幣明細
            var aField2 = ["HASON_MAISUU_1MAN", "HASON_MAISUU_5SEN", "HASON_MAISUU_2SEN", "HASON_MAISUU_SEN", "HASON_MAISUU_500EN"];
            aTable2.forEach(function (line, index) {
                line.Quantity = oTreasuryCash[aField2[index]];
            });
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
        },
    

        initialLocalModel_dis: function (oHeader) {
            var shop = oHeader.TENPO_CD;
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

            var aFI0004 = this._LocalData.getProperty("/FI0004");
            var aCurrencyTable3 = this._LocalData.getProperty("/CurrencyTable3/Item");
            //準備金明細
            var aFI0004a = aFI0004.filter( line => line.Value2 === shop);
            aCurrencyTable3.forEach(function (line, index) {
                line.Title = aFI0004a[index].Value4;
            });
            this._LocalData.setProperty("/CurrencyTable3/Item", aCurrencyTable3);

            
            this._LocalData.refresh();
        },

        onSelectWeather: function () {
            this._LocalData.setProperty("/dailyBalance/0/TENKI", this.byId("idSelectWeather").getSelectedKey());
        },

        
	});

});