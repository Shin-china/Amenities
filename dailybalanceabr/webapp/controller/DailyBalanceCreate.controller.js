sap.ui.define([
    // "FICO/dailybalanceabr/controller/BaseController",
    "FICO/dailybalanceabr/controller/DailyBalance",
    "../model/formatter",
    "./messages"
],
    function (DailyBalance, formatter, messages) {
        "use strict";
        return DailyBalance.extend("FICO.dailybalanceabr.controller.DailyBalanceCreate", {
            formatter: formatter,
            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
                this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

                this.postingTotal = "0";
                //excel 整个表格或者一行？粘贴代码示例，需要测试调整
                // ['paste'].forEach(function(event) {
                //     document.addEventListener(event, function(e) {
                //         // get all the rows from clipboard
                //         var rows = e.clipboardData.getData('text/plain').split(/\+/);
                //         // go through the rows and place them in your UI5 Model
                //         for (var i = 0; i < rows.length; i++) {
                //             var fields = rows[i].split(/\s+/);
                //             if (fields[0] === "") {
                //                 continue;
                //             }
                //             var MATNR = fields[0];
                //             var QTD = fields[1];
                //             var DISC = fields[2];
                
                //             var dataItem = {};
                //             dataItem.MATNR = MATNR;
                //             dataItem.KWMENG = QTD;
                //             dataItem.DISCOUNT = DISC;
                
                //             //tabOrderItems is the data endpoint
                //             ModelData.Add(tabOrderItems, dataItem);
                //         }
                
                //     });
                // });
                var oRouter = this.getRouter();
                oRouter.getRoute("DailyBalanceCreate").attachMatched(this._onRouteMatched, this);
            },

            //当路径导航到此页面时，设置页面的数据绑定
            // When the path navigates to this page, the data binding of the page is set
            _onRouteMatched : function (oEvent) {
                // this.byId("idProcessPage").setBusy(false);
                this._LocalData.setProperty("/busy",false);
            	// var oArgs, oView;
            	//localmodel中当前行的绑定路径
            	// oArgs = oEvent.getParameter("arguments");
                
                // this._LocalData.setProperty("/dailyBalance/0/KIHYO_NO", oArgs.oDialogInput.KIHYO_NO);
            	// oView = this.getView();
            	// oView.bindElement({
            	// 	path : "/progressConfir/" + oArgs.contextPath,
            	// 	model: "local",
            	// 	events : {
            	// 		dataRequested: function () {
            	// 			oView.setBusy(true);
            	// 		},
            	// 		dataReceived: function () {
            	// 			oView.setBusy(false);
            	// 		}
            	// 	}
            	// });
            },

            // 日记表数据保存
            onBalanceSave: function () {
                var postDoc = this.prepareBalanceSaveBody();
                postDoc.EIGYO_BI = this.formatter.date_8(postDoc.EIGYO_BI);
                this.postBalanceSave(postDoc);
            },

            //申请
            onBalanceApply: function () {
                var postDoc = this.prepareBalanceApplyBody();
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

            postBalanceSave: function (postData, i) {
                i = 1;
                var mParameters = {
                    groupId: "DailyBalanceSave" + Math.floor(i / 100),
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
                this.getOwnerComponent().getModel().setHeaders({"button":"Save"});
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
            
            onSelectWeather: function () {
                this._LocalData.setProperty("/dailyBalance/0/TENKI", this.byId("idSelectWeather").getSelectedKey());
            },

            onSelectTicket: function (oEvent) {
                // this._LocalData.setProperty("/");
                var sPath = oEvent.getSource().getParent().getBindingContext("local");
                this._LocalData.setProperty(sPath + "/Ticket", oEvent.getSource().getSelectedKey());
            }



        });
    });