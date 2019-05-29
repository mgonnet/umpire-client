const EventEmitter = require(`events`)
const MessageTypes = require(`@mgonnet/umpire`).MessageTypes

/**
 * @typedef ListenerOptions
 * @property {WebSocket} ws
 * @fires REGISTER-ACCEPTED
 */

module.exports = class UmpireListener extends EventEmitter {
  /**
   *
   * @param {ListenerOptions} options
   */
  constructor ({ ws }) {
    super()
    this.ws = ws
  }

  listen () {
    // this.ws.addEventListener(`message`, (a) => console.log(`noo`))
    this.ws.addEventListener(`message`, (message) => {
      console.log(`blabla`)
      const [type, data] = JSON.parse(String(message.data))
      if (type === `${MessageTypes.REGISTER}-ACCEPTED`) {
        this.emit(`REGISTER-ACCEPTED`)
      } else if (type === `${MessageTypes.REGISTER}-REJECTED`) {
        this.emit(`REGISTER-REJECTED`, data.reason)
      } else if (type === `${MessageTypes.CREATE_LOBBY}-ACCEPTED`) {
        this.emit(`CREATE-LOBBY-ACCEPTED`)
      } else if (type === `${MessageTypes.CREATE_LOBBY}-REJECTED`) {
        this.emit(`${MessageTypes.CREATE_LOBBY}-REJECTED`, data.reason)
      } else if (type === `${MessageTypes.JOIN_LOBBY}-ACCEPTED`) {
        this.emit(`${MessageTypes.JOIN_LOBBY}-ACCEPTED`, data.players)
      } else if (type === `JOINED-LOBBY`) {
        console.log(data, `lalala`)
        this.emit(`JOINED-LOBBY`, data.player)
      }
    })
  }
}
