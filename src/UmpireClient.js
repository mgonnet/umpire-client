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

        listener.on(`REGISTER-REJECTED`, (reason) => {
          reject(reason)
        })
      })
    },

    /**
     *
     * @param {string} name
     */
    async createLobby (name) {
      return new Promise(function (resolve, reject) {
        ws.send(JSON.stringify([MessageTypes.CREATE_LOBBY, { name }]))
        listener.on(`CREATE-LOBBY-ACCEPTED`, () => {
          resolve(`OK`)
        })
        listener.on(`CREATE-LOBBY-REJECTED`, (reason) => {
          reject(reason)
        })
      })
    }
  }
}

module.exports = {
  UmpireClient: UmpireClientFactory
}
