const fs = require('fs')
const moment = require('moment')
const request = require('request')
const rp = require('request-promise')
const {
  parseShareUrl,
  matchIdFromShareUrl,
  shareUrl
} = require('douyin-tools')
const generateSignature = require('./utils/generateSignature')

// sleep
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

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
        create_time: res.item_list[0].create_time,
        desc: res.item_list[0].desc
      })
    }).catch(reject)
  })
}

/**
 * 下载视频到本地 /data/${nickname} 文件夹下
 * @param {string} url 视频 url
 */
function download(url, nickname, filename='filename') {
  if (!fs.existsSync('./data/' + nickname)) {
    fs.mkdirSync('./data/' + nickname)
  }
  const filePath = `./data/${nickname}/${filename}.mp4`
  // 跳过已经下载过的视频
  if (fs.existsSync(filePath)) {
    console.log(filePath + ' 已存在，跳过！')
    return Promise.resolve()
  }
  return new Promise(async (resolve, reject) => {
    await sleep(1000) // 为避免风控，每下载一个视频等待一秒
    let stream = fs.createWriteStream(filePath)
    request({
      url: url,
      followRedirect: true,
      headers: {
        'User-Agent': 'Request-Promise'
      }
    }).pipe(stream).on('close', () => {
      console.log(filename + ' 下载成功')
      resolve('')
    }).on('error', (err) => {
      console.log(err)
      reject(err)
    })
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

// 下载某个用户所有视频
async function downloadUserAllVideo(sec_uid) {
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
      const filename = videoList[index].desc.replace(/[\/\\\:\*\<\?\>\"\'\|]|\s|\r|\r\n|\n/g, '_')
      await download(url, nickname, filename + createDataStr)
    } catch(err) {
      console.log(err)
    }
  }
}

async function handleShare(params) {
  const shareUrlStr = parseShareUrl(params)
  const trueUrl = await shareUrl(shareUrlStr)
  const videoId = matchIdFromShareUrl(trueUrl)
  const { url, create_time, desc } = await getTrueVideoUrl(videoId)
  const createDataStr = moment.unix(create_time).format('YYYY-MM-DD_HH_mm_ss')
  const filename = desc.replace(/[\/\\\:\*\<\?\>\"\'\|]|\s|\r|\r\n|\n/g, '_')
  download(url, '分享口令下载', filename + createDataStr)
}

async function main() {
  const argv = process.argv.splice(2) // 命令行参数
  const params = argv && argv.length > 0 ? argv[0] : ''
  if (params.indexOf('v.douyin.com') > -1) { // 参数是分享口令
    handleShare(params)
  } else { // 参数是用户主页
    const sec_uid = params.match(/(https:\/\/www.douyin.com\/user\/)?([\w|-]+)\??.*/)[2]
    // const sec_uid = params.replace('https://www.douyin.com/user/', '')
    if (!sec_uid) {
      console.log('参数错误，请输入用户主页链接，例如：node app.js https://www.douyin.com/user/MS4wLjABAAAAJqTyV9DKLyl-0JoeAU1BiZW2PWyfBX17JyeXK1YmE-w?vid=7169880604983463168')
      return
    }
    downloadUserAllVideo(sec_uid)
  }
}

main()