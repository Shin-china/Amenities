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
                    isCreate:true,
                    actionButtonsInfo: {
                        midColumn:{
                            closeColumn: null,
                            exitFullScreen: null,
                            fullScreen: "MidColumnFullScreen"
                        },
                        endColumn:{
                            closeColumn: null,
                            exitFullScreen: null,
                            fullScreen: null
                        }
                    },
                    filterField:[
                        {
                            field:"type",
                            title:"日记表类型",
                            values:[
                                {text:"abr"},
                                {text:"abb"},
                                {text:"abc"}
                            ]
                        },
                        {
                            field:"no",
                            title:"店铺号",
                            values:[
                                {text:"K92873"},
                                {text:"K38343"},
                                {text:"K93838"},
                                {text:"K93854"},
                                {text:"K93298"},
                                {text:"K93398"},
                            ]
                        },
                        {
                            field:"company",
                            title:"公司代码",
                            values:[
                                {text:"1000"},
                                {text:"1001"}
                            ]
                        }
                    ],
                    testList: [
                        {type:"abr",no:"K92873",date:"20220901",company:"1000",companyname:"测试公司1"},
                        {type:"abb",no:"K38343",date:"20220902",company:"1000",companyname:"测试公司1"},
                        {type:"abc",no:"K93838",date:"20220903",company:"1001",companyname:"测试公司2"},
                        {type:"abc",no:"K93854",date:"20220903",company:"1001",companyname:"测试公司2"},
                        {type:"abc",no:"K93298",date:"20220903",company:"1001",companyname:"测试公司2"},
                        {type:"abc",no:"K93398",date:"20220903",company:"1001",companyname:"测试公司2"}
                    ],
                    approvalHistory: [
                        {name:"张三",position:"职员",time:"Date(1670818332000)",comment:"审批通过"},
                        {name:"李四",position:"经理",time:"Date(1670904732000)",comment:"审批通过"},
                        {name:"王五",position:"总经理",time:"Date(1670919132000)",comment:"审批通过"}
                    ]
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
            },
            createInitModel: function () {
                var oModel = new JSONModel(sap.ui.require.toUrl("FICO/dailybalanceapproval/model/CreateInit.json"));
                return oModel;
            }
    };
});