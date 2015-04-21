# hy-zt-temp

> 通过 [grunt-init][], 创建一个虎牙专题的模板.

[grunt-init]: http://gruntjs.com/project-scaffolding

## 安装方式
如果你还没安装 [grunt-init][].的话，请安装

npm install -g grunt-init

一旦模板被安装到你的~/.grunt-init/目录中(在Windows平台是%USERPROFILE%\.grunt-init\目录)，那么就可以通过grunt-init命令来使用它们了。建议你使用git将模板克隆到项目目录中。例如, grunt-init-jquery模板可以像下面这样安装：


	git clone https://github.com/huyaFed/hy-zt-temp.git ~/.grunt-init/hy-zt-temp



## 使用

cd到一个空的目录下，然后执行以下cmd的命令


	grunt-init hy-zt-temp


_请注意,该模板将生成文件在当前目录中,所以一定要先切换到一个新目录,如果你不想覆盖现有的文件。._

## 模板说明

该模板使用的是fis的编译工具，依赖于以下插件

* npm install -g fis
* npm install -g fis-parser-utc   //编译underscore模板
* npm install -g fis-postpackager-autoload   //用于自动加载模块化资源的FIS插件
* npm install -g fis-postpackager-simple  //用于自动打包页面零散资源和应用打包资源的FIS插件
* npm install -g fis-postprocessor-require-async   //require.async执行的组件，并把它们记录下来
* npm install -g fis-parser-sass   //编译sass
* npm install -g fis-postprocessor-autoprefixer  //自动补充css3的样式

*fis-parser-sass依赖于 node的版本为0.10.x*