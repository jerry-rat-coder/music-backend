"use strict";

var express = require('express');

var app = express();
var router = express.Router();

var axios = require('axios');

var pinyin = require('pinyin');

var Base64 = require('js-base64').Base64;

var qs = require('qs'); // 获取签名方法


var getSecuritySign = require('./sign');

var ERR_OK = 0;
var token = 5381; // 歌曲图片加载失败时使用的默认图片

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
  // const data = qs.stringify(params);
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
} // 合并多个歌手的姓名


function mergeSinger(singer) {
  var ret = [];

  if (!singer) {
    return '';
  }

  singer.forEach(function (s) {
    ret.push(s.name);
  });
  return ret.join('/');
}

router.get('/getRecommend', function (req, res) {
  // 第三方服务接口 url
  // console.log('node后端启动', res);
  var url = 'https://u.y.qq.com/cgi-bin/musics.fcg'; // 构造请求 data 参数

  var data = JSON.stringify({
    comm: {
      ct: 24
    },
    recomPlaylist: {
      method: 'get_hot_recommend',
      param: {
        async: 1,
        cmd: 2
      },
      module: 'playlist.HotRecommendServer'
    },
    focus: {
      module: 'music.musicHall.MusicHallPlatform',
      method: 'GetFocus',
      param: {}
    }
  }); // 随机数值

  var randomVal = getRandomVal('recom'); // 计算签名值

  var sign = getSecuritySign(data); // 发送 get 请求

  get(url, {
    sign: sign,
    '-': randomVal,
    data: data
  }).then(function (response) {
    var data = response.data;

    if (data.code === ERR_OK) {
      // 处理轮播图数据
      var focusList = data.focus.data.shelf.v_niche[0].v_card;
      var sliders = [];
      var jumpPrefixMap = {
        10002: 'https://y.qq.com/n/yqq/album/',
        10014: 'https://y.qq.com/n/yqq/playlist/',
        10012: 'https://y.qq.com/n/yqq/mv/v/'
      }; // 最多获取 10 条数据

      var len = Math.min(focusList.length, 10);

      for (var i = 0; i < len; i++) {
        var item = focusList[i];
        var sliderItem = {}; // 单个轮播图数据包括 id、pic、link 等字段

        sliderItem.id = item.id;
        sliderItem.pic = item.cover;

        if (jumpPrefixMap[item.jumptype]) {
          sliderItem.link = jumpPrefixMap[item.jumptype] + (item.subid || item.id) + '.html';
        } else if (item.jumptype === 3001) {
          sliderItem.link = item.id;
        }

        sliders.push(sliderItem);
      } // 处理推荐歌单数据


      var albumList = data.recomPlaylist.data.v_hot;
      var albums = [];

      for (var _i = 0; _i < albumList.length; _i++) {
        var _item = albumList[_i];
        var albumItem = {}; // 推荐歌单数据包括 id、username、title、pic 等字段

        albumItem.id = _item.content_id;
        albumItem.username = _item.username;
        albumItem.title = _item.title;
        albumItem.pic = _item.cover;
        albums.push(albumItem);
      } // 往前端发送一个标准格式的响应数据，包括成功错误码和数据


      res.json({
        code: ERR_OK,
        result: {
          sliders: sliders,
          albums: albums
        }
      });
    } else {
      res.json(data);
    }
  });
}); // 注册歌手列表接口路由

