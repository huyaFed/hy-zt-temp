dwfis.define("app/a", function(require, exports, module){
require.async('b',function(b){
	b();
});

function a (argument) {
	console.log('a');
}
module.exports=a;
});