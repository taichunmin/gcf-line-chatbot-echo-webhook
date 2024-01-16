const _ = require('lodash')
const { log, parseJsonOrDefault } = require('../../libs/helper')
const { tryAddShareBtn } = require('../../libs/tryAddShareBtn')
const msgReplyFlexError = require('../msg/reply-flex-error')
const msgText = require('../msg/text')

const getAltText = msg => {
  msg = _.chain(msg).castArray().last().value()
  return msg?.altText ?? msg?.text
}

module.exports = async (ctx, next) => {
  try {
    let msg = parseJsonOrDefault(_.get(ctx, 'event.message.text'))
    if (!_.isArray(msg) && !_.isPlainObject(msg)) return await next() // 轉交給下一個 middleware 處理

    if (_.has(msg, 'replyToken') || _.has(msg, 'events.0.replyToken')) { // 有 replyToken 代表使用者可能是把剛剛傳送的事件複製貼上
      return await ctx.replyMessage(msgText('感謝你傳訊息給我，但因為這個訊息疑似是 Messaging API 中傳送給 Webhook 的事件，所以我不知道該怎麼處理它。\n\n如果你是開發者，請參考相關文件: https://developers.line.biz/en/reference/messaging-api/#message-event'))
    }

    // 幫忙補上外層的 flex (從 FLEX MESSAGE SIMULATOR 來的通常有這問題)
    const isPartialFlex = _.includes(['bubble', 'carousel'], _.get(msg, 'type'))
    if (isPartialFlex) msg = { altText: '缺少替代文字', contents: msg, type: 'flex' }

    log({ message: `reply flex from text, altText: ${getAltText(msg)}`, msg }) // 回傳前先記錄一次
    await ctx.line.validateReplyMessageObjects(msg) // 先透過 messaging api 驗證內容

    msg = await tryAddShareBtn(ctx, msg) // 嘗試新增透過 LINE 數位版名片分享的按鈕
    await ctx.replyMessage(msg)
  } catch (err) {
    const lineApiErrData = err?.originalError?.response?.data ?? err?.response?.data
    if (!lineApiErrData?.message) throw err // 並非訊息內容有誤
    err.message = `reply flex from text: ${lineApiErrData?.message ?? err.message}`
    log('ERROR', err)
    try { // 如果還可以 reply 就嘗試把訊息往回傳
      await ctx.replyMessage(msgReplyFlexError(lineApiErrData))
    } catch (err) {}
  }
}
