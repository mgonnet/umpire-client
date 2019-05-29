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
    const [type, payload] = JSON.parse(message)
    return { type, payload }
  }

  /**
   *
   * @param {WebSocket} ws
   * @param {string} messageType
   */
  function onresponse (ws, messageType) {
    return new Promise(function (resolve, reject) {
      function listener ({ data }) {
        const parsed = parseMessage(data)
        if (parsed.type === `${messageType}-ACCEPTED`) {
          ws.removeEventListener(`message`, listener)
          resolve(parsed.payload)
        } else if (parsed.type === `${messageType}-REJECTED`) {
          ws.removeEventListener(`message`, listener)
          reject(parsed.payload.reason)
        }
      }

      ws.addEventListener(`message`, listener)
    })
  }

  /** @type {WebSocket} */
  let ws
  let listener

  let user
  let lobby

  return {

    /**
     * The name of the current player
     * @returns {string}
     */
    get user () { return user },

    /**
     * The name of the lobby the player is currently in  
     * @returns {string}
     */
    get lobby () { return lobby },

    /**
     *
     * @param {string} name
     * @returns {Promise<string>}
     */
    register (name) {
      ws = new WSConstructor(url)

      ws.onopen = function connected () {
        ws.send(JSON.stringify([MessageTypes.REGISTER, { name }]))
      }

      // @ts-ignore
      listener = new Listener({ ws })
      listener.listen()

      return onresponse(ws, MessageTypes.REGISTER).then(() => {
        user = name
        return `OK`
      })
    },

    /**
     *
     * @param {string} name
     */
    createLobby (name) {
      ws.send(JSON.stringify([MessageTypes.CREATE_LOBBY, { name }]))
      return onresponse(ws, MessageTypes.CREATE_LOBBY).then(() => {
        lobby = name
        return `OK`
      })
    },

    async joinLobby (name) {
      ws.send(JSON.stringify([MessageTypes.JOIN_LOBBY, { name }]))
      return onresponse(ws, MessageTypes.JOIN_LOBBY).then(({ players }) => {
        lobby = name
        return players
      })
    },

    /**
     * Executes callback each time that the event is fired
     *
     * @param {"JOINED-LOBBY"} event
     * @param {Function} callback
     */
    addListener (event, callback) {
      ws.addEventListener(`message`, ({ data }) => {
        const { type, payload } = parseMessage(data)
        if (event === type) {
          callback(payload)
        }
      })
    }
  }
}

module.exports = {
  UmpireClient: UmpireClientFactory
}
