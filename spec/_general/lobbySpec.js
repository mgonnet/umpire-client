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
    client = UmpireClient({ url: URL, WSConstructor: WebSocket })
    await client.register(`useloom`)
  })

  afterEach(async function () {
    await server.close()
  })

  it(`should allow to create a lobby`, async function () {
    const result = await client.createLobby(`myLobby`)

    expect(result).toBe(`OK`)
  })

  it(`should reject with a reason when the server rejects a lobby creation`, async function () {
    const result = await client.createLobby(`myLobby`)
    expect(result).toBe(`OK`)

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
    const otherClient = UmpireClient({ url: URL, WSConstructor: WebSocket })
    await otherClient.register(`rataplan`)

    const result = await otherClient.joinLobby(`myLobby`)

    const resultString = JSON.stringify(result)
    const expectedPlayers = `[{"name":"useloom"},{"name":"rataplan"}]`

    expect(resultString).toBe(expectedPlayers)
  })

  it(`should execute the function setted on onJoinedLobby`, async function () {
    const eventCalled = new Promise(function (resolve, reject) {
      client.addListener(`JOINED-LOBBY`, ({ player }) => {
        expect(player).toBe(`rataplan`)
        resolve()
      })
    })

    await client.createLobby(`myLobby`)
    const otherClient = UmpireClient({ url: URL, WSConstructor: WebSocket })
    await otherClient.register(`rataplan`)
    await otherClient.joinLobby(`myLobby`)

    await eventCalled
  })
})
