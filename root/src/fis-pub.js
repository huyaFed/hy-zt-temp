var configData = require('./fis-conf/fis-conf-com').getConfig();

//发布设置
configData.roadmap.domain = 'http://hd.huya.com/150722游民星空/dev';

configData.deploy = {
    pub: {
        to: '../dist'
    }
}

fis.config.merge(configData);