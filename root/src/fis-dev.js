var configData = require('./fis-conf').getConfig();

//开发设置
configData.roadmap.domain = 'http://hd.huya.com/150722游民星空/dev';

configData.deploy = {
    dev: {
        to: '../dev'
    }
}

fis.config.merge(configData);