router.get('/getSingerList', function (req, res) {
  // 做一层数据映射，构造单个 singer 数据结构
  function map(singerList) {
    return singerList.map(function (item) {
      return {
        id: item.singer_id,
        mid: item.singer_mid,
        name: item.singer_name,
        pic: item.singer_pic.replace(/\.webp$/, '.jpg').replace('150x150', '800x800')
      };
    });
  }

  var url = 'https://u.y.qq.com/cgi-bin/musics.fcg';
  var HOT_NAME = '热';
  var data = JSON.stringify({
    comm: {
      ct: 24,
      cv: 0
    },
    singerList: {
      module: 'Music.SingerListServer',
      method: 'get_singer_list',
      param: {
        area: -100,
        sex: -100,
        genre: -100,
        index: -100,
        sin: 0,
        cur_page: 1
      }
    }
  });
  var randomKey = getRandomVal('getUCGI');
  var sign = getSecuritySign(data);
  get(url, {
    sign: sign,
    '-': randomKey,
    data: data
  }).then(function (response) {
    var data = response.data;

    if (data.code === ERR_OK) {
      // 处理歌手列表数据
      var singerList = data.singerList.data.singerlist; // 构造歌手 Map 数据结构

      var singerMap = {
        hot: {
          title: HOT_NAME,
          list: map(singerList.slice(0, 10))
        }
      };
      singerList.forEach(function (item) {
        // 把歌手名转成拼音
        var p = pinyin(item.singer_name);

        if (!p || !p.length) {
          return;
        } // 获取歌手名拼音的首字母


        var key = p[0][0].slice(0, 1).toUpperCase();

        if (key) {
          if (!singerMap[key]) {
            singerMap[key] = {
              title: key,
              list: []
            };
          } // 每个字母下面会有多名歌手


          singerMap[key].list.push(map([item])[0]);
        }
      }); // 热门歌手

      var hot = []; // 字母歌手

      var letter = []; // 遍历处理 singerMap，让结果有序

      for (var key in singerMap) {
        var item = singerMap[key];

        if (item.title.match(/[a-zA-Z]/)) {
          letter.push(item);
        } else if (item.title === HOT_NAME) {
          hot.push(item);
        }
      } // 按字母顺序排序


      letter.sort(function (a, b) {
        return a.title.charCodeAt(0) - b.title.charCodeAt(0);
      });
      res.json({
        code: ERR_OK,
        result: {
          singers: hot.concat(letter)
        }
      });
    } else {
      res.json(data);
    }
  });
});
router.get('/getSingerDetail', function (req, res) {
  // console.log(req.query.mid)
  var url = 'https://u.y.qq.com/cgi-bin/musics.fcg';
  var data = JSON.stringify({
    comm: {
      ct: 24,
      cv: 0
    },
    singerSongList: {
      method: 'GetSingerSongList',
      param: {
        order: 1,
        singerMid: req.query.mid,
        begin: 0,
        num: 100
      },
      module: 'musichall.song_list_server'
    }
  });
  var randomKey = getRandomVal('getSingerSong');
  var sign = getSecuritySign(data);
  get(url, {
    sign: sign,
    '-': randomKey,
    data: data
  }).then(function (response) {
    // console.log('response', response)
    var data = response.data; // console.log(data.singerSongList.data.songList)

    if (data.code === ERR_OK) {
      var list = data.singerSongList.data.songList; // 歌单详情、榜单详情接口都有类似处理逻辑，固封装成函数

      var _songList = handleSongList(list); // console.log('list', songList)


      res.json({
        code: ERR_OK,
        result: {
          songs: _songList
        }
      });
    } else {
      res.send(songList);
    }
  });
}); // // 注册歌曲 url 获取接口路由

