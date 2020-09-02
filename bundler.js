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

const graghInfo = makeDependenciesGraph('./src/index.js');
console.log('--->', graghInfo)

