var express = require('express');
const request = require('request')
const app = express();
var router = express.Router();
const axios = require('axios')
const { createProxyMiddleware } = require('http-proxy-middleware');
const url = require('url')
    // http://cloud-music.pl-fe.cn

router.get('/banner', (req, res) => {
        request({
            url: `http://cloud-music.pl-fe.cn/banner`
        }).pipe(res);
    })
    // http://cloud-music.pl-fe.cn/personalized
router.get('/personalized', (req, res) => {
    // console.log(requset.query.limit)
    request({
        url: `http://cloud-music.pl-fe.cn/personalized?limit=${req.query.limit}`
    }).pipe(res);
})
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
        return path + `?id=${id}&limit=100`
    }
}))
module.exports = router