dwfis.define("b", function(require, exports, module){
function b (argument) {
	console.log('b');
}
module.exports= b;
});
;dwfis.define("app/a", function(require, exports, module){
var b = require('b');
b();

function a (argument) {
	console.log('a');
}
module.exports=a;
});