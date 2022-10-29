sap.ui.define(["sap/ui/core/format/NumberFormat"], function (NumberFormat) {
    "use strict";
    return {
        buttonIconFormatter: function (aMessages) {
            var sIcon;

            if (!aMessages || aMessages === []) {
                return "sap-icon://information";
            }

            aMessages.forEach(function (sMessage) {
                switch (sMessage.Type) {
                    case "Error":
                        sIcon = "sap-icon://error";
                        break;
                    case "Warning":
                        sIcon = sIcon !== "sap-icon://error" ? "sap-icon://alert" : sIcon;
                        break;
                    case "Success":
                        sIcon = "sap-icon://error" && sIcon !== "sap-icon://alert" ? "sap-icon://sys-enter-2" : sIcon;
                        break;
                    default:
                        sIcon = !sIcon ? "sap-icon://information" : sIcon;
                        break;
                }
            });

            return sIcon;
        },

        buttonTypeFormatter: function (aMessages) {
            var sHighestSeverityIcon;

            if (!aMessages || aMessages === []) {
                return;
            }

            aMessages.forEach(function (sMessage) {
                switch (sMessage.Type) {
                    case "Error":
                        sHighestSeverityIcon = "Negative";
                        break;
                    case "Warning":
                        sHighestSeverityIcon = sHighestSeverityIcon !== "Negative" ? "Critical" : sHighestSeverityIcon;
                        break;
                    case "Success":
                        sHighestSeverityIcon = sHighestSeverityIcon !== "Negative" && sHighestSeverityIcon !== "Critical" ? "Success" : sHighestSeverityIcon;
                        break;
                    default:
                        sHighestSeverityIcon = !sHighestSeverityIcon ? "Neutral" : sHighestSeverityIcon;
                        break;
                }
            });

            return sHighestSeverityIcon;
        },

        highestSeverityMessages: function (aMessages) {

            if (!aMessages || aMessages === []) {
                return;
            }


            var sHighestSeverityIcon;

            aMessages.forEach(function (sMessage) {
                switch (sMessage.Type) {
                    case "Error":
                        sHighestSeverityIcon = "Negative";
                        break;
                    case "Warning":
                        sHighestSeverityIcon = sHighestSeverityIcon !== "Negative" ? "Critical" : sHighestSeverityIcon;
                        break;
                    case "Success":
                        sHighestSeverityIcon = sHighestSeverityIcon !== "Negative" && sHighestSeverityIcon !== "Critical" ? "Success" : sHighestSeverityIcon;
                        break;
                    default:
                        sHighestSeverityIcon = !sHighestSeverityIcon ? "Neutral" : sHighestSeverityIcon;
                        break;
                }
            });

            var sHighestSeverityMessageType;

            switch (sHighestSeverityIcon) {
                case "Negative":
                    sHighestSeverityMessageType = "Error";
                    break;
                case "Critical":
                    sHighestSeverityMessageType = "Warning";
                    break;
                case "Success":
                    sHighestSeverityMessageType = "Success";
                    break;
                default:
                    sHighestSeverityMessageType = !sHighestSeverityMessageType ? "Information" : sHighestSeverityMessageType;
                    break;
            }

            return aMessages.reduce(function (iNumberOfMessages, oMessageItem) {
                return oMessageItem.Type === sHighestSeverityMessageType ? ++iNumberOfMessages : iNumberOfMessages;
            }, 0);
        },

        logStatusFormat: function(sStatus) {
            switch (sStatus) {
                case "Success":
                    return "sap-icon://accept";
                case "Error":
                    return "sap-icon://error";
                default:
                    return "sap-icon://alert";
            }
        },

        logStateFormat: function(sStatus) {
            switch (sStatus) {
                case "Success":
                    //return "Accept";
                    return "green";
                case "Error":
                    //return "Reject";
                    return "red";
                default:
                    //return "Attention";
                    return "orange";
            }
        },

        formatNumber: function(number){
            if(number == 0 || number == "0"){
                return "";
            }

            return number;
        },

        formatSumCurrency: function(Waers, ...vals){
            var oCurrencyFormat = NumberFormat.getCurrencyInstance({showMeasure: false}); 
            var sum = 0;
            for(var i = 0; i < vals.length; i++){
                sum += Number(vals[i]);
            }
            
            return oCurrencyFormat.format(sum, Waers);
        },

        //カード販売合計
        formatKadoHanbaiGokei: function(HanbaiAmt, SekisanAmt, Waers){
            var oCurrencyFormat = NumberFormat.getCurrencyInstance({showMeasure: false});
            var sum = Number(HanbaiAmt) - Number(SekisanAmt);
            return oCurrencyFormat.format(sum, Waers);
        },

        formatGoodsTodayRemain: function(yesterdayRemain, todayIn, todayOut){
            var sum = 0.00;
            sum = Number(yesterdayRemain) + Number(todayIn) - Number(todayOut);
            return sum.toFixed(2);
        },

        formatGoodsTodayRemainAmount: function(waers,yesterdayRemain, todayIn, todayOut, price){
            var qty = 0.00;
            var oCurrencyFormat = NumberFormat.getCurrencyInstance({showMeasure: false});
            qty = Number(yesterdayRemain) + Number(todayIn) - Number(todayOut);
            var amount = qty * Number(price);
            
            return oCurrencyFormat.format(amount, waers);
        },

        formatEffectiveCash: function(desc, man, waers){
            var oCurrencyFormat = NumberFormat.getCurrencyInstance({showMeasure: false});
            var oCurrencyParse = NumberFormat.getFloatInstance();
            var amount = oCurrencyParse.parse(desc) * Number(man);
            return oCurrencyFormat.format(amount, waers);
        },

        formatCheckbox: function(sVal){
            if(sVal == "X"){
                return true;
            }else{
                return false;
            }
        }
    };
});