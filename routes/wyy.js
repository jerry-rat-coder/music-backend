var express = require('express');
const app = express();
var router = express.Router();
const axios = require('axios')
const { createProxyMiddleware } = require('http-proxy-middleware');
// http://cloud-music.pl-fe.cn

router.get('/banner', createProxyMiddleware({
    target: 'http://cloud-music.pl-fe.cn/banner', // target host
    changeOrigin: true, // needed for virtual hosted sites
    // pathRewrite: {
    //     '^/banner': '/banner', // rewrite path
    // },
}))
router.get('/personalized', createProxyMiddleware({
    target: 'http://cloud-music.pl-fe.cn/personalized', // target host
    changeOrigin: true,
    onProxyReq: function(proxyReq, req, res) {
        proxyReq.setHeader('Content-Type', 'application/json');
    },
    pathRewrite: (path, req) => {
        return path + '?limit=30'
    }
}))
router.get('/top/artists', createProxyMiddleware({
    target: 'http://cloud-music.pl-fe.cn/top/artists', // target host
    changeOrigin: true,
    onProxyReq: function(proxyReq, req, res) {
        proxyReq.setHeader('Content-Type', 'application/json');
    },
    pathRewrite: (path, req) => {
        return path + '?limit=100'
    }
}))
router.get('/artist/songs', createProxyMiddleware({
    target: 'http://cloud-music.pl-fe.cn/artist/songs', // target host
    changeOrigin: true,
    onProxyReq: function(proxyReq, req, res) {
        proxyReq.setHeader('Content-Type', 'application/json');
    },
    pathRewrite: (path, req) => {
        return path + '?id=${id}&limit=100'
    }
}))
module.exports = router