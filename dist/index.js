(function(graph){
    // 构造一个require函数, 因为浏览器不认识require方法，构造require方法的原理就只找到这个代码的在对象中的位置，graph[module].code
    function require(module) {
      function localRequire(relativePath) {
        return require(graph[module].dependencies[relativePath]);
      }
      // 构造一个exports对象, 因为浏览器不认识exports对象
      var exports = {};
      // 让每个模块的代码在闭包里面执行，这样的话不会污染上一个闭包的环境
      // 这里用了递归的方式使用require，js文件最下面109行展示了没有递归，只考虑一层的方法
      (function(require, exports, code){
        // 可以eval执行的时候会把require和exports替换成自定义的require方法和exports对象，比如下面这个用法
        // (function(){
        // 	var haha = 'hahahahaha';
        // 	eval('console.log(haha);')
        // })() 
        // 显示值为：hahahahaha
        eval(code)
      })(localRequire, exports, graph[module].code);
      // 还要把exports导出，这样的话下一个模块在引用这个模块的话，才能拿到它导出的一个结果， localRequire方法的返回值就是这样的一个结果
      return exports;
    };
    require('./src/index.js')
  })({
  "./src/index.js": {
    "dependencies": {
      "./message.js": "./src/message.js"
    },
    "code": "\"use strict\";\n\nvar _message = _interopRequireDefault(require(\"./message.js\"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { \"default\": obj }; }\n\nconsole.log(_message[\"default\"]);"
  },
  "./src/message.js": {
    "dependencies": {
      "./word.js": "./src/word.js"
    },
    "code": "\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports[\"default\"] = void 0;\n\nvar _word = require(\"./word.js\");\n\nvar message = \"say \".concat(_word.word);\nvar _default = message;\nexports[\"default\"] = _default;"
  },
  "./src/word.js": {
    "dependencies": {},
    "code": "\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.word = void 0;\nvar word = 'hello';\nexports.word = word;"
  }
});
  