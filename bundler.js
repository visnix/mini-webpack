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

const moduleInfo = moduleAnalyser('./src/index.js');
console.log(moduleInfo);
