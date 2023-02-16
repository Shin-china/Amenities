sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/routing/History",
        "sap/ui/core/UIComponent",
        "sap/m/MessageBox",
        "./messages",
        "../model/formatter",
        "sap/ui/core/routing/HashChanger",
        "sap/ui/model/Filter",
        "sap/ui/core/Fragment",
        "sap/ui/model/json/JSONModel"
    ],
    function(BaseController, History, UIComponent, MessageBox, messages, formatter, HashChanger, Filter, Fragment) {
        "use strict";

        return BaseController.extend("mm003.controller.Item", {

            formatter: formatter,

            onInit: function() {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
                this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

                var oMessageManager, oView;
                oView = this.getView();

                // set message model
                oMessageManager = sap.ui.getCore().getMessageManager();
                oView.setModel(oMessageManager.getMessageModel(), "messages");
                oMessageManager.registerObject(oView, true);
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("Item").attachMatched(this._onRouteMatched, this);
            },

            //当路径导航到此页面时，设置页面的数据绑定
            _onRouteMatched: function(oEvent) {
                //localmodel中当前行的绑定路径
                var oArgs = oEvent.getParameter("arguments");
                var oHeader = this._oDataModel.getProperty("/" + oArgs.contextPath);
                this.tableConverted_dis(oArgs.contextPath);
                this.getAttachment(oHeader);
                console.log("oHeader", oHeader);
                this._LocalData.setProperty("/item", [oHeader]);
                sap.ui.getCore().getMessageManager().removeAllMessages();

                //每次进入详细页面，默认会保存上一次的section，滚动到页头第一个section
                // var oPageLayout = this.byId("idIconTabBarMulti");
                // oPageLayout.scrollToSection(this.byId("IDGenIconTabFilter1").getId());

                this._LocalData.setProperty("/page1Busy", false);
            },
            tableConverted_dis: function(sKey) {
                var aItemsKey = this._oDataModel.getProperty("/" + sKey + "/to_ZzItems");
                var aTotalKey = this._oDataModel.getProperty("/" + sKey + "/to_ZzTotal");
                var aApprovalHistoryKey = this._oDataModel.getProperty("/" + sKey + "/to_ZzApprovalHistory");
                //获取数据
                // var oHeader = this._oDataModel.getProperty("/" + aItemsKey[0]);
                // oHeader = JSON.parse(JSON.stringify(oHeader));
                var aItems = [];
                var aTotal = [];
                var aApprovalHistory = [];

                aItemsKey.forEach(function(path) {
                    var item = this._oDataModel.getProperty("/" + path);
                    delete item.__metadata;
                    aItems.push(item);
                }.bind(this));

                aTotalKey.forEach(function(path) {
                    var item = this._oDataModel.getProperty("/" + path);
                    delete item.__metadata;
                    aTotal.push(item);
                }.bind(this));

                aApprovalHistoryKey.forEach(function(path) {
                    var item = this._oDataModel.getProperty("/" + path);
                    var sTime = this.formatter.dateTime(item.CREATE_DATE, item.CREATE_TIME);
                    aApprovalHistory.push({
                        // user: item.CREATE_USER,
                        name: item.USERNAME,
                        time: new Date(sTime),
                        comments: item.COMMENTS,
                        action: item.ACTION
                            // nodename: item.NODENAME
                    });
                }, this);

                this._LocalData.setProperty("/Items", aItems);
                this._LocalData.setProperty("/Total", aTotal);
                this._LocalData.setProperty("/approvalHistory", aApprovalHistory);
                this._LocalData.refresh();
            },


            getAttachment: function(oRecord) {
                // var that = this;
                var oNewFilter,
                    aNewFilters = [];
                // var sZbanfn1 = this.getModel("local").getProperty("/Zbanfn");
                // var sZbanfn2 = this.getModel("local").getProperty("/ZzHeader/Zbanfn");
                var sZbanfn = oRecord.ZBANFN;

                // if (sZbanfn2 !== "" || sZbanfn2 !== null) {
                // 	sZbanfn = sZbanfn2;
                // } else {
                // 	sZbanfn = sZbanfn1;
                // }

                aNewFilters.push(new Filter("Objectid", sap.ui.model.FilterOperator.EQ, sZbanfn));
                aNewFilters.push(new Filter("Objtype", sap.ui.model.FilterOperator.EQ, "01"));

                oNewFilter = new Filter({
                    filters: aNewFilters,
                    and: true
                });

                var oParam = {
                    filters: aNewFilters,
                    success: function(oData) {
                        var aAtta = [];
                        aAtta = oData.results;
                        this._LocalData.setProperty("/ZzAttachment", aAtta);
                        this._LocalData.refresh();
                    }.bind(this),
                    error: function(oError) {
                        var sErrorMessage;
                        if (oError.statusCode === "500") {

                        }
                        try {
                            var oJsonMessage = JSON.parse(oError.responseText);
                            sErrorMessage = oJsonMessage.error.message.value;
                        } catch (e) {
                            sErrorMessage = oError.responseText;
                        }

                    }.bind(this)
                };
                this.getOwnerComponent().getModel("Attachment").read("/UploadSet", oParam);

            },

            onApprovalConfirm: function(sAction) {
                //var sTitle = this._ResourceBundle.getText("ConfirmTitle");
                var sText = this._ResourceBundle.getText(sAction);
                this.sAction = sAction;
                var actionStr;
                if (sAction == "Accept") {
                    actionStr = "承認";
                } else if (sAction == "Reject") {
                    actionStr = "却下";
                } else {
                    actionStr = "差戻";
                };
                var oTitle = {
                    title: {
                        name: actionStr
                    }
                }
                if (!this.pDialog) {
                    //load asynchronous XML Fragment
                    this.pDialog = this.loadFragment({
                        name: "mm003.view.fragment.ApprovalComment"
                    });
                }
                this.pDialog.then(function(oDialog) {
                    oDialog.setModel(new sap.ui.model.json.JSONModel(oTitle));
                    oDialog.open();
                }.bind(this));
                /** 
                MessageBox.confirm(sText, {
                    title: sTitle,
                    icon: MessageBox.Icon.WARNING,
                    styleClass: "sapUiSizeCompact",
                    actions: [
                        MessageBox.Action.YES,
                        MessageBox.Action.NO
                    ],
                    onClose: function(sResult) {
                        if (sResult === MessageBox.Action.YES) {
                            var postData = this.getApprovalData();
                            this.postAction(postData);
                        }
                    }.bind(this) 
                });*/
            },
            onConfrimPost: function() {
                var postData = this.getApprovalData();
                debugger;
                this.postAction(postData);
            },

            onCloseDialog: function() {
                this.byId("ApprovalComment").close();
            },

            postAction: function(postData) {
                var mParameters = {
                    groupId: "PurchaseApply" + Math.floor(1 / 100),
                    changeSetId: 1,
                    refreshAfterChange: true,
                    success: function(oData) {
                        this.byId("DetailPage1").setBusy(false);
                        messages.showText(oData.MESSAGE);
                        HashChanger.getInstance().replaceHash("");
                    }.bind(this),
                    error: function(oError) {
                        this.byId("DetailPage1").setBusy(false);
                        messages.showError(messages.parseErrors(oError));
                        HashChanger.getInstance().replaceHash("");
                    }.bind(this),
                };
                this.getOwnerComponent().getModel().setHeaders({ "action": this.sAction });

                this.getOwnerComponent().getModel().create("/ZzHeaderSet", postData, mParameters);
                this.byId("DetailPage1").setBusyIndicatorDelay(0);
                this.byId("DetailPage1").setBusy(true);
            },

            getApprovalData: function() {
                var oRecord = this._LocalData.getProperty("/item/0");
                var postData = {
                    EBELN: oRecord.EBELN,
                    TYPE: oRecord.TYPE,
                    COMMENTS: this.byId("idComments").getValue()
                };
                return postData
            },

            onAttachmentPress: function(oEvent) {

                var Zbanfn = this._LocalData.getProperty("/item/0/ZBANFN");

                // var Zbanfn = this.getModel("local").getProperty("/ZzHeader/Zbanfn");
                var fileName = oEvent.getSource().getProperty("title");
                var url = "/sap/opu/odata/SAP/ZUI5_FILE_UPLOAD_N_SRV";
                if (fileName !== undefined && fileName != null) {
                    url = url + "/UploadSet(Objtype='01',Objectid=" + "'" + Zbanfn + "'" + ",Filename=" + "'" + fileName + "'" + ")/$value";
                    window.open(url, "_blank");
                }

            },
            onNavBack: function() {
                var oHistory, sPreviousHash;

                oHistory = History.getInstance();
                sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else {
                    var oRouter = UIComponent.getRouterFor(this);
                    oRouter.navTo("List", {});
                }
                this.getView().getModel().refresh();
            }


        });
    });