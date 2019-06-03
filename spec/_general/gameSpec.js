const Umpire = require(`@mgonnet/umpire`)
const Chess = require(`chess.js`).Chess
const UmpireClient = require(`../../src/UmpireClient`)
const WebSocket = require(`ws`)

const PORT = 3000
const URL = `ws://localhost:${PORT}`

describe(`Game`, function () {
  let server
  let client
  let otherClient

  beforeEach(async function () {
    spyOn(console, `log`)
    server = Umpire({ port: PORT, game: Chess })
    await server.start()
    client = UmpireClient({ url: URL, WSConstructor: WebSocket, Game: Chess })
    await client.register(`useloom`)
    otherClient = UmpireClient({ url: URL, WSConstructor: WebSocket, Game: Chess })
    await otherClient.register(`rataplan`)

    await client.createLobby(`lobby`)
    await otherClient.createLobby(`lobby2`)
    await client.chooseRol(`w`)
    await otherClient.chooseRol(`b`)

    await client.startGame()
  })

  afterEach(async function () {
    await server.close()
  })

  it(`should allow a player to move`, async function () {
    const game = await client.move(`e4`)

    const expectedGame = new Chess()
    expectedGame.move(`e4`)

    expect(game.ascii()).toBe(expectedGame.ascii())
  })
})
