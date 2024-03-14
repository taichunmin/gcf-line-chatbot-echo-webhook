const _ = require('lodash')
const { log, middlewareCompose } = require('../../libs/helper')
const Line = require('../../libs/linebotsdk').Client

// 模仿 Koajs 的 middleware
const lineEventHander = middlewareCompose([
  require('./initEvent'), // 紀錄事件、過濾測試事件、輔助函式、錯誤處理
  require('./cmd'), // 處理指令
  require('./replyFlexFromText'), // 嘗試回傳 flex
  require('./noReplyUrl'), // 如果是一個合法的 URL 就不作回應
  require('./replyEventJson'), // 把事件用 json 回傳
])

module.exports = async (ctx, next) => {
  const { req, res } = ctx
  if (req.method !== 'POST' || _.isNil(req.get('x-line-signature'))) return await next()
  try {
    // 處理 access token
    const channelAccessToken = req.path.substring(1)
    if (!/^[a-zA-Z0-9+/=]+$/.test(channelAccessToken)) throw new Error('invalid channel access token')
    const line = new Line({ channelAccessToken })

    // 處理 events
    const ctx = { line, req }
    const events = _.get(req, 'body.events', [])
    await Promise.all(_.map(events, event => lineEventHander({ ...ctx, event })))
    res.status(200).send({})
  } catch (err) {
    log('ERROR', err)
    res.status(err.status || 500).send(err.message)
  }
}
