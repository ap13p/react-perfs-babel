'use strict';

const path = require('path');

const express = require('express');
const webpack = require('webpack');
const config = require('./webpack.config');

const compiler = webpack(config);
const app = express();

const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath,
}));
app.use(webpackHotMiddleware(compiler));

app.use('/static/', express.static(path.resolve(path.join(__dirname, '/dist/'))));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(path.join(__dirname, 'index.html')));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Listening on => http://localhost:${PORT}`);
});
