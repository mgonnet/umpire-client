const Umpire = require(`@mgonnet/umpire`).Umpire
const Chess = require(`chess.js`).Chess
const UmpireClient = require(`../../src/UmpireClient`).UmpireClient
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
})
