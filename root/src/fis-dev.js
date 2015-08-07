var configData = require('./fis-conf').getConfig();

//开发设置
fis.config.set('roadmap.domain', 'http://gamersky.huya.com');

configData.deploy = {
    dev: {
        to: '../dev'
    }
}

fis.config.merge(configData);


