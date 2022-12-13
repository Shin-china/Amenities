sap.ui.define(
    [
      "sap/ui/core/mvc/Controller",
      "sap/m/MessageBox",
      "./messages",
      "sap/ui/core/UIComponent",
      "sap/ui/core/routing/HashChanger"
    ],
    function(BaseController,MessageBox, messages,HashChanger) {
      "use strict";
  
      return BaseController.extend("mm003.controller.Item", {
        onInit: function () {
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
        _onRouteMatched : function (oEvent) {
            //localmodel中当前行的绑定路径
            var oArgs = oEvent.getParameter("arguments");
            // if (oArgs.view == "Display") { 
            //     this._LocalData.setProperty("/viewEditable", false);
            //     this.byId("idChange").setVisible(true);
            //     this.byId("idChange").setText(this._ResourceBundle.getText("ChangeButton"));
            //     this.byId("idPosting").setVisible(true);

                var oHeader = this._oDataModel.getProperty("/" + oArgs.contextPath);
                // this.byId("getValue").setText(ebeln);
            //     this.initialLocalModel_dis(oHeader);
                this.tableConverted_dis(oArgs.contextPath);
            // } else {
            //     this.resultCalc();
            //     this._LocalData.setProperty("/viewEditable", true);
            //     this.byId("idDailyBalanceCreate").setTitle(this._ResourceBundle.getText("DailyBalanceCreatePage"));
            //     this.byId("idChange").setVisible(false);
            //     this.byId("idPosting").setVisible(false);
            // }
            // sap.ui.getCore().getMessageManager().removeAllMessages();
            this._LocalData.setProperty("/item", [oHeader]);
            this._LocalData.refresh();
        },
        tableConverted_dis: function (sKey) {
          var aItemsKey = this._oDataModel.getProperty("/" + sKey + "/to_ZzItems");
          var aTotalKey = this._oDataModel.getProperty("/" + sKey + "/to_ZzTotal");
          // var aCahsIncomKey = this._oDataModel.getProperty("/" + sKey + "/to_ZzCashIncome");
          // var aCahsPaymentKey = this._oDataModel.getProperty("/" + sKey + "/to_ZzCashPayment");
          // var aTreasuryCashKey = this._oDataModel.getProperty("/" + sKey + "/to_ZzTreasuryCash");

          //获取数据
          // var oHeader = this._oDataModel.getProperty("/" + aItemsKey[0]);
          // oHeader = JSON.parse(JSON.stringify(oHeader));
          var aItems = [];
          var aTotal = [];

          aItemsKey.forEach(function (path) {
              var item = this._oDataModel.getProperty("/" + path);
              delete item.__metadata;
              aItems.push(item);
          }.bind(this));

          aTotalKey.forEach(function (path) {
            var item = this._oDataModel.getProperty("/" + path);
            delete item.__metadata;
            aTotal.push(item);
        }.bind(this));
          // var aCahsIncome = [], aCahsPayment = [];
          // aCahsIncomKey.forEach(function (path) {
          //     var item = this._oDataModel.getProperty("/" + path);
          //     delete item.__metadata;
          //     aCahsIncome.push(item);
          // }.bind(this));
          // aCahsPaymentKey.forEach(function (path) {
          //     var item = this._oDataModel.getProperty("/" + path);
          //     delete item.__metadata;
          //     aCahsPayment.push(item);
          // }.bind(this));
          // var oTreasuryCash = this._oDataModel.getProperty("/" + aTreasuryCashKey[0]);

          // this.setLocalModel_dis(oHeader);

          // 转换数据
          // 用于参考，如果是参考创建就需要将之前的起票号码清除
          // if (!this._LocalData.getProperty("/isCreate")) {
          //     oHeader.KIHYO_NO = "";
          // }
          // this._LocalData.setProperty("/item", [oHeader]);
          this._LocalData.setProperty("/Items",aItems);
          this._LocalData.setProperty("/Total",aTotal);
          // this.byId("idSelectWeather").setSelectedKey(oHeader.TENKI);
          // var table6 = this._LocalData.getProperty("/table6");
          // table6.forEach(function (line, index) {
          //     switch (index) {
          //         case 0://特会員
          //             line.Quantity = oHeader.TOKKAIIN_KENSUU6;
          //             line.Amount = oHeader.TOKKAIIN_AMT6;
          //             line.Remark = oHeader.TOKKAIIN_BIKOU6;
          //             break;
          //         case 1://販シニア
          //             line.Quantity = oHeader.HANSINIA_KENSUU6;
          //             line.Amount = oHeader.HANSINIA_AMT6;
          //             line.Remark = oHeader.HANSINIA_BIKOU6;
          //             break;
          //         case 2://その他
          //             line.Quantity = oHeader.SONOTA_KENSUU6;
          //             line.Amount = oHeader.SONOTA_AMT6;
          //             line.Remark = oHeader.SONOTA_BIKOU6;
          //             break;
          //         case 3://合計
          //             line.Quantity = oHeader.NEBIKI_GKI_KENSUU6;
          //             line.Amount = oHeader.NEBIKI_GKI_AMT6;
          //     }
          // }.bind(this));
          this._LocalData.refresh();
        },
        onApprovalConfirm: function(sAction) {
          var sTitle = this._ResourceBundle.getText("ConfirmTitle");
          var sText = this._ResourceBundle.getText(sAction);
          this.sAction = sAction;
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
                    var postData = this.getApprovalData();
                    this.postAction(postData);
                }
            }.bind(this)
          });
        },

        postAction: function (postData) {
          var mParameters = {
              groupId: "PurchaseApply" + Math.floor(1 / 100),
              changeSetId: 1,
              refreshAfterChange:true,
              success: function (oData) {
                  this.byId("DetailPage1").setBusy(false);
                  messages.showText(oData.MESSAGE);
                  HashChanger.getInstance().replaceHash("");
              }.bind(this),
              error: function (oError) {
                  this.byId("DetailPage1").setBusy(false);
                  messages.showError(messages.parseErrors(oError));
                  HashChanger.getInstance().replaceHash("");
              }.bind(this),
          };
          this.getOwnerComponent().getModel().setHeaders({"action":this.sAction});

          this.getOwnerComponent().getModel().create("/ZzHeaderSet", postData, mParameters);
          // this.byId("DetailPage2").setBusyIndicatorDelay(0);
        },

        getApprovalData: function () {
          var oRecord = this._LocalData.getProperty("/item/0");
          var postData = {
              EBELN: oRecord.EBELN,
              TYPE: oRecord.TYPE,
              COMMENTS: this.byId("TextArea1").getValue()
          };
          return postData
        },
      });
    }
  );
  