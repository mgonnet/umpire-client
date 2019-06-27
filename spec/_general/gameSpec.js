const Umpire = require(`@mgonnet/umpire`)
const Chess = require(`chess.js`).Chess
const UmpireClient = require(`../../src/UmpireClient`)
const WebSocket = require(`ws`)

const PORT = 3000
const URL = `ws://localhost:${PORT}`

const FakeChess = new Proxy(Chess, {
  construct: function (Target, args) {
    const myFake = new Target(...args)
    // @ts-ignore
    myFake.state = () => myFake.ascii()
    return myFake
  }
})

describe(`Game`, function () {
  let server
  let client
  let otherClient

  beforeEach(async function () {
    spyOn(console, `log`)
    server = Umpire({ port: PORT, game: FakeChess })
    await server.start()
    client = UmpireClient({ url: URL, WSConstructor: WebSocket, Game: FakeChess })
    await client.register(`useloom`)
    otherClient = UmpireClient({ url: URL, WSConstructor: WebSocket, Game: FakeChess })
    await otherClient.register(`rataplan`)

    await client.createLobby(`lobby`)
    await otherClient.joinLobby(`lobby`)
    await client.chooseRol(`w`)
    await otherClient.chooseRol(`b`)

    await client.startGame()
  })

  afterEach(async function () {
    await server.close()
  })

  it(`should allow a player to move`, async function () {
    const gameInfo = await client.move(`e4`)

    const expectedGame = new Chess()
    expectedGame.move(`e4`)

    expect(gameInfo.gameState).toBe(expectedGame.ascii())
    expect(gameInfo.moves).toEqual([])
    expect(gameInfo.myTurn).toBe(false)
  })

  it(`should execute the callback when the other player moves`, async function () {
    const notified = new Promise(function (resolve, reject) {
      otherClient.addEventListener(`MOVE`, (gameInfo) => {
        const expectedGame = new FakeChess()
        expectedGame.move(`e4`)
        expect(gameInfo.gameState).toBe(expectedGame.ascii())
        expect(gameInfo.moves).toEqual(expectedGame.moves())
        expect(gameInfo.myTurn).toEqual(true)
        resolve()
      })
    })

    await client.move(`e4`)

    await notified
  })
})
