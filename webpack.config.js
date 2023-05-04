const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: './bin/www', // 入口文件
    target: 'node', // 编译目标为 Node.js 环境
    externals: [nodeExternals()], // 排除 Node.js 的内置模块
    output: {
        path: path.resolve(__dirname, 'dist'), // 输出目录
        filename: 'bundle.js' // 输出文件名
    },
    module: {
        rules: [{
            test: /\.js$/, // 匹配 .js 后缀的文件
            exclude: /node_modules/, // 排除 node_modules 目录
            use: {
                loader: 'babel-loader', // 使用 babel-loader
                options: {
                    presets: ['@babel/preset-env'] // 使用 @babel/preset-env 进行转换
                }
            }
        }]
    }
};