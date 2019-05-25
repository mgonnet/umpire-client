/**
 * @typedef UmpireClientOptions
 * @property {string} url
 */

const WebSocket = require(`ws`)
const MessageTypes = require(`@mgonnet/umpire`).MessageTypes

/**
 *
 * @param {UmpireClientOptions} options
 */
const UmpireClientFactory = ({ url }) => {
  let ws

  return {
    /**
     *
     * @param {string} name
     * @returns {Promise<'OK'>}
     */
    async register (name) {
      return new Promise(function (resolve, reject) {
        ws = new WebSocket(url)

        ws.on(`open`, function connected () {
          ws.send(JSON.stringify([MessageTypes.REGISTER, { name }]))
        })

        ws.on(`message`, (message) => {          
          const [type, data] = JSON.parse(String(message))
          if (type === `${MessageTypes.REGISTER}-ACCEPTED`) {
            resolve(`OK`)
          } else if (type === `${MessageTypes.REGISTER}-REJECTED`) {
            reject(data)
          }
        })
      })
    }
  }
}

module.exports = {
  UmpireClient: UmpireClientFactory
}
