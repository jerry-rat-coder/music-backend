"use strict";

var createError = require('http-errors');

var express = require('express');

var path = require('path');

var cookieParser = require('cookie-parser');

var logger = require('morgan');

var indexRouter = require('./routes/index');

var usersRouter = require('./routes/users');

var toolRouter = require('./routes/router');

var axios = require('axios');

var pinyin = require('pinyin');

var Base64 = require('js-base64').Base64; // 获取签名方法


var getSecuritySign = require('./routes/sign');

var ERR_OK = 0;
var token = 5381;
var fallbackPicUrl = 'https://y.gtimg.cn/mediastyle/music_v11/extra/default_300x300.jpg?max_age=31536000'; // 公共参数

var commonParams = {
  g_tk: token,
  loginUin: 0,
  hostUin: 0,
  inCharset: 'utf8',
  outCharset: 'utf-8',
  notice: 0,
  needNewCode: 0,
  format: 'json',
  platform: 'yqq.json'
}; // 获取一个随机数值

function getRandomVal() {
  var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  return prefix + (Math.random() + '').replace('0.', '');
} // 获取一个随机 uid


function getUid() {
  var t = new Date().getUTCMilliseconds();
  return '' + Math.round(2147483647 * Math.random()) * t % 1e10;
} // 对 axios get 请求的封装
// 修改请求的 headers 值，合并公共请求参数


function get(url, params) {
  return axios.get(url, {
    headers: {
      referer: 'https://y.qq.com/',
      origin: 'https://y.qq.com/'
    },
    params: Object.assign({}, commonParams, params)
  });
} // 对 axios post 请求的封装
// 修改请求的 headers 值


function post(url, params) {
  return axios.post(url, params, {
    headers: {
      referer: 'https://y.qq.com/',
      origin: 'https://y.qq.com/',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })["catch"](function (error) {
    console.error('Error in post function:', error);
  });
} // 处理歌曲列表


function handleSongList(list) {
  var songList = [];
  list.forEach(function (item) {
    var info = item.songInfo || item;

    if (info.pay.pay_play !== 0 || !info.interval) {
      // 过滤付费歌曲和获取不到时长的歌曲
      return;
    } // 构造歌曲的数据结构


    var song = {
      id: info.id,
      mid: info.mid,
      name: info.name,
      singer: mergeSinger(info.singer),
      url: '',
      // 在另一个接口获取
      duration: info.interval,
      pic: info.album.mid ? "https://y.gtimg.cn/music/photo_new/T002R800x800M000".concat(info.album.mid, ".jpg?max_age=2592000") : fallbackPicUrl,
      album: info.album.name
    };
    songList.push(song);
  });
  return songList;
}

var app = express();

var cors = require('cors');

app.use(cors()); // view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express["static"](path.join(__dirname, 'public')));
app.use('/users', usersRouter);
app.use('/api', toolRouter); // catch 404 and forward to error handler

app.use(function (req, res, next) {
  next(createError(404));
}); // error handler

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {}; // render the error page

  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;