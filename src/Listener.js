const EventEmitter = require(`events`)

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
      const [type, data] = JSON.parse(String(message.data))
      if (type === `JOINED-LOBBY`) {
        this.emit(`JOINED-LOBBY`, data.player)
      }
    })
  }
}
