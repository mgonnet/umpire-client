/**
 * @typedef UmpireClientOptions
 * @property {string} url
 * @property {*} WSConstructor
 */

/**
 *
 * @param {UmpireClientOptions} options
 */
const UmpireClientFactory = ({ url, WSConstructor }) => {
  const Listener = require(`./Listener`)
  const MessageTypes = require(`@mgonnet/umpire`).MessageTypes

  function parseMessage (message) {
    const [type, data] = JSON.parse(message)
    return { type, data }
  }

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

        function onresponse ({ data }) {
          const parsed = parseMessage(data)
          if (parsed.type === `${MessageTypes.REGISTER}-ACCEPTED`) {
            ws.removeEventListener(`message`, onresponse)
            resolve(`OK`)
          } else if (parsed.type === `${MessageTypes.REGISTER}-REJECTED`) {
            ws.removeEventListener(`message`, onresponse)
            reject(parsed.data.reason)
          }
        }

        ws.addEventListener(`message`, onresponse)
        // @ts-ignore
        listener = new Listener({ ws })
        listener.listen()
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
    },

    async joinLobby (name) {
      return new Promise(function (resolve, reject) {
        ws.send(JSON.stringify([MessageTypes.JOIN_LOBBY, { name }]))
        listener.on(`${MessageTypes.JOIN_LOBBY}-ACCEPTED`, (players) => {
          resolve(players)
        })
      })
    },

    /**
     * Return the listener of the event.
     *
     * @returns {(Function|undefined)} The event listener or `undefined`
     * @public
     */
    get onJoinedLobby () {
      const listeners = listener.listeners(`JOINED-LOBBY`)
      for (let i = 0; i < listeners.length; i++) {
        if (listeners[i]._listener) return listeners[i]._listener
      }

      return undefined
    },

    /**
     * Add a listener for the event joined lobby event.
     *
     * @param {Function} customListener The listener to add
     * @public
     */
    set onJoinedLobby (customListener) {
      const listeners = listener.listeners(`JOINED-LOBBY`)
      for (let i = 0; i < listeners.length; i++) {
        //
        // Remove only the listeners added via `addEventListener`.
        //
        if (listeners[i]._listener) listener.removeListener(`JOINED-LOBBY`, listeners[i])
      }
      listener.addListener(`JOINED-LOBBY`, customListener)
    }
  }
}

module.exports = {
  UmpireClient: UmpireClientFactory
}
