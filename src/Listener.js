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
    this.ws.onmessage = (message) => {
      const [type] = JSON.parse(String(message.data))

      if (type === `${MessageTypes.REGISTER}-ACCEPTED`) {
        this.emit(`REGISTER-ACCEPTED`)
      } else if (type === `${MessageTypes.REGISTER}-REJECTED`) {
        this.emit(`REGISTER-REJECTED`)
      }
    }
  }
}
