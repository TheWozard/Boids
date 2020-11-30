const path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [new HtmlWebpackPlugin({
        template: "./src/index.template.html"
    })],
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader'],
            },
        ],
    },
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        port: 9000
    }
};