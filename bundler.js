// 慕课网webpack4.0课程的迷你webpack的实现源码，课程地址 https://coding.imooc.com/class/chapter/316.html#Anchor
// 像这种复杂的项目，老师建议我们读3到5遍，然后自己能完整的默写来了，才算可以。哎，我以前做的最少的就是这种事情了，有价值的东西没有反复去看


const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const babel = require('@babel/core');

// 分析入口文件
const moduleAnalyser = (filename) => {
	const content = fs.readFileSync(filename, 'utf-8');
	// 使用babel将源代码解析成抽象语法树
	const ast = parser.parse(content, {
		sourceType: 'module'
	});
	
	const dependencies = {};
	// 自己写遍历很麻烦，可以直接使用babel提供的遍历库
	traverse(ast, {
		ImportDeclaration({ node }) {
			const dirname = path.dirname(filename);
			const newFile = './' + path.join(dirname, node.source.value);
			dependencies[node.source.value] = newFile;
		}
	});
	// transformFromAst把抽象语法树转换成浏览器可以运行的代码
	const { code } = babel.transformFromAst(ast, null, {
		presets: ["@babel/preset-env"]
	});
	return {
		filename,
		dependencies,
		code
	}
}

// 找出入口文件下的依赖文件下的每一个依赖
const makeDependenciesGraph = (entry) => {
	const entryModule = moduleAnalyser(entry);
	const graphArray = [ entryModule ];
	for(let i = 0; i < graphArray.length; i++) {
		const item = graphArray[i];
		const { dependencies } = item;
		if(dependencies) {
			for(let j in dependencies) {
				graphArray.push(
					moduleAnalyser(dependencies[j])
				);
			}
		}
	}
	// 把数组变成一个对象，数据格式的转换为以后的打包提供方便
	const graph = {};
	graphArray.forEach(item => {
		graph[item.filename] = {
			dependencies: item.dependencies,
			code: item.code
		}
	});
	return graph;
}

const generateCode = (entry) => {
	const graph = JSON.stringify(makeDependenciesGraph(entry), null, 2);
	// 写在一个闭包里面，避免污染全局环境
	return `(function(graph){
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
    require('${entry}')
  })(${graph});
  `;
}

const code = generateCode('./src/index.js');
fs.writeFileSync('./dist/index.js', code, { code: 'utf-8'})
console.log('========打包完成========\n')

// 下面这段代码是有问题的，因为没有考虑require代码后里面还有require的情况
// (function(graph){
// 	function require(module){
// 		(function(code){
// 			eval(code)
// 		})(graph[module].code)
// 	}
// 	require(entry)
// })(graph)