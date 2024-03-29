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
    function(JSONModel, Device) {
        "use strict";

        return {
            // 初始化本地数据集
            _initialLocalData: function() {
                var localData = {
                    busy: false,
                    approvalHistory: [
                        { name: "张三", position: "职员", time: "Date(1670818332000)", comment: "审批通过" },
                        { name: "李四", position: "经理", time: "Date(1670904732000)", comment: "审批通过" },
                        { name: "王五", position: "总经理", time: "Date(1670919132000)", comment: "审批通过" }
                    ]
                };
                return localData;
            },
            createDeviceModel: function() {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },
            // 创建本地模型
            createLocalModel: function() {
                var oModel = new JSONModel(this._initialLocalData());
                oModel.setSizeLimit(9999);
                return oModel;
            }
        };
    });