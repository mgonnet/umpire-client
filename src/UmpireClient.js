/**
 * @typedef UmpireClientOptions
 * @property {string} url
 * @property {*} WSConstructor
 * @property {*} Game
 */

/**
 *
 * @param {UmpireClientOptions} options
 */
const UmpireClientFactory = ({ url, WSConstructor, Game }) => {
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
   * Mantain the lobbyInfo and game with the updates originated when
   * a player joins, chooses rol,
   *
   * @param {WebSocket} ws
   */
  function onServerEvent (ws) {
    ws.addEventListener(`message`, ({ data }) => {
      const { type, payload } = parseMessage(data)
      if (type === MessageTypes.JOINED_LOBBY) {
        lobbyInfo.players.push(payload)
      } else if (type === MessageTypes.CHOOSED_ROL) {
        const playerInfo = lobbyInfo.players.find((player) => player.name === payload.name)
        playerInfo.rol = payload.rol
      } else if (type === MessageTypes.GAME_STARTED) {
        game = new Game()
        gameInfo = { }
        updateGameInfo()
      } else if (type === MessageTypes.MOVED) {
        game.move(payload.move)
        updateGameInfo()
      }
    })
  }

  function updateGameInfo () {
    gameInfo.turn = game.turn()
    gameInfo.gameState = game.state()
    const playerInfo = lobbyInfo.players.find((player) => player.name === userName)
    if (playerInfo.rol === gameInfo.turn) {
      gameInfo.myTurn = true
      gameInfo.moves = game.moves()
    } else {
      gameInfo.myTurn = false
      gameInfo.moves = []
    }
  }

  /** @type {WebSocket} */
  let ws
  /** @type {string} */
  let userName
  /** @type {string} */
  let lobbyName

  let game

  let lobbyInfo = { }
  let gameInfo = { }

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
     */
    leave () {
      ws.send(JSON.stringify([MessageTypes.LEAVE_SERVER]))
      return onresponse(ws, MessageTypes.LEAVE_SERVER).then(() => {
        ws.close()
        userName = null
        lobbyName = null
        lobbyInfo = null
        game = null
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
        lobbyInfo.players.forEach((player) => {
          if (player.name === userName) {
            player.me = true
          }
        })
        onServerEvent(ws)
        return { lobbyInfo }
      })
    },

    joinLobby (name) {
      ws.send(JSON.stringify([MessageTypes.JOIN_LOBBY, { name }]))
      return onresponse(ws, MessageTypes.JOIN_LOBBY).then((info) => {
        lobbyName = name
        lobbyInfo = info
        lobbyInfo.players.forEach((player) => {
          if (player.name === userName) {
            player.me = true
          }
        })
        onServerEvent(ws)
        return { lobbyInfo }
      })
    },

    chooseRol (rol) {
      ws.send(JSON.stringify([MessageTypes.CHOOSE_ROL, { rol }]))
      return onresponse(ws, MessageTypes.CHOOSE_ROL).then(({ name, rol }) => {
        const playerInfo = lobbyInfo.players.find((player) => player.name === name)
        playerInfo.rol = rol
        return { lobbyInfo }
      })
    },

    startGame () {
      ws.send(JSON.stringify([MessageTypes.START_GAME]))
      return onresponse(ws, MessageTypes.START_GAME).then((serversInfo) => {
        // I should validate here that my info is the same that the info in the server
        game = new Game()
        gameInfo = { }
        updateGameInfo()

        return { lobbyInfo, gameInfo }
      })
    },

    /**
     *
     * @param {string} move
     */
    move (move) {
      ws.send(JSON.stringify([MessageTypes.MOVE, { move }]))
      return onresponse(ws, MessageTypes.MOVE).then((response) => {
        game.move(move)
        updateGameInfo()

        return { gameInfo }
      })
    },

    /**
     *
     * @param {*} options
     */
    moves (options) {
      return { moves: game.moves(options) }
    },

    /**
     * Executes callback each time that the lobby info
     * is updated
     *
     * @param {"LOBBY-UPDATE" | "GAME-START" | "MOVE"} event
     * @param {Function} myCallback
     */
    addEventListener (event, myCallback) {
      ws.addEventListener(`message`, ({ data }) => {
        const { type } = parseMessage(data)
        switch (type) {
          case MessageTypes.JOINED_LOBBY:
          case MessageTypes.CHOOSED_ROL:
            if (event === `LOBBY-UPDATE`) {
              myCallback({ lobbyInfo })
            }
            break

          case MessageTypes.GAME_STARTED:
            if (event === `GAME-START`) {
              myCallback({ lobbyInfo, gameInfo })
            }
            break

          case MessageTypes.MOVED:
            if (event === `MOVE`) {
              myCallback({ gameInfo })
            }
            break

          default:
            break
        }
      })
    }
  }
}

module.exports = UmpireClientFactory
