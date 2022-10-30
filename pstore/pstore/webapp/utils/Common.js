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

        showMessagePopoverFor: function (oContext, sModel, sBindingPath, sAttachButtonId) {

            var oMessageTemplate = new MessageItem({
                type: '{' + sModel + '>Type}',
                title: '{' + sModel + '>Title}',
                description: '{' + sModel + '>Description}',
                subtitle: '{' + sModel + '>Subtitle}',
                counter: '{' + sModel + '>Counter}'
            });

            oContext._oMessagePopover = new MessagePopover({
                items: {
                    path: sModel + '>' + sBindingPath,
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

        convertFrontendDateToOdata: function (value) {
            var oTempDate = new Date(value);
            var oDate = new Date(oTempDate.getTime() + oTempDate.getTimezoneOffset() * (-60000));
            return "\/Date(" + oDate.getTime() + ")\/";
        },

        convertOdataDateToFrontend: function (value) {
            var oTempDate = new Date(value);
            oDate = new Date(oTempDate.getTime() + oTempDate.getTimezoneOffset() * (60000));
            return oDate;
        },

        parseCurrency: function (sCurrency) {
            var oCurrencyFormat = NumberFormat.getFloatInstance();
            return oCurrencyFormat.parse(sCurrency);
        },

        getTableData: function (oContext, sTableId, ...convertFields) {
            var arr = [];
            var rows = oContext.byId(sTableId).getRows();
            for (var r of rows) {
                var item = r.getBindingContext().getObject();
                delete item.__metadata;

                if (convertFields != null && convertFields.length > 0) {
                    for (var f of convertFields) {
                        if (typeof (item[f]) === 'number') {
                            item[f] = item[f].toString();
                        }
                    }
                }

                arr.push(item);
            }

            return arr;
        },

        convertJsonNumberToString: function(oObj){
            for(var f in oObj){
                if(typeof(oObj[f]) === 'number'){
                    oObj[f] = oObj[f].toString();
                }
            }

            return oObj;
        },

        convertJsonBooleanToString: function(oObj, ...fields){
            for(var f in oObj){
                if(fields.indexOf(f) !== -1 && typeof(oObj[f]) === 'boolean'){
                    if(oObj[f] === true){
                        oObj[f] = 'X';
                    }else{
                        oObj[f] = '';
                    }
                }
            }

            return oObj;
        },

        convertCashData: function(aData){
            //var that = this;
            for(var oObj of aData){
                //that.convertJsonBooleanToString(a, 'Jidoutenkifuyo');
                for(var f in oObj){
                    if(typeof(oObj[f]) === 'number'){
                        oObj[f] = oObj[f].toString();
                    }else if(f === 'Jidoutenkifuyo'){
                        if(oObj[f] === true){
                            oObj[f] = 'X';
                        }else{
                            oObj[f] = '';
                        }
                    }
                }
            }

            return aData;
        }

    });
});