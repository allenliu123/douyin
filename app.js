const fs = require('fs');
const moment = require('moment');
const request = require('request');
const rp = require('request-promise');
const generateSignature = require('./utils/generateSignature')

/**
 * 通过视频 id 获得视频无水印真实链接和视频发布日期
 * @param {string} id 视频 id
 * @returns 视频无水印真实链接
 */
function getTrueVideoUrl(id) {
  return new Promise((resolve, reject) => {
    rp({
      method: 'get',
      uri: 'https://www.douyin.com/web/api/v2/aweme/iteminfo/?item_ids=' + id,
      json: true
    }).then(res => {
      let url = res.item_list[0].video.play_addr.url_list[0]
      const noWaterMarkUrl = url.replace('playwm', 'play')
      resolve({
        url: noWaterMarkUrl,
        create_time: res.item_list[0].create_time
      })
    }).catch(reject)
  })
}

/**
 * 下载视频到本地 /data/${nickname} 文件夹下
 * @param {string} url 视频 url
 */
function download(url, nickname, filename='filename') {
  return new Promise((resolve, reject) => {
    let stream = fs.createWriteStream(`./data/${nickname}/${filename}.mp4`);
    request({
      url: url,
      followRedirect: true,
      headers: {
        'User-Agent': 'Request-Promise'
      }
    }).pipe(stream).on('close', () => {
      console.log(filename + ' download success');
      resolve('')
    }).on('error', (err) => {
      console.log(err)
      reject(err)
    });
  })
}

/**
 * 获取用户信息
 * @param {string} sec_uid 用户 id
 * @returns 用户信息
 */
function getUserInfo(sec_uid) {
  return new Promise((resolve, reject) => {
    rp({
      method: 'get',
      uri: 'https://www.iesdouyin.com/web/api/v2/user/info/?sec_uid=' + sec_uid,
      json: true
    }).then(info => {
      resolve(info)
    }).catch(reject)
  })
}

/**
 * 
 * @param {string} sec_uid  用户 id
 * @param {number | string} count  用户视频个数
 * @param {number | string} max_cursor 时间最大值 1656743890000 => 2022-07-02 14:38:10
 * @returns 
 */
function getVideoList(sec_uid, count, max_cursor) {
  return new Promise((resolve, reject) => {
    const _signature = generateSignature(sec_uid)
    rp({
      method: 'get',
      uri: 'https://www.iesdouyin.com/web/api/v2/aweme/post/',
      qs: {
        sec_uid,
        count,
        max_cursor,
        _signature
      },
      json: true
    }).then(res => {
      resolve({
        has_more: res.has_more,
        max_cursor: res.max_cursor,
        aweme_id_list: res.aweme_list.map(item => ({ id: item.aweme_id, desc: item.desc }))
      })
    }).catch(reject)
  })
}

/**
 * 循环获取 id 数据
 * @param {string} sec_uid 
 * @param {number | string} count 
 * @param {number | string} maxCursor 
 * @returns 
 */
async function getVideoListRec(sec_uid, count, maxCursor) {
  if (!sec_uid || !count || !maxCursor) {
    console.log('参数错误')
    return []
  }
  let hasMore = true
  let max_cursor = maxCursor
  let awemeIdList = []
  while(hasMore) {
    const res = await getVideoList(sec_uid, count, max_cursor)
    hasMore = res.has_more
    max_cursor = res.max_cursor
    awemeIdList = awemeIdList.concat(res.aweme_id_list)
  }
  return awemeIdList
}

async function main() {
  let argv = process.argv.splice(2) // 命令行参数
  let sec_uid = argv && argv.length > 0 ? argv[0] : ''
  sec_uid = sec_uid.replace('https://www.douyin.com/user/', '')
  if (!sec_uid) {
    console.log('参数错误')
    return
  }
  const info = await getUserInfo(sec_uid)
  if (!info || !info.user_info) {
    console.log('获取用户信息失败')
    return
  }
  const nickname = info.user_info.nickname.replace(/\s|\r|\r\n|\n/g, '_')
  console.log('用户：' + nickname)
  const videoList = await getVideoListRec(sec_uid, info.user_info.aweme_count, info.extra.now)
  if (!videoList || videoList.length <= 0) {
    return
  }
  console.log(`共获取到${videoList.length}个视频`)
  // 串行下载
  for(let index = 0; index < videoList.length; index++) {
    try {
      const {url, create_time} = await getTrueVideoUrl(videoList[index].id)
      const createDataStr = moment.unix(create_time).format('YYYY-MM-DD_HH_mm_ss')
      if (!fs.existsSync('./data/' + nickname)) {
        fs.mkdirSync('./data/' + nickname)
      }
      await download(url, nickname, createDataStr + videoList[index].desc.replace(/\s|\r|\r\n|\n/g, '_'))
    } catch(err) {
      console.log(err)
    }
  }
  // 并行下载，速度快，但数量多了会报错
  // videoList.forEach(async (item, index) => {
  //   if (!(index > 90 && index <= 120)) {
  //     return
  //   }
  //   try {
  //     const url = await getTrueVideoUrl(item.id)
  //     await download(url, String(index))
  //     // await download(url, item.desc.replace(/\s|\r|\r\n|\n/g, '-'))
  //   } catch(err) {
  //     console.log(err)
  //   }
  // })
}

main()