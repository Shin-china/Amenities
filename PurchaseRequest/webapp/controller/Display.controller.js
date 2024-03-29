sap.ui.define([
    "MMPurchaseRequest/controller/Base",
    "MMPurchaseRequest/model/formatter",
    "sap/m/Button",
    "MMPurchaseRequest/controller/messages",
    "sap/ui/model/Filter",
    "sap/m/MessageBox",
    "sap/ui/model/FilterOperator"
], function(
    Base, formatter, Button, messages, Filter, MessageBox, FilterOperator
) {
    "use strict";

    return Base.extend("MMPurchaseRequest.controller.Display", {
        formatter: formatter,

        onInit: function() {
            this._LocalData = this.getOwnerComponent().getModel("local");
            this._oDataModel = this.getOwnerComponent().getModel();
            this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        onPressHistory: function(oEvent) {
            var sObjectid = oEvent.getSource().getBindingContext().getObject().Banfn;
            this.getApprovalHistory(sObjectid).then(function(res) {
                try {
                    var aApprovalHistory = [];
                    res.forEach(function(item) {
                        var sTime = this.formatter.dateTime(item.Date, item.Time);
                        aApprovalHistory.push({
                            user: item.User,
                            name: item.Username,
                            time: new Date(sTime),
                            comments: item.Comments,
                            action: item.Action,
                            nodename: item.Nodename
                        });
                    }, this)
                } catch (error) {}
                this._LocalData.setProperty("/approvalHistory", aApprovalHistory);
                this.approvalHistoryDialog();
            }.bind(this));
        },

        getApprovalHistory: function(sObjectid) {
            var promise = new Promise(function(resolve, reject) {
                var mParameters = {
                    refreshAfterChange: false,
                    success: function(oData) {
                        resolve(oData.results);
                    }.bind(this),
                    error: function(oError) {
                        messages.showError(messages.parseErrors(oError));
                    }.bind(this)
                };
                this.getOwnerComponent().getModel().setHeaders({ "objectid": sObjectid });
                this.getOwnerComponent().getModel().read("/ZzApprovalHistorySet", mParameters);
            }.bind(this));
            return promise;
        },

        // 显示审批履历
        approvalHistoryDialog: function() {
            this.byId("smartTable").setBusyIndicatorDelay(0);
            this.byId("smartTable").setBusy(true);
            var oView = this.getView();
            if (!this.HistoryDialog) {
                this.HistoryDialog = this.loadFragment({
                    id: oView.getId(),
                    name: "MMPurchaseRequest.fragment.ApprovalHistory"
                })
            }
            this.HistoryDialog.then(function(oHistoryDialog) {
                var endButton = new Button({
                    text: this._ResourceBundle.getText("Close"),
                    press: function() {
                        oHistoryDialog.close();
                    }.bind(this)
                });
                // 添加按钮
                if (oHistoryDialog.getButtons().length === 0) {
                    oHistoryDialog.addButton(endButton);
                }
                oHistoryDialog.open();
                this.byId("smartTable").setBusy(false);
            }.bind(this));
        },
        onNavDetail: function(oEvent, sOption) {
            this._LocalData.setProperty("/sOption", sOption);
            if (sOption == "2") {
                //参考只能选择一条
                var oTable = this.byId("internalTable");
                if (oTable.getSelectedIndices().length > 1) {
                    messages.showText(this._ResourceBundle.getText("tooManySelect"));
                    return;
                } else if (oTable.getSelectedIndices().length == 0) {
                    messages.showText(this._ResourceBundle.getText("noSelect"));
                    return;
                }
            }

            if (sOption == "1" || sOption == "2") {
                this._LocalData.setProperty("/viewModel", "C");
            } else {
                this._LocalData.setProperty("/viewModel", "D");
            }


            var that = this;
            var aFilters;
            var oNewFilter,
                aNewFilters = [];

            aFilters = [];
            aNewFilters.push(new Filter("Zzoption", FilterOperator.EQ, sOption));
            this.getModel("local").setProperty("/Zzoption", sOption);

            // this.getModel("local").setProperty("/ZzTitle", "購買依頼書照会");
            var sZbanfn = "";
            var sBanfn = "";
            var sZspzt = "";
            if (sOption == "4") {
                var oItem = oEvent.getSource().getBindingContext().getObject();
                sZbanfn = oItem.Zbanfn;
                sBanfn = oItem.Banfn;
                sZspzt = oItem.Zspzt;
                if (sBanfn !== "") {
                    this._LocalData.setProperty("/changeVisible", false);
                }
            } else if (sOption == "2") {
                var oBinding = oTable.getBinding();
                var sPath = oBinding.aKeys[oTable.getSelectedIndex()];
                var oItem = this._oDataModel.getProperty("/" + sPath);
                sZbanfn = oItem.Zbanfn;
                sBanfn = oItem.Banfn;
                sZspzt = oItem.Zspzt;
                //ADD BY STANLEY 20230427
                this._LocalData.setProperty("/ZzHeader/Zsprq", "");
            }

            if (sOption !== "1" && (sZbanfn === "" && sBanfn === "")) {
                MessageBox.error(this.getI18nBundle().getText("msgSelectNoFirst"));
                return;
            }

            if (sOption === "2" && (sZspzt !== "8888")) {
                MessageBox.error(this.getI18nBundle().getText("msgCanNotRefCreate"));
                return;
            }

            if (sZbanfn !== "") {
                aNewFilters.push(new Filter("Zbanfn", FilterOperator.EQ, sZbanfn));
            }

            if (sBanfn !== "") {
                aNewFilters.push(new Filter("Banfn", FilterOperator.EQ, sBanfn));
            }

            oNewFilter = new Filter({
                filters: aNewFilters,
                and: true
            });

            aFilters.push(oNewFilter);

            that.setBusy(true);


            this.getInitData(aFilters).then(
                function(oData) {
                    that.gotoDetailPage(oData);
                    // 获取附件
                    if (sOption === "1" || sOption === "2") {
                        this.getModel("local").setProperty("/ZzAttachment", "");
                    } else {
                        this.getAttachment();
                    }
                }.bind(this)
            ).catch(
                function(err) {
                    MessageBox.error(err);
                }
            ).finally(
                function() {
                    that.setBusy(false);
                }
            );
        },
        getInitData: function(aFilters) {
            var that = this;
            var promise = new Promise(function(resolve, reject) {

                // var afilter = [];
                // afilter.push(new Filter('Zzoption', sap.ui.model.FilterOperator.EQ, "1"));

                var oParam = {
                    filters: aFilters,
                    //filters: afilter,
                    urlParameters: {
                        $expand: "to_ZzPRItem,to_ZzPRSum"
                    },
                    success: function(oData) {
                        resolve(oData);
                    }.bind(that),
                    error: function(oError) {
                        var sErrorMessage;
                        if (oError.statusCode === "500") {
                            MessageBox.error(oError.responseText);
                        }
                        try {
                            var oJsonMessage = JSON.parse(oError.responseText);
                            sErrorMessage = oJsonMessage.error.message.value;
                        } catch (e) {
                            sErrorMessage = oError.responseText;
                        }
                        reject(sErrorMessage);
                    }.bind(that)
                };
                that.getModel().read("/ZzPRHeaderSet", oParam);
                // that.getOwnerComponent().getModel().read("/ZzPRHeaderSet", oParam);
            });
            return promise;

        },
        gotoDetailPage: function(oData) {
            var sOption = this._LocalData.getProperty("/sOption");

            if (oData.results.length === 0) {
                MessageBox.error(this.getI18nBundle().getText("msgNoData"));
                return;
            }

            // 控制数据是否可修改
            this._LocalData.setProperty("/changeVisible", oData.results[0].Ischange);
            switch (sOption) {
                // 判断是否可参考
                case "2":
                    if (!oData.results[0].Isrefrence) {
                        MessageBox.error(this.getI18nBundle().getText("notSameDepartment"));
                        return;
                    }
                    break;
            }

            var oHeader = {
                Zbanfn: oData.results[0].Zbanfn,
                Banfn: oData.results[0].Banfn,
                Bukrs: oData.results[0].Bukrs,
                Ekgrp: oData.results[0].Ekgrp,
                Bsart: oData.results[0].Bsart,
                Badat: formatter.convertDate(oData.results[0].Badat),
                Zspqx: formatter.convertDate(oData.results[0].Zspqx),
                Zsprq: formatter.convertDate(oData.results[0].Zsprq),
                Department: oData.results[0].Department,
                Zjm: oData.results[0].Zjm,
                Zsqly: oData.results[0].Zsqly,
                Zspzt: oData.results[0].Zspzt,
                ZspztText: oData.results[0].ZspztText,
                Loekz: oData.results[0].Loekz,
                Zfinish: oData.results[0].Zfinish,
                Ernam: oData.results[0].Ernam,
                Erdat: formatter.convertDate(oData.results[0].Erdat),
                Erzet: oData.results[0].Erzet,
                Aenam: oData.results[0].Aenam,
                Aedat: formatter.convertDate(oData.results[0].Aedat),
                Aezet: oData.results[0].Aezet,
                Butxt: oData.results[0].Butxt,
                Eknam: oData.results[0].Eknam,
                Batxt: oData.results[0].Batxt,
                Name_text: oData.results[0].Name_text,
                Zzoption: oData.results[0].Zzoption,
                Zzaction: oData.results[0].Zzaction
            };

            //ADD BY STANLEY 20230427
            if (sOption == "2") {
                oHeader.Zsprq = "";
            }

            var aItems = oData.results[0].to_ZzPRItem.results;

            aItems.forEach(function(item, index, array) {
                // var Menge = item.Menge;
                // var Preis = item.Preis;
                // var Peinh = item.Peinh;
                // var Zvat = item.Zvat;
                // var Zconsumtax = item.Zconsumtax;
                // var Zzhje = item.Zzhje;
                array[index].Lfdat = formatter.convertDate(item.Lfdat);
                //array[index].Zbnfpo = array[index].Zbnfpo.toString().replace(/\b(0+)/gi, "");
                array[index].Menge = formatter.amountFormat(array[index].Menge);
                array[index].Preis = formatter.amountFormat(array[index].Preis);
                array[index].Peinh = formatter.amountFormat(array[index].Peinh);
                array[index].Zconsumtax = formatter.amountFormat(array[index].Zconsumtax);
                array[index].Zsubtotal = formatter.amountFormat(array[index].Zsubtotal);
                array[index].Zzhje = formatter.amountFormat(array[index].Zzhje);
                array[index].Zvat = formatter.amountFormat(array[index].Zvat);

                // //金额合计
                // //税抜総額
                // var amount1 = 0;
                // amount1 = this.formatter.accMul(Menge, Preis);
                // total1 = this.formatter.accAdd(total1, amount1);
                // //税込総額
                // amount1 = 0;
                // amount1 = this.formatter.accMul(Menge, Zvat);
                // total2 = this.formatter.accAdd(total2, amount1);
                // //消費税総額
                // amount1 = 0;
                // amount1 = this.formatter.accMul(Menge, Zconsumtax);
                // total3 = this.formatter.accAdd(total3, amount1);
                // //値引き後総額
                // total4 = this.formatter.accAdd(total4, Zzhje);
            }.bind(this));
            // this.getModel("local").setProperty("/total1", formatter.amountFormat(total1));
            // this.getModel("local").setProperty("/total2", formatter.amountFormat(total2));
            // this.getModel("local").setProperty("/total3", formatter.amountFormat(total3));
            // this.getModel("local").setProperty("/total4", formatter.amountFormat(total4));

            var aSum = oData.results[0].to_ZzPRSum.results;
            var total1 = 0,
                total2 = 0,
                total3 = 0,
                total4 = 0;
            aSum.forEach(function(item, index, array) {
                array[index].Znetvalue = formatter.amountFormat(array[index].Znetvalue);
                array[index].Zconsumtax = formatter.amountFormat(array[index].Zconsumtax);
                array[index].Zsubtotal = formatter.amountFormat(array[index].Zsubtotal);
                array[index].Zestvat = formatter.amountFormat(array[index].Zestvat);
                array[index].Zzhje = formatter.amountFormat(array[index].Zzhje);
                array[index].Zvat = formatter.amountFormat(array[index].Zvat);

                formatter.clearCommaToNumber(item.Znetvalue);
                //税抜総額 = 合计：税抜小計金額
                total1 = this.formatter.accAdd(total1, formatter.clearCommaToNumber(item.Znetvalue));
                //税込総額 = 合计：税込小計金額
                total2 = this.formatter.accAdd(total2, formatter.clearCommaToNumber(item.Zsubtotal));
                //消費税総額
                total3 = this.formatter.accAdd(total3, formatter.clearCommaToNumber(item.Zconsumtax));

            }.bind(this));
            this.getModel("local").setProperty("/total1", formatter.amountFormat(total1));
            this.getModel("local").setProperty("/total2", formatter.amountFormat(total2));
            this.getModel("local").setProperty("/total3", formatter.amountFormat(total3));

            this.getModel("local").setProperty("/ZzHeader", oHeader);
            this.getModel("local").setProperty("/ZzItem", aItems);
            this.getModel("local").setProperty("/ZzSum", aSum);
            this.getModel("local").setProperty("/ZzHeaderOld", JSON.parse(JSON.stringify(oHeader)));
            this.getModel("local").setProperty("/ZzItemOld", JSON.parse(JSON.stringify(aItems)));
            this.getModel("local").setProperty("/ZzSumOld", JSON.parse(JSON.stringify(aSum)));


            this.getModel("local").setProperty("/editCreate", false);
            this.getModel("local").setProperty("/editChange", false);

            if (oHeader.Loekz === true || oHeader.Loekz === "") {
                this.getModel("local").setProperty("/editCreate", false);
                this.getModel("local").setProperty("/editChange", false);
            }

            if (oHeader.Zspzt !== "0000") {
                this.getModel("local").setProperty("/editCreate", false);
                this.getModel("local").setProperty("/editChange", false);
            }

            this.getModel("local").refresh();

            this.getRouter().navTo("Detail");
        },

        setBusy: function(bFlag) {
            this.getModel("settings").setProperty("/appProperties/busy", bFlag);
            this.getModel("settings").refresh();
        },

        onDeleteConfirm: function() {
            var oTable = this.byId("internalTable");
            if (oTable.getSelectedIndices().length == 0) {
                messages.showText(this._ResourceBundle.getText("noSelect"));
                return;
            }
            var listItems = oTable.getSelectedIndices();
            var isError = false;
            listItems.forEach(function(sSelected) {
                let key = oTable.getContextByIndex(sSelected).getPath();
                let lineData = this._oDataModel.getProperty(key);
                if (lineData.Banfn !== "") {
                    isError = true;
                }
            }.bind(this));
            if (isError) {
                messages.showText(this._ResourceBundle.getText("msgCantDelete"));
                return;
            }

            MessageBox.warning(this.getI18nBundle().getText("msgDeleteConfirm"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function(sAction) {
                    //MessageToast.show("Action selected: " + sAction);
                    if (sAction === "CANCEL") {
                        return;
                    } else {
                        this.onDelete();
                    }
                }.bind(this)
            });
        },

        onDelete: function() {
            var postDoc = this.prepareDeleteBody();
            postDoc.forEach(function(line, index) {
                this.postDelete(line, index);
            }.bind(this));
        },

        prepareDeleteBody: function() {
            var postDocs = [];
            var oTable = this.byId("internalTable");

            var listItems = oTable.getSelectedIndices();

            listItems.forEach(function(sSelected) {
                let key = oTable.getContextByIndex(sSelected).getPath();
                let lineData = this._oDataModel.getProperty(key);
                postDocs.push(lineData);
            }.bind(this));
            return postDocs;
        },
        postDelete: function(postData, i) {
            this.byId("idDisplayPage").setBusy(true);
            var mParameters = {
                groupId: "Delete" + Math.floor(i / 100),
                changeSetId: i,
                refreshAfterChange: true,
                success: function(oData) {
                    // this.byId("idCol1").setVisible(true);
                    // this.byId("idCol2").setVisible(true);
                    // this.byId("idCol3").setVisible(true);
                    this.byId("idDisplayPage").setBusy(false);
                    messages.showText("Success");
                }.bind(this),
                error: function(oError) {
                    messages.showError(messages.parseErrors(oError));
                    this.byId("idDisplayPage").setBusy(false);
                }.bind(this),
            };
            //复杂结构
            this.getOwnerComponent().getModel().create("/ZzSHZbanfnSet", postData, mParameters);
        }
    });
});