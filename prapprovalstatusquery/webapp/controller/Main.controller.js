sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/Button",
    "sap/ui/model/Filter",
    "../model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageToast, Button, Filter, formatter) {
        "use strict";
        
        return Controller.extend("MM.prapprovalstatusquery.controller.Main", {
            formatter: formatter,
            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
                this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },


            onPressApprHistory: function (oEvent) {
                //获取当前行的采购申请号
                var oItem = oEvent.getSource().getBindingContext().getObject();
                this._Prnumber = oItem.Prnumber;
                this._Subjectname = oItem.Subjectname;

                var oView = this.getView();
                //加载fragment 返回一个promise
                if (!this._pDialog) {
                    this._pDialog = this.loadFragment({
                        id: oView.getId(),
                        name: "MM.prapprovalstatusquery.view.fragment.ApprovalStatus",
                        controller: this
                    }).then(function (oDialog){
                        // oDialog.setModel(oView.getModel());
                        return oDialog;
                    }.bind(this));
                } else {
                    var sFragmentId = oView.createId(oView.getId());
                    var oSmartTable = sap.ui.core.Fragment.byId(sFragmentId, "smartTableApprovalStatus");
                    oSmartTable.rebindTable();
                }
                var that = this;
                this._pDialog.then(function(oDialog){
                    that._configDialog(oDialog);
                    oDialog.open();
                }.bind(this));
            },

            _configDialog: function (oDialog) {
                var endButton = new Button({
                    text: this._ResourceBundle.getText("close"),
                    press: function () {
                        oDialog.close();
                    }.bind(this)
                });
                // 添加按钮
                if (oDialog.getButtons().length === 0){
                    oDialog.addButton(endButton);
                }
            },

            onApprovalStatusBeforeRebind: function (oEvent) {
                var aFilter = oEvent.getParameter("bindingParams").filters;

                var aFilters = [];
                
                aFilters.push(new Filter("Prnumber", "EQ", this._Prnumber)); 
                var oNewFilter = new Filter({
                    filters:aFilters,
                    and:true
                });
                if (aFilters.length > 0) {
                    aFilter.push(oNewFilter);
                }
            },

            onPress: function(oEvent) {
		 
                // get a handle on the global XAppNav service
                var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"); 
                oCrossAppNavigator.isIntentSupported(["ZF_MM_ADDON_PO_002-display"])
                    .done(function(aResponses) {
    
                    })
                    .fail(function() {
                        new sap.m.MessageToast("Provide corresponding intent to navigate");
                    });
                // generate the Hash to display a employee Id
                var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject: "ZF_MM_ADDON_PO_002",
                        action: "display"
                    },
                    params: {
                        "model": "display",
                        "prnumber": "3500010927"
                    }
                })) || ""; 
                //Generate a  URL for the second application
                var url = window.location.href.split('#')[0] + hash; 
                //Navigate to second app
                sap.m.URLHelper.redirect(url, true); 
            }
        });
    });
