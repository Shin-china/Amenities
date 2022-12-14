sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
    /**
     * provide app-view type models (as in the first "V" in MVVC)
     * 
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     * @param {typeof sap.ui.Device} Device
     * 
     * @returns {Function} createDeviceModel() for providing runtime info for the device the UI5 app is running on
     */
    function (JSONModel, Device) {
        "use strict";
        return {
            // 初始化本地数据集
            _initialLocalData: function () {
                var localData = {
                    busy: false,
                    hasUIChanges: false,
                    errors: "",
                    excelSet: [],
                    upload: [{}],
                    test: [{PRNUMBER:"1000",SUBJECTNAME:"seojle"}] ,
                };
                return localData;
            },

            // 创建本地模型
            createLocalModel: function () {
                var oModel = new JSONModel(this._initialLocalData());
                oModel.setSizeLimit(9999);
                return oModel;
            },
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
        }
    };
});