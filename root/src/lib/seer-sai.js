/**
 * seer-sai ： 收集全局的异常，并为后续业务准备好可用的 API
 */
(function(global){

	if(global.Sai){return;}

	var M = global.Sai = {};
	M._DATAS = [];

	var DEFAULT_PROFILE = "log";

	// 通用监控接口。
	// @param {Object,String} seed, 监控信息详情。
	// @param {String} profile, 监控类型，默认为 `log`。
	// @return {Object}
	M.log = function(seed, profile){
		if(!seed){return;}

		// 取消老版产品监控。
		//if(arguments.length >= 3){return;}

		var data;
		if(Object.prototype.toString.call(seed) === "[object Object]"){
			data = seed;
			data.profile = profile || data.profile || DEFAULT_PROFILE;
		}else{
			data = {
				profile: profile || DEFAULT_PROFILE,
				msg: seed
			};
		}
		M._DATAS.push(data);
		return data;
	};

})(this);

/**
 * seer-jsniffer ： JavaScript 异常监控
 */

(function(global, Sai){

	if(!Sai){return;}

	var DEFAULT_PROFILE = "jserror";
	var MAX_STACKTRACE_DEEP = 20;
	var RE_FUNCTION = /^\s*function\b[^\)]+\)/;

	var lost_resources = [];
	var lost_resources_cache = {};

  	// 客户端资源加载失败时调用这个接口。
	Sai.lost = function(uri){
		if(lost_resources_cache.hasOwnProperty(uri)){return;}
		lost_resources_cache[uri] = true;

		lost_resources.push(uri);
		return lost_resources;
	};

	// 获得函数名。
	// @param {Function} func, 函数对象。
	// @return {String} 函数名。
	function function_name(func){
		var match = String(func).match(RE_FUNCTION);
		return match ? match[0] : "global";
	}

	// 函数调用堆栈。
	// @param {Function} call, function's caller.
	// @return {String} stack trace.
	function stacktrace(call){
		var stack = [];
		var deep = 0;

		while(call.arguments && call.arguments.callee && call.arguments.callee.caller){

	  		call = call.arguments.callee.caller;
	  		stack.push("at " + function_name(call));

			  // Because of a bug in Navigator 4.0, we need this line to break.
			  // c.caller will equal a rather than null when we reach the end
			  // of the stack. The following line works around this.
		  	if (call.caller === call){break;}

		  	if((deep++) > MAX_STACKTRACE_DEEP){break;}
		}
		return stack.join("\n");
	}

	// 用于缓存识别同一个异常。
	var ERROR_CACHE = {};

	// JavaScript 异常统一处理函数。
	// @param {String} catchType, 捕获异常的类型。
	// @param {String} message, 异常消息。
	// @param {String} file, 异常所在文件。
	// @param {Number} line, 异常所在行。
	// @param {Number,String} number, 异常编码，IE 支持。
	// @return {Object} 主要用于单元测试，本身可以不返回。
	function error(catchType, message, file, line, column, number, stack){
		if(!stack && arguments.callee.caller){
		  stack = stacktrace(arguments.callee.caller);
		}

		var data = {
			profile: DEFAULT_PROFILE,
			type: catchType,
			msg: message || "",
			file: file || "",
			line: line || 0,
			col: column || 0,
			num: number || "",
			stack: stack || "",
			//lang: navigator.language || navigator.browserLanguage || "",
			lost: lost_resources.join(",")
		};

		var key = file + ":" + line + ":" + message;
		if(!ERROR_CACHE.hasOwnProperty(key)){
			data.uv = 1;
			ERROR_CACHE[key] = true;
		}

		return Sai.log(data);
	}


	// JavaScript 异常接口，用于监控 `try/catch` 中被捕获的异常。
	// @param {Error} err, JavaScript 异常对象。
	// @return {Object} 主要用于单元测试。
	Sai.error = function(ex){
		if(!(ex instanceof Error)){return;}
		return error(
		  	"catched",
			ex.message || ex.description,
			ex.filename || ex.fileName || ex.sourceURL,
			ex.lineno || ex.lineNumber || ex.line,
			ex.colno || ex.columnNumber,
			ex.number,
			ex.stack || ex.stacktrace
		);
	};

	// 全局 JavaScript 异常监控。
	// @return {Boolean} 返回 `true` 则捕获异常，浏览器控制台不显示异常信息。
	//                   返回 `false` 则不捕获异常，浏览器控制台显示异常信息。
	//                   建议返回 `false`。
	global.onerror = function(message, file, line, column) {
		error("global", message, file, line, column);
		return false;
	};

})(this, this.Sai);

