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
    target: 'http://cloud-music.pl-fe.cn/personalized?limit=30', // target host
    changeOrigin: true,
}))
module.exports = router