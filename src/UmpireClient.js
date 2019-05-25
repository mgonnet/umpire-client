/**
 * @typedef UmpireClientOptions
 * @property {string} url
 * @property {*} WSConstructor
 */

const Listener = require(`./Listener`)
const MessageTypes = require(`@mgonnet/umpire`).MessageTypes

/**
 *
 * @param {UmpireClientOptions} options
 */
const UmpireClientFactory = ({ url, WSConstructor }) => {
  /** @type {WebSocket} */
  let ws
  let listener

  return {
    /**
     *
     * @param {string} name
     * @returns {Promise<'OK'>}
     */
    async register (name) {
      return new Promise(function (resolve, reject) {
        ws = new WSConstructor(url)

        ws.onopen = function connected () {
          ws.send(JSON.stringify([MessageTypes.REGISTER, { name }]))
        }

        // @ts-ignore
        listener = new Listener({ ws })
        listener.listen()

        listener.on(`REGISTER-ACCEPTED`, () => {
          resolve(`OK`)
        })

        listener.on(`REGISTER-REJECTED`, () => {
          // reject()
        })
      })
    }
  }
}

module.exports = {
  UmpireClient: UmpireClientFactory
}