//发送
(function(win){

	var M = win.Sai;

	// 避免未引用先行脚本抛出异常。
	if(!M){M = {};}
	if(!M._DATAS){M._DATAS = [];}


	// UTILS -------------------------------------------------------

	function typeOf(obj){
		return Object.prototype.toString.call(obj);
	}

	// 合并 oa, ob 两个对象的属性到新对象，不修改原有对象。
	// @param {Object} target, 目标对象。
	// @param {Object} object, 来源对象。
	// @return {Object} 返回目标对象，目标对象附带有来源对象的属性。
	function merge(oa, ob){
		var result = {};

		for(var i=0,o,l=arguments.length; i<l; i++){
		o = arguments[i];
		for(var k in o){
			if(has(o, k)){
			result[k] = o[k];
			}
		}
		}
		return result;
	}

	// simple random string.
	// @return {String}
	function rand(){
		return (""+Math.random()).slice(-6);
	}

	// 获得资源的路径（不带参数和 hash 部分）
	// 另外新版 Arale 通过 nginx 提供的服务，支持类似：
	// > https://www.example.com/??a.js,b.js,c.js
	// 的方式请求资源，需要特殊处理。
	//
	// @param {String} uri, 仅处理绝对路径。
	// @return {String} 返回 uri 的文件路径，不包含参数和 jsessionid。
	function path(uri){
		if(undefined === uri || typeof(uri) !== "string"){return "";}
		var len = uri.length;

		var idxSessionID = uri.indexOf(";jsessionid=");
		if(idxSessionID < 0){idxSessionID = len;}

		// 旧版的合并 HTTP 服务。
		var idxMin = uri.indexOf("/min/?");
		if(idxMin >= 0){
		idxMin = uri.indexOf("?", idxMin);
		}
		if(idxMin < 0){idxMin = len;}

		var idxHash = uri.indexOf("#");
		if(idxHash < 0){idxHash = len;}

		var idxQ = uri.indexOf("??");
		idxQ = uri.indexOf("?", idxQ < 0 ? 0 : idxQ+2);
		if(idxQ < 0){idxQ = len;}

		var idx = Math.min(idxSessionID, idxMin, idxHash, idxQ);

		return idx < 0 ? uri : uri.substr(0, idx);
	}

	// 必要的字符串转义，保证发送的数据是安全的。
	// @param {String} str.
	// @return {String}
	function escapeString(str){
		return String(str).replace(/(?:\r\n|\r|\n)/g,"<CR>");
	}


	function has(obj, key){
		return Object.prototype.hasOwnProperty.call(obj, key);
	}

	/*function warn(info){
		win.console && console.warn && console.warn(info);
	}*/

	// /UTILS -------------------------------------------------------

	var DEFAULT_DATA = {};


	// 创建 HTTP GET 请求发送数据。
	// @param {String} url, 日志服务器 URL 地址。
	// @param {Object} data, 附加的监控数据。
	// @param {Function} callback
	/*function send(host, data, callback){
		if(!callback){callback = function(){};}
		if(!host){
			//warn('Sai: required logger server.'+ host); 
			return callback();
		}
		if(!data){return callback();}

		var d = param(data);
		var url = host + (host.indexOf("?") < 0 ? "?" : "&") + d;
		// 忽略超长 url 请求，避免资源异常。
		if(url.length > URLLength){return callback();}

		// @see http://www.javascriptkit.com/jsref/image.shtml
		var img = new Image(1,1);
		img.onload = img.onerror = img.onabort = function(){
			callback();
			img.onload = img.onerror = img.onabort = null;
			img = null;
		};

		img.src = url;
	}*/

	/**
	 * 基于GA的发布
	 */
	function send(err,callback){
		var exDescription = '#T=' + err.type + '#M=' + err.msg + '#F=' + err.file + '#L=' + err.line + '#C=' + err.col + '#LOST=' + err.lost + '#S=' + err.stack;
	  	var ga = window.ga;
	  	var exFatal = false;


	  	if(err.profile == 'jserror'){
	  		exFatal = true;
	  	}

	  	if(ga){
	  		ga('send', 'exception', {
				'exDescription': exDescription,
				'exFatal': exFatal
			});
	  	}
	  	
	  	callback();
	}

	var sending = false;
	/**
	 * 分时发送队列中的数据，避免 IE(6) 的连接请求数限制。
	 */
	function timedSend(){
		if(sending){return;}

		var e = M._DATAS.shift();
		if(!e){return;}
		sending = true;

		// 理论上应该在收集异常消息时修正 file，避免连接带有参数。
		// 但是收集部分在 seer 中，不适合放置大量的脚本。
		if(e.profile === "jserror"){
			e.file = path(e.file);
		}

		var data = merge(DEFAULT_DATA, e);
		data.rnd = rand(); // 避免缓存。

		// 触发事件返回 false 时，取消后续执行。
		// 要求特定 profile 的事件，和全局事件都被触发。
		/*var eventResult = _evt.emit(e.profile, data);
		eventResult = _evt.emit("*", data) && eventResult;
		if(!eventResult){
			sending = false;
			return timedSend();
		}*/

		send(data, function(){
			sending = false;
			timedSend();
		});


	}

	// timedSend 准备好后可以替换 push 方法，自动分时发送。
	var _push = M._DATAS.push;
	M._DATAS.push = function(){
		_push.apply(M._DATAS, arguments);
		timedSend();
	};

	// 主动发送已捕获的异常。
	timedSend();

	win.Sai = M;
})(window);


