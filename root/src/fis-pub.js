var configData = require('./fis-conf').getConfig();

//发布设置
fis.config.set('roadmap.domain', 'http://gamersky.huya.com');

configData.deploy = {
    pub: {
        to: '../dist'
    }
}

fis.config.merge(configData);