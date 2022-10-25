sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "sap/ui/core/format/NumberFormat",
    "sap/ui/core/routing/History"
], function (
    BaseObject,
    MessagePopover,
    MessageItem,
    NumberFormat,
    History
) {
    "use strict";

    return BaseObject.extend("com.shin.pstore.pstore.utils.Common", {

        constructor: function () {

        },

        closeDialog: function (oContext, sDialogId) {
            var oDialog = oContext.getView().byId(sDialogId);
            oDialog.close();
            oDialog.destroy();
        },

        openDialog: function (oContext, sViewName) {
            var oDialog = oContext.loadFragment({
                name: sViewName
            });

            oDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        showMessagePopoverFor: function (oContext, oModel, sBindingPath, sAttachButtonId) {

            var oMessageTemplate = new MessageItem({
                type: '{' + oModel + '>Type}',
                title: '{' + oModel + '>Title}',
                description: '{' + oModel + '>Description}',
                subtitle: '{' + oModel + '>Subtitle}',
                counter: '{' + oModel + '>Counter}'
            });

            oContext._oMessagePopover = new MessagePopover({
                items: {
                    path: oModel + '>' + sBindingPath,
                    template: oMessageTemplate
                },
                groupItems: true
            });

            oContext.byId(sAttachButtonId).addDependent(oContext._oMessagePopover);
            oContext.byId(sAttachButtonId).setVisible(true);
        },

        navBackFrom: function (context) {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(context);
                oRouter.navTo("RouteMain", {}, true);
            }

            context.getView().getModel().refresh();
        },

        convertFrontendDateToOdata: function(value) {
            var oTempDate = new Date(value);
            var oDate = new Date(oTempDate.getTime() + oTempDate.getTimezoneOffset() * (-60000));
            return "\/Date(" + oDate.getTime() + ")\/";
        },

        convertOdataDateToFrontend: function(value) {
            var oTempDate = new Date(value);
            oDate = new Date(oTempDate.getTime() + oTempDate.getTimezoneOffset() * (60000));
            return oDate;
        },

        parseCurrency: function(sCurrency){
            var oCurrencyFormat = NumberFormat.getFloatInstance();
            return oCurrencyFormat.parse(sCurrency);
        }

    });
});