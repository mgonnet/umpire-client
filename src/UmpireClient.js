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
  const MessageTypes = require(`@mgonnet/umpire/src/entities/MessageTypes`)

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

  /**
   * Add a function that will be executed each time that
   * a someone joins,
   *
   * @param {WebSocket} ws
   * @param {Function} callback
   */
  function addLobbyUpdateListener (ws, callback) {
    ws.addEventListener(`message`, ({ data }) => {
      const { type } = parseMessage(data)
      if (type === `JOINED-LOBBY`) {
        callback(lobbyInfo)
      }
    })
  }

  /**
   * Mantain the lobbyInfo with the updates originated when
   * a player joins,
   *
   * @param {WebSocket} ws
   */
  function onEventUpdateLobbyInfo (ws) {
    ws.addEventListener(`message`, ({ data }) => {
      const { type, payload } = parseMessage(data)
      if (type === `JOINED-LOBBY`) {
        lobbyInfo.players.push(payload)
      }
    })
  }

  /** @type {WebSocket} */
  let ws

  let userName
  let lobbyName

  let lobbyInfo = { }

  return {

    /**
     * The name of the current player
     *
     * @returns {string}
     */
    get user () { return userName },

    /**
     * The name of the lobby the player is currently in
     *
     * @returns {string}
     */
    get lobby () { return lobbyName },

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

      return onresponse(ws, MessageTypes.REGISTER).then(() => {
        userName = name
        return `OK`
      })
    },

    /**
     *
     * @param {string} name
     */
    createLobby (name) {
      ws.send(JSON.stringify([MessageTypes.CREATE_LOBBY, { name }]))
      return onresponse(ws, MessageTypes.CREATE_LOBBY).then((info) => {
        lobbyName = name
        lobbyInfo = info
        onEventUpdateLobbyInfo(ws)
        return lobbyInfo
      })
    },

    joinLobby (name) {
      ws.send(JSON.stringify([MessageTypes.JOIN_LOBBY, { name }]))
      return onresponse(ws, MessageTypes.JOIN_LOBBY).then((info) => {
        lobbyName = name
        lobbyInfo = info
        onEventUpdateLobbyInfo(ws)
        return lobbyInfo
      })
    },

    chooseRol (rol) {
      ws.send(JSON.stringify([MessageTypes.CHOOSE_ROL, { rol }]))
      return onresponse(ws, MessageTypes.CHOOSE_ROL).then(({ name, rol }) => {
        const playerInfo = lobbyInfo.players.find((player) => player.name === name)
        playerInfo.rol = rol
        return lobbyInfo
      })
    },

    /**
     * Executes callback each time that the lobby info
     * is updated
     *
     * @param {Function} callback
     */
    addLobbyUpdateListener (callback) {
      addLobbyUpdateListener(ws, callback)
    }
  }
}

module.exports = UmpireClientFactory
