const fs = require('fs');
const request = require('request');
const rp = require('request-promise');

// 获取所有视频的 id
function getVideoList() {
  return new Promise((resolve, reject) => {
    fs.readFile('./response.json', 'utf8', function (err, data) {
      if (err) {
        reject(err)
      };
      const da = JSON.parse(data);//读取的值
      const videoList = da.map(item => ({ id: item.aweme_id, desc: item.desc }))
      console.log('共 ' + videoList.length + ' 个视频')
      resolve(videoList)
    });
  })
}

/**
 * 通过视频 id 取得视频无水印真实链接
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
      resolve(noWaterMarkUrl)
    }).catch(reject)
  })
}

/**
 * 下载视频到本地
 * @param {string} url 视频 url
 */
function download(url, filename='filename') {
  return new Promise((resolve, reject) => {
    let stream = fs.createWriteStream('./data/' + filename + '.mp4');
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

async function main() {
  const videoList = await getVideoList()
  // 顺序下载
  for(let index = 0; index < videoList.length; index++) {
    try {
      const url = await getTrueVideoUrl(videoList[index].id)
      // await download(url, String(index))
      await download(url, videoList[index].desc.replace(/\s|\r|\r\n|\n/g, '-'))
    } catch(err) {
      console.log(err)
    }
  }
  // 同时下载，速度快，但数量多了会报错
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