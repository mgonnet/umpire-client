const Umpire = require(`@mgonnet/umpire`)
const Chess = require(`chess.js`).Chess
const UmpireClient = require(`../../src/UmpireClient`)
const WebSocket = require(`ws`)

const PORT = 3000
const URL = `ws://localhost:${PORT}`

describe(`Registration`, function () {
  let server
  let client

  beforeEach(async function () {
    spyOn(console, `log`)
    server = Umpire({ port: PORT, game: Chess })
    await server.start()
    client = UmpireClient({ url: URL, WSConstructor: WebSocket, Game: Chess })
    await client.register(`useloom`)
  })

  afterEach(async function () {
    await server.close()
  })

  it(`should allow to create a lobby`, async function () {
    const result = await client.createLobby(`myLobby`)

    expect(result).toEqual({ players: [{ name: `useloom` }] })
  })

  it(`should reject with a reason when the server rejects a lobby creation`, async function () {
    const result = await client.createLobby(`myLobby`)
    expect(result).toEqual({ players: [{ name: `useloom` }] })

    let secondResult
    try {
      secondResult = await client.createLobby(`myLobby`)
    } catch (e) {
      secondResult = e
    }
    expect(secondResult).toBe(`User already in lobby`)
  })

  it(`should allow to join a lobby and show the players inside`, async function () {
    await client.createLobby(`myLobby`)
    const otherClient = UmpireClient({ url: URL, WSConstructor: WebSocket, Game: Chess })
    await otherClient.register(`rataplan`)

    const result = await otherClient.joinLobby(`myLobby`)

    const expectedPlayers = { players: [{ "name": `useloom` }, { "name": `rataplan` }] }

    expect(result).toEqual(expectedPlayers)
  })

  it(`should execute the function setted on onJoinedLobby`, async function () {
    await client.createLobby(`myLobby`)

    const eventCalled = new Promise(function (resolve, reject) {
      client.addEventListener(`LOBBY-UPDATE`, (info) => {
        expect(info).toEqual({ players: [{ "name": `useloom` }, { "name": `rataplan` }] })
        resolve()
      })
    })

    const otherClient = UmpireClient({ url: URL, WSConstructor: WebSocket, Game: Chess })
    await otherClient.register(`rataplan`)
    await otherClient.joinLobby(`myLobby`)

    await eventCalled
  })

  it(`should allow a player to choose a rol`, async function () {
    await client.createLobby(`myLobby`)
    const result = await client.chooseRol(`w`)

    expect(result).toEqual({ players: [{ name: `useloom`, rol: `w` }] })
  })

  it(`should execute the lobby change callback when other player chooses rol`, async function () {
    await client.createLobby(`myLobby`)

    const otherClient = UmpireClient({ url: URL, WSConstructor: WebSocket, Game: Chess })
    await otherClient.register(`rataplan`)
    await otherClient.joinLobby(`myLobby`)

    const eventCalled = new Promise(function (resolve, reject) {
      otherClient.addEventListener(`LOBBY-UPDATE`, (info) => {
        expect(info).toEqual({ players: [{ "name": `useloom`, rol: `w` }, { "name": `rataplan` }] })
        resolve()
      })
    })

    const result = await client.chooseRol(`w`)

    expect(result).toEqual({ players: [{ name: `useloom`, rol: `w` }, { name: `rataplan` }] })

    await eventCalled
  })

  it(`should allow to start the game`, async function () {
    await client.createLobby(`myLobby`)

    const otherClient = UmpireClient({ url: URL, WSConstructor: WebSocket, Game: Chess })
    await otherClient.register(`rataplan`)
    await otherClient.joinLobby(`myLobby`)

    await client.chooseRol(`w`)
    await otherClient.chooseRol(`b`)

    const result = await client.startGame()

    expect(result).toEqual({ players: [{ name: `useloom`, rol: `w` }, { name: `rataplan`, rol: `b` }] })
  })
})