router.get('/getSongsUrl', function (req, res) {
  var mid = req.query.mid;
  var midGroup = []; // 第三方接口只支持最多处理 100 条数据，所以如果超过 100 条数据，我们要把数据按每组 100 条切割，发送多个请求

  if (mid.length > 100) {
    var groupLen = Math.ceil(mid.length / 100);

    for (var i = 0; i < groupLen; i++) {
      midGroup.push(mid.slice(i * 100, 100 * (i + 1)));
    }
  } else {
    midGroup = [mid];
  } // console.log('mid', mid)
  // 以歌曲的 mid 为 key，存储歌曲 URL


  var urlMap = {}; // 处理返回的 mid

  function process(mid) {
    var data = {
      req_0: {
        module: 'vkey.GetVkeyServer',
        method: 'CgiGetVkey',
        param: {
          guid: getUid(),
          songmid: mid,
          songtype: new Array(mid.length).fill(0),
          uin: '0',
          loginflag: 0,
          platform: '20',
          h5to: 'speed'
        }
      },
      comm: {
        g_tk: token,
        uin: '0',
        format: 'json',
        platform: 'h5'
      }
    };
    var sign = getSecuritySign(JSON.stringify(data));
    var ran = getRandomVal();
    var url = "https://u.y.qq.com/cgi-bin/musics.fcg?_=".concat(getRandomVal(), "&sign=").concat(sign);
    console.log('uid', data.req_0.param.guid); // 发送 post 请求

    return post(url, data).then(function (response) {
      console.log(response);
      var data = response.data; // console.log(data)

      if (data.code === ERR_OK) {
        // console.log(data)
        var midInfo = data.req_0.data.midurlinfo;
        console.log('恭喜', data.req_0.data.midurlinfo);
        var sip = data.req_0.data.sip;
        var domain = sip[sip.length - 1];
        midInfo.forEach(function (info) {
          // 获取歌曲的真实播放 URL
          urlMap[info.songmid] = domain + info.purl;
        });
      }
    });
  } // 构造多个 Promise 请求


  var requests = midGroup.map(function (mid) {
    return process(mid);
  }); // 并行发送多个请求

  return Promise.all(requests).then(function () {
    // 所有请求响应完毕，urlMap 也就构造完毕了
    res.json({
      code: ERR_OK,
      result: {
        map: urlMap
      }
    });
  });
}); // // 注册歌词接口

router.get('/getLyric', function (req, res) {
  var url = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg';
  get(url, {
    '-': 'MusicJsonCallback_lrc',
    pcachetime: +new Date(),
    songmid: req.query.mid,
    g_tk_new_20200303: token
  }).then(function (response) {
    var data = response.data;

    if (data.code === ERR_OK) {
      res.json({
        code: ERR_OK,
        result: {
          lyric: Base64.decode(data.lyric)
        }
      });
    } else {
      res.json(data);
    }
  });
});
router.get('/getAlbum', function (req, res) {
  var data = {
    req_0: {
      module: 'srf_diss_info.DissInfoServer',
      method: 'CgiGetDiss',
      param: {
        disstid: Number(req.query.id),
        onlysonglist: 1,
        song_begin: 0,
        song_num: 100
      }
    },
    comm: {
      g_tk: token,
      uin: '0',
      format: 'json',
      platform: 'h5'
    }
  };
  var sign = getSecuritySign(JSON.stringify(data));
  var url = "https://u.y.qq.com/cgi-bin/musics.fcg?_=".concat(getRandomVal(), "&sign=").concat(sign);
  post(url, data).then(function (response) {
    var data = response.data;

    if (data.code === ERR_OK) {
      var list = data.req_0.data.songlist;

      var _songList2 = handleSongList(list);

      res.json({
        code: ERR_OK,
        result: {
          songs: _songList2
        }
      });
    } else {
      res.json(data);
    }
  });
}); // // 注册排行榜接口

router.get('/getTopList', function (req, res) {
  var url = 'https://u.y.qq.com/cgi-bin/musics.fcg';
  var data = JSON.stringify({
    comm: {
      ct: 24
    },
    toplist: {
      module: 'musicToplist.ToplistInfoServer',
      method: 'GetAll',
      param: {}
    }
  });
  var randomKey = getRandomVal('recom');
  var sign = getSecuritySign(data);
  get(url, {
    sign: sign,
    '-': randomKey,
    data: data
  }).then(function (response) {
    var data = response.data;

    if (data.code === ERR_OK) {
      var topList = [];
      var group = data.toplist.data.group;
      group.forEach(function (item) {
        item.toplist.forEach(function (listItem) {
          topList.push({
            id: listItem.topId,
            pic: listItem.frontPicUrl,
            name: listItem.title,
            period: listItem.period,
            songList: listItem.song.map(function (songItem) {
              return {
                id: songItem.songId,
                singerName: songItem.singerName,
                songName: songItem.title
              };
            })
          });
        });
      });
      res.json({
        code: ERR_OK,
        result: {
          topList: topList
        }
      });
    } else {
      res.json(data);
    }
  });
}); // // 注册排行榜详情接口

