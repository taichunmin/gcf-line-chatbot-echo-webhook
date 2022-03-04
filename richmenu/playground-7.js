const { httpBuildQuery } = require('../libs/helper')

const RICHMENU_ALIAS = 'playground-7'

module.exports = {
  alias: RICHMENU_ALIAS,
  image: 'https://i.imgur.com/6AA2R40.png',
  metadata: {
    chatBarText: '打開圖文選單',
    selected: true,
    size: { width: 2500, height: 421 },
    areas: [
      {
        bounds: { x: 0, y: 0, width: 1565, height: 421 },
        action: {
          type: 'richmenuswitch',
          richMenuAliasId: 'playground-5',
          data: httpBuildQuery({ from: RICHMENU_ALIAS, to: 'playground-5' }),
        },
      },
      {
        bounds: { x: 1565, y: 0, width: 625, height: 421 },
        action: {
          type: 'uri',
          uri: 'https://developers.line.biz/en/reference/messaging-api/#size-object',
        },
      },
    ],
  },
}