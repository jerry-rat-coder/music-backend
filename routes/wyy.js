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
router.get('/top/artists', (req, res) => {
    request({
        url: `http://cloud-music.pl-fe.cn/top/artists?limit=${req.query.limit}`
    }).pipe(res);
})
router.get('/artist/songs', (req, res) => {
        request({
            url: `http://cloud-music.pl-fe.cn/artist/songs?id=${req.query.id}&limit=${req.query.limit}`
        }).pipe(res);
    })
    // `/song/detail?ids=${id}`
router.get('/song/detail', (req, res) => {
        request({
            url: `http://cloud-music.pl-fe.cn/song/detail?ids=${req.query.id}`
        }).pipe(res);
    })
    // `/song/url?id=${id}&br=320000`
router.get('/song/url', (req, res) => {
        request({
            url: `https://service-f23fl8wz-1318570863.bj.apigw.tencentcs.com/release/song/url?id=${req.query.id}&br=320000`
        }).pipe(res);
    })
    // `/lyric?id=${id}`
router.get('/lyric', (req, res) => {
    request({
        url: `http://cloud-music.pl-fe.cn/lyric?id=${req.query.id}`
    }).pipe(res);
})
module.exports = router