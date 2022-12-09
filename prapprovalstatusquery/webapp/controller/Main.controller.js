sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageToast) {
        "use strict";

        return Controller.extend("MM.prapprovalstatusquery.controller.Main", {
            onInit: function () {

            },

            onPressApprHistory: function () {
                var oView = this.getView();
                //加载fragment 返回一个promise
                if (!this._pDialog) {
                    this._pDialog = this.loadFragment({
                        id: oView.getId(),
                        name: "MM.prapprovalstatusquery.view.fragment.DefaultDialog",
                        controller: this
                    }).then(function (oDialog){
                        // oDialog.setModel(oView.getModel());
                        return oDialog;
                    });
                }
                this._pDialog.then(function(oDialog){
                    // this._configDialog(oButton, oDialog);
                    oDialog.open();
                }.bind(this));
            }
        });
    });
