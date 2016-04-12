'use strict';

const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');

const getPath = _path => path.resolve(path.join(__dirname, _path));

const config = {
    devtool: '#source-map',
    entry: [
        getPath('/src/index.js'),
    ],
    output: {
        path: getPath('/dist/'),
        filename: '[name].bundle.js',
        publicPath: '/static/',
    },
    plugins: [
        new webpack.EnvironmentPlugin([
            'BUILD_ENV',
        ]),
    ],
    postcss: () => [autoprefixer],
    module: {
        loaders: [
            { test: /\.jsx?$/, loader: 'babel', exclude: /(node_modules|vendor)/ },
            { test: /\.scss$/, loader: 'style!css!postcss!sass', exclude: /(node_modules|vendor)/ }
        ],
    },
    resolve: {
        extensions: [
            '',
            '.js',
            '.jsx',
            '.json',
            '.scss',
            '.css',
        ],
        root: [
            getPath('./src/'),
        ],
    },
};

if (process.env.NODE_ENV === 'development') {
    config.entry.unshift('webpack-hot-middleware/client?http://localhost:3000');
    config.plugins.unshift(new webpack.HotModuleReplacementPlugin());
    config.plugins.unshift(new webpack.NoErrorsPlugin());
    config.plugins.push(new webpack.DefinePlugin({
        'process.env': {
            NODE_ENV: '"development"',
        },
    }));
}

if (process.env.NODE_ENV === 'production') {
    config.plugins.push(new webpack.optimize.OccurenceOrderPlugin());
    config.plugins.push(new webpack.DefinePlugin({
        'process.env': {
            NODE_ENV: '"production"',
        },
    }));
}

module.exports = config;