router.get('/getTopDetail', function (req, res) {
  var url = 'https://u.y.qq.com/cgi-bin/musics.fcg';
  var _req$query = req.query,
      id = _req$query.id,
      period = _req$query.period;
  var data = JSON.stringify({
    detail: {
      module: 'musicToplist.ToplistInfoServer',
      method: 'GetDetail',
      param: {
        topId: Number(id),
        offset: 0,
        num: 100,
        period: period
      }
    },
    comm: {
      ct: 24,
      cv: 0
    }
  });
  var randomKey = getRandomVal('getUCGI');
  var sign = getSecuritySign(data);
  get(url, {
    sign: sign,
    '-': randomKey,
    data: data
  }).then(function (response) {
    var data = response.data;

    if (data.code === ERR_OK) {
      var list = data.detail.data.songInfoList;

      var _songList3 = handleSongList(list);

      res.json({
        code: ERR_OK,
        result: {
          songs: _songList3
        }
      });
    } else {
      res.json(data);
    }
  });
}); // // 注册热门搜索接口

router.get('/getHotKeys', function (req, res) {
  var url = 'https://c.y.qq.com/splcloud/fcgi-bin/gethotkey.fcg';
  get(url, {
    g_tk_new_20200303: token
  }).then(function (response) {
    var data = response.data;

    if (data.code === ERR_OK) {
      res.json({
        code: ERR_OK,
        result: {
          hotKeys: data.data.hotkey.map(function (key) {
            return {
              key: key.k,
              id: key.n
            };
          }).slice(0, 10)
        }
      });
    } else {
      res.json(data);
    }
  });
}); // // 注册搜索查询接口

router.get('/search', function (req, res) {
  var url = 'https://c.y.qq.com/soso/fcgi-bin/search_for_qq_cp';
  var _req$query2 = req.query,
      query = _req$query2.query,
      page = _req$query2.page,
      showSinger = _req$query2.showSinger;
  var data = {
    _: getRandomVal(),
    g_tk_new_20200303: token,
    w: query,
    p: page,
    perpage: 20,
    n: 20,
    zhidaqu: 1,
    catZhida: showSinger === 'true' ? 1 : 0,
    t: 0,
    flag: 1,
    ie: 'utf-8',
    sem: 1,
    aggr: 0,
    remoteplace: 'txt.mqq.all',
    uin: '0',
    needNewCode: 1,
    platform: 'h5',
    format: 'json'
  };
  get(url, data).then(function (response) {
    var data = response.data;

    if (data.code === ERR_OK) {
      var _songList4 = [];
      var songData = data.data.song;
      var list = songData.list;
      list.forEach(function (item) {
        var info = item;

        if (info.pay.payplay !== 0 || !info.interval) {
          // 过滤付费歌曲
          return;
        }

        var song = {
          id: info.songid,
          mid: info.songmid,
          name: info.songname,
          singer: mergeSinger(info.singer),
          url: '',
          duration: info.interval,
          pic: info.albummid ? "https://y.gtimg.cn/music/photo_new/T002R800x800M000".concat(info.albummid, ".jpg?max_age=2592000") : fallbackPicUrl,
          album: info.albumname
        };

        _songList4.push(song);
      });
      var singer;
      var zhida = data.data.zhida;

      if (zhida && zhida.type === 2) {
        singer = {
          id: zhida.singerid,
          mid: zhida.singermid,
          name: zhida.singername,
          pic: "https://y.gtimg.cn/music/photo_new/T001R800x800M000".concat(zhida.singermid, ".jpg?max_age=2592000")
        };
      }

      var curnum = songData.curnum,
          curpage = songData.curpage,
          totalnum = songData.totalnum;
      var hasMore = 20 * (curpage - 1) + curnum < totalnum;
      res.json({
        code: ERR_OK,
        result: {
          songs: _songList4,
          singer: singer,
          hasMore: hasMore
        }
      });
    } else {
      res.json(data);
    }
  });
});
module.exports = router;