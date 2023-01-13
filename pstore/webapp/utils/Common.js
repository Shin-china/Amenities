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
            if (oDialog) {
                oDialog.close();
                oDialog.destroy();
            }
        },

        openDialog: function (oContext, sViewName) {
            var oDialog = oContext.loadFragment({
                name: sViewName
            }).then(function (oDialog) {
                oDialog.open();
            });
        },

        openCopyDialog: function(oContext, sViewName, srcKaishaCd, srcTenpoCd){
            var oDialog = oContext.loadFragment({
                name: sViewName
            });

            oDialog.then(function (oDialog) {
                oDialog.open();
                oContext.byId("inputTab1Col02").setValue(srcKaishaCd);
                oContext.byId("inputTab1Col05").setValue(srcTenpoCd);
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
            var oDate = new Date(oTempDate.getTime() + oTempDate.getTimezoneOffset() * (60000));
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
                    if(typeof(oObj[f]) === 'number' && f !== 'Seq'){
                        oObj[f] = oObj[f].toString();
                    }
                }
            }

            return aData;
        },

        getI18nMessage(oContext, sMsgProperty){
            var oModel = oContext.getView().getModel("i18n").getResourceBundle();
            var sMsg = oModel.getText(sMsgProperty);
            return sMsg;
        },

        showCustomSearchHelpDialog: function (oContext,oEvent, sTitle, sViewName, sEntitySet, sBindingField, aFilters) {
            oContext._inputSource = oEvent.getSource();
            oContext._aFilters = aFilters;
            oContext._sEntitySet = sEntitySet;
            oContext._sBindingField = sBindingField;
            oContext.loadFragment({ name: sViewName }).then(function (oDialog) {
                oDialog.open();
                var oSmartFilter = oContext.byId("smartFilter");
                oSmartFilter.setEntitySet(oContext._sEntitySet);
                var oSmartTable = oContext.byId("smartTable");
                oSmartTable.setEntitySet(oContext._sEntitySet);
                oContext.byId("dialogSelect").setTitle(sTitle);
            }.bind(oContext));
        },

        getFirstDayOfMonth: function(){
            var dDate = new Date(); 
            var year = dDate.getFullYear();
            var month = dDate.getMonth() + 1;
            var day = '01';
            month = month < 10 ? '0' + month : month;

            return [year, month, day].join('-');
        },

        getLastDayOfMonth: function(){
            var dDate = new Date(); 
            var year = dDate.getFullYear();
            var month = dDate.getMonth() + 1;
            var day = new Date(year, month, 0).getDate();
            month = month < 10 ? '0' + month : month;
            return [year, month, day].join('-');
        },

        getFirstDayOfLastMonth: function(){
            var dDate = new Date(); 
            var year = dDate.getFullYear();
            var month = dDate.getMonth();

            if(month === 0){
                month = 12;
                year = year - 1;
            }

            var day = '01';
            month = month < 10 ? '0' + month : month;

            return [year, month, day].join('-');
        },

        getLastDayOfLastMonth: function(){
            var dDate = new Date(); 
            var year = dDate.getFullYear();
            var month = dDate.getMonth();
            var day = new Date(year, month, 0).getDate();
            month = month < 10 ? '0' + month : month;
            return [year, month, day].join('-');
        }

    });
});