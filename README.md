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

* npm install -g fis@1.9.2
* npm install -g fis-parser-utc@0.0.2   //编译underscore模板
* npm install -g fis-postpackager-autoload@1.2.7   //用于自动加载模块化资源的FIS插件
* npm install -g fis-postpackager-simple@0.0.23  //用于自动打包页面零散资源和应用打包资源的FIS插件
* npm install -g fis-postprocessor-require-async@0.0.9   //require.async执行的组件，并把它们记录下来
* npm install -g fis-parser-sass@0.3.9   //编译sass
* npm install -g fis-postprocessor-autoprefixer@0.0.3  //自动补充css3的样式

*fis-parser-sass依赖于 node的版本为0.10.x*




#代码规范


----------


## HEAD中添加信息

	//禁止浏览器从本地机的缓存中调阅页面内容
	<meta http-equiv="Pragma" content="no-cache">
	//用来防止别人在框架里调用你的页面
 	<meta http-equiv="Window-target" content="_top">
	//网页不会被缓存
	<meta http-equiv="Cache-Control" content="no-cache, must-revalidate">
	//IE支持通过特定<meta>标签来确定绘制当前页面所应该采用的IE版本。除非有强烈的特殊需求，否则最好是设置为edge mode ，从而通知IE采用其所支持的最新的模式。
	<meta http-equiv="X-UA-Compatible" content="IE=Edge">
	//作者
	<meta name="author" content="smile@kang.cool">
	//网页描述
	<meta name="description" content="hello">
	//关键字,“，”分隔
	<meta name="keywords" content="a,b,c">
	//360浏览器强制用极速模式
	<meta name="renderer" content="webkit">

## 特殊符号应使用转意符

	<    -->    &lt;
	>    -->    &gt;
	空格  -->    &nbsp;

## CSS样式新建或修改尽量遵循以下原则

	根据新建样式的适用范围分为三级：全站级、产品级、页面级。
	尽量通过继承和层叠重用已有样式。
	不要轻易改动全站级CSS。改动后，要经过全面测试。

## CSS属性显示顺序

	显示属性
	元素位置
	元素属性
	元素内容属性
	
	.header {
			/* 显示属性 */
		    display || visibility
		    list-style
		    position top || right || bottom || left
		    z-index
		    clear
		    float
			/* 自身属性 */
		    width max-width || min-width
		    height max-height || min-height
		    overflow || clip
		    margin
		    padding
		    outline
		    border
		    background
			/* 文本属性 */
		    color
		    font
		    text-overflow
		    text-align
		    text-indent
		    line-height
		    white-space
		    vertical-align
		    cursor
		    content
	    };