//监控-DNS劫持恶意行为
//document.write("<script language='javascript' src='http://www.res.meizu.com/zh_cn/js/common.js?aaa=aa'>");
(function(doc,win){
	//通过document.write、document.writeln的方式注入广告的挟持上报
	var _write = doc.write = document.writeln,
	//白名单列表
	_white_list = [
		'yy.com',
		'huya.com',
		'duowan.com',
		'baidu.com',
		'google-analytics.com',
		'hiido.com',
		'gov.cn',
		'udb.duowan.com',
		'dwstatic.com'
	],
	// 发送统计劫持情况
	send = function(reason){
		if(win.ga){
			/*category（必需）：类别 DNSwrite
			action（必需）：和用户的行为对应，例如“下载”
			label：标签，其他有关信息
			value：提供数值型数据
			non-interaction：布尔值。如果设定为 true，表明这个事件不会参与跳出率的计算*/
	    	ga('send', 'event', 'DNSwrite', reason, {'nonInteraction': 1});
		}
	},
	_RE_SCRIPTS = /<script.*?src\=["']?([^\s>]+)/ig,
	_RE_DOMAIN = /(.+?)\.([^\/]+).+/;
	_RE_SRC = /src=['"](.*)['"]/;

	doc.write = doc.writeln = function(str){
	    try {
	        var s, len, url, unkowns = [];
	        if(s = str.match(_RE_SCRIPTS)){
	        	for(var i=0,len =s.length; i<len; i++){
	        		url = _RE_DOMAIN.exec(s[i]) || [];
	        		if (_white_list.indexOf(url[2])<0) {			        			
		                unkowns.push(s[i].match(_RE_SRC) && s[i].match(_RE_SRC)[1] || url[2]);
		            }
	        	}	
	        }
	        if (unkowns.length > 0) {
	            send(unkowns.join("#URL="));
	        }			        
	        try {
	        	_write.call(this, str);
	        } catch (ex) {
	        	_write(str);
	        }
	    } catch (ex) {
	    	if(win.Sai){
	    		Sai.error(new Error("document-write捉取异常"));
	    	}			    	
	    }
	};

	//监听页面上的alert
	var _alert = alert;
	win.alert = function(s,flag) {
		if(win.ga && flag){
			/*category（必需）：类别 DNSwrite
			action（必需）：和用户的行为对应，例如“下载”
			label：标签，其他有关信息
			value：提供数值型数据
			non-interaction：布尔值。如果设定为 true，表明这个事件不会参与跳出率的计算*/
	    	ga('send', 'event', 'alert', s, {'nonInteraction': 1});
		}
		_alert(s);
	}

	//监听页面上的eval、window.execScript
	var _eval = eval;
	eval = win.execScript = function(s,flag) {
		if(win.ga && flag){
			/*category（必需）：类别 DNSwrite
			action（必需）：和用户的行为对应，例如“下载”
			label：标签，其他有关信息
			value：提供数值型数据
			non-interaction：布尔值。如果设定为 true，表明这个事件不会参与跳出率的计算*/
	    	ga('send', 'event', 'eval', s, {'nonInteraction': 1});
		}
		_eval(s);
	}

})(document,window);

//XSS内联事件的检查
//http://ziggy.sinaapp.com/?p=60
//http://fex.baidu.com/blog/2014/06/xss-frontend-firewall-1/
(function(win){
	var mCheckMap = {};
    var mCheckID = 0;
    var STD_DOM = !!window.addEventListener;
    if(!STD_DOM){
    	return false;
    }

    function send(reason){
    	if(win.ga){
			/*category（必需）：类别
			action（必需）：和用户的行为对应，例如“下载”
			label：标签，其他有关信息
			value：提供数值型数据
			non-interaction：布尔值。如果设定为 true，表明这个事件不会参与跳出率的计算*/
	    	ga('send', 'event', 'XSSinlne', reason, {'nonInteraction': 1});
		}
    }


    function chkxss(code){
		// URL解码
		try{
			decodecode = decodeURIComponent(code);
		}catch(e){
			decodecode = code;
		}
		var xsses = ["fromCharCode","join","concat","slice","substr",
	                 "match","split","escape","encodeURI","replace",
	                 "\\","eval","setTimeout","setInterval","getScript",
	                 "constructor","erHTML","Attribute","unction","execScript",
	                 "with","setImmediate","createElement","write","name",
	                 "referer","cookie","location","click","document"];
		for(i=0;i<xsses.length;i++){
			// indexOf方法查找过滤表中的关键字，如果没有查到返回-1，否则视为xss攻击行为
			// 注意indexOf方法严格区分大小写
			if(decodecode.indexOf(xsses[i])>-1){
				return true;
			}
		}
		// 正则表达式“(&&)|;|,|\[”匹配成功 并且 含有“+”，则视为xss攻击行为
		if(/(&&)|;|,|\[/.test(decodecode)&&decodecode.indexOf("+")>-1){
			return true;
		}
		// (含有“URL”或者含有“hash”) 并且 location.href中含有"#"，则视为xss攻击行为
		if((decodecode.indexOf("URL")>-1||decodecode.indexOf("hash"))>-1&&location.href.indexOf("#")>-1){
			return true;
		}
		// 长度大于150视为xss攻击行为
		if(code.length>150){
			return true;
		}
		// 含有“open” 或者 增则表达式“\Wsrc\W”匹配成功，则视为xss攻击行为
		if(decodecode.indexOf('open')>-1||/\Wsrc\W/.test(decodecode)){
			//添加多一层
			if(decodecode.indexOf('dwstatic.com') == -1 && decodecode.indexOf('window.Sai') == -1){
				return true;
			}
		}
		return false;
	}


    function hookEvent(eventName, eventID) {
        var isClick = (eventName == 'onclick');

        function scanElement(el) {
            //
            // 跳过已扫描的事件
            //
            var flag = el['_k'];
            if (!flag) {
                flag = el['_k'] = ++mCheckID;
            }

            var hash = (flag << 8) | eventID;
            if (hash in mCheckMap) {
                return;
            }
            mCheckMap[hash] = true;

            // 非元素节点
            if (el.nodeType != Node.ELEMENT_NODE) {
                return;
            }

            // 扫描内联代码
            var code;
            if (el[eventName]) {
                code = el.getAttribute(eventName);
                if (code && chkxss(code)) {
                    el[eventName] = null;
                    send(code);
                }
            }

            // 扫描 <a href="javascript:"> 的脚本
            if (isClick && el.tagName == 'A' && el.protocol == 'javascript:') {
                var code = el.href.substr(11);
                if (code && chkxss(code)) {
                    el.href = 'javascript:void(0)';
                    send(code);
                }
            }

            // 扫描上级元素
            scanElement(el.parentNode);
        }

        document.addEventListener(eventName.substr(2), function(e) {
            scanElement(e.target);
        }, true);
    }

    var i = 0;
    // 遍历所有document的所有元素，对内联事件进行过滤
	// 浏览器所有内联事件都对应着 document.onxxx 的属性
    for (var k in document) {
    	// 正则匹配所有on开头的元素
        if (/^on./.test(k)) {
        	// 前端主动过滤
            hookEvent(k, i++);
        }
    }
})(window);

//MutationObserver的检测，只做检测
(function(win){
	var MutationObserver = win.MutationObserver || win.WebKitMutationObserver || win.MozMutationObserver; 
	var isSupportMutationObserver = !!MutationObserver; 
	var _RE_DOMAIN = /(.+?)\.([^\/]+).+/;
	//白名单
	var _white_list = [
		'yy.com',
		'huya.com',
		'duowan.com',
		'baidu.com',
		'google-analytics.com',
		'hiido.com',
		'gov.cn',
		'udb.duowan.com',
		'dwstatic.com'
	]
	if(!isSupportMutationObserver){ return; } 
	function send(reason){
    	if(win.ga){
			/*category（必需）：类别
			action（必需）：和用户的行为对应，例如“下载”
			label：标签，其他有关信息
			value：提供数值型数据
			non-interaction：布尔值。如果设定为 true，表明这个事件不会参与跳出率的计算*/
	    	ga('send', 'event', 'MutationObserver', reason, {'nonInteraction': 1});
		}
    }
	var observeDuration = 100000;//监控10分钟 
	var observeOptions = {
		//子节点的变动
		'childList': true,
		//所有后代节点的变动 
		'subtree': true 
	}; 
	var detector = function(records){ 
		records.map(function(record) { 
			if(record.type != 'childList'){ return; } 
			if(record.addedNodes.length == 0){ return; } 
			var addedNode = record.addedNodes[0]; 
			if(addedNode && addedNode.nodeName && addedNode.nodeName.toLowerCase()=="script" && addedNode.src){
				var urlSrc = addedNode.src;

				if(_white_list.indexOf(urlSrc.match(_RE_DOMAIN)[2])<0){
					send(urlSrc);
				}
			} 
		}); 
	}; 

	var observer = new MutationObserver(detector); 
	observer.observe(document.documentElement , observeOptions); 

	setTimeout(function(){ 
		try{ 
			//停止观察 
			observer.disconnect(); 
			//清除变动记录 
			observer.takeRecords(); 
		}catch(e){

		} 	
	},observeDuration);
})(window);