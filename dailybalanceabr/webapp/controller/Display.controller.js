sap.ui.define([
    "FICO/dailybalanceabr/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/m/Button",
    "../model/formatter",
    "./messages"
],
    function (BaseController, Filter, Button, formatter, messages) {
        "use strict";

        return BaseController.extend("FICO.dailybalanceabr.controller.Display", {
            formatter:formatter,
            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
                this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

                //filter 默认值
                var oDateRange = this.byId("idDateRange");
                var currentDate = new Date();
                var dateFrom = new Date();
                var dateTo = new Date();
                if (currentDate.getDate() == 1) {
                    dateFrom.setMonth(dateFrom.getMonth() - 1);
                } else {
                    dateFrom.setDate(1);
                    dateTo.setMonth(dateTo.getMonth() + 1) ;
                    dateTo.setDate(0);
                }
                oDateRange.setFrom(dateFrom);
                oDateRange.setTo(dateTo);
            },

            onBeforeRebindTable: function(oEvent) {
                var oFilter = oEvent.getParameter("bindingParams").filters;
                var oNewFilter, aNewFilter = [];
                var dFrom = this.byId("idDateRange").getFrom();
                var dTo = this.byId("idDateRange").getTo();
                if (dTo && dFrom) {
                    dFrom = this.formatter.date_8(dFrom);
                    dTo = this.formatter.date_8(dTo);
                    aNewFilter.push(new Filter("EIGYO_BI", "BT", dFrom, dTo)); 
                }

                oNewFilter = new Filter({
                    filters:aNewFilter,
                    and:true
                });
                if (aNewFilter.length > 0) {
                    oFilter.push(oNewFilter);
                }

                this.byId("idCol1").setVisible(false);
                this.byId("idCol2").setVisible(false);
                this.byId("idCol3").setVisible(false);
            },

            onDataReceived: function (oEvent) {
                this.tableRows = oEvent.getParameters().getParameter("data")["results"];
            },

            onReversePress: function () {
                //至少选择一条
                var oTable = this.byId("reportTable");
                if (oTable.getSelectedIndices().length == 0) {
                    messages.showText(this._ResourceBundle.getText("noSelect"));
                    return;
                }

                if (!this.pDialog) {
                    this.pDialog = this.loadFragment({
                        name: "FICO.dailybalanceabr.view.fragment.ReverseDialog"
                    });
                } 

                this.pDialog.then(function(oDialog) {
                    var beginButton = new Button({
                        type: "Emphasized",
                        text: this._ResourceBundle.getText("Create"),
                        //登录按钮
                        press: function () {
                            oDialog.close();
                            this.onReserve();
                            this.byId("idDisplayPage").setBusy(false);
                        }.bind(this)
                    });
                    var endButton = new Button({
                        text: this._ResourceBundle.getText("Suspend"),
                        press: function () {
                            oDialog.close();
                            this.byId("idDisplayPage").setBusy(false);
                        }.bind(this)
                    });
                    //设置标题
                    // 添加按钮
                    if (oDialog.getButtons().length === 0){
                        oDialog.addButton(beginButton);
                        oDialog.addButton(endButton);
                    }
                    oDialog.open();
                }.bind(this));
            },

             // 日记表数据保存
             onReserve: function (sAction) {
                var postDoc = this.prepareReserveBody();
                this.byId("idDisplayPage").setBusy(true);
                postDoc.forEach(function (line, index) {
                    this.postReserve(line, index);
                }.bind(this));
            },

            // 准备保存需要的数据
            prepareReserveBody: function() {
                var postDocs = [], aData = [];	
                var oTable = this.byId("reportTable");
 
                var postDocItem = this.tableRows;

                //将其他相同起番号的行也选中
                //获取选中的行
                var listItems = oTable.getSelectedIndices();
                //得到选中行的flag
                var aFlag = [];
                listItems.forEach(function (sSelected) {
                    let key = oTable.getContextByIndex(sSelected).getPath();
                    let lineData = this._oDataModel.getProperty(key); 
                    aFlag.push(lineData.FLAG);                    
                }.bind(this));
                //去重
                aFlag = Array.from(new Set(aFlag));
                var aShouldBeSelected = [];
                //找到应该被选中的行
                postDocItem.forEach(function (line, index) {
                    if (aFlag.includes(line.FLAG)) {
                        aShouldBeSelected.push(index);
                    }
                });
                //设置应该选中的行
                aShouldBeSelected.forEach(function (iRowIndex) {
                    oTable.addSelectionInterval(iRowIndex,iRowIndex);
                });

                //重新获取选中的行号
                listItems = oTable.getSelectedIndices();
                listItems.forEach(_getData,this); //根据选择的行获取具体的数据
                function _getData(sSelected, index) { //sSelected为选中的行
                    var key = oTable.getContextByIndex(sSelected).getPath();
                    var lineData = this._oDataModel.getProperty(key); //根据选中的行获取到ODATA键值，然后再获取到具体属性值
                    aData.push(lineData);
                }
                var sSTGRD = this.byId("idSelectReversalReason").getSelectedKey();
                var sDate = this.byId("idDP1").getValue();
                if (sDate) {
                    sDate = this.formatter.date_8(sDate);
                }
                aData.forEach(function (line) {
                    var oPostDoc = JSON.parse(JSON.stringify(line));
                    delete oPostDoc.__metadata;
                    oPostDoc.STGRD = sSTGRD;
                    oPostDoc.BUDAT = sDate;
                    postDocs.push(oPostDoc);
                });
                
                return postDocs;
            },

            postReserve: function (postData, i) {
                this.byId("idDisplayPage").setBusy(true);
                var mParameters = {
                    groupId: "DailyBalanceReserve" + Math.floor(i / 100),
                    changeSetId: i,
                    success: function (oData) {
                        this.byId("idCol1").setVisible(true);
                        this.byId("idCol2").setVisible(true);
                        this.byId("idCol3").setVisible(true);
                        this.byId("idDisplayPage").setBusy(false);
                    }.bind(this),
                    error: function (oError) {  
                        // messages.showError(messages.parseErrors(oError));
                    }.bind(this),
                };
                // this.getOwnerComponent().getModel().setHeaders({"button":sAction});
                //复杂结构
                this.getOwnerComponent().getModel().create("/ZzDailyBalanceDisplaySet", postData, mParameters);
                // this.byId("idDailyBalanceCreate").setBusyIndicatorDelay(0);
                // this.byId("idDailyBalanceCreate").setBusy(true);
            }
        });
    });