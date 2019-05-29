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
  })

  afterEach(async function () {
    await server.close()
  })

  it(`should allow to register a user`, async function () {
    const result = await client.register(`useloom`)

    expect(result).toBe(`OK`)
  })

  it(`should reject with a reason when the server rejects a user`, async function () {
    const result = await client.register(`useloom`)
    expect(result).toBe(`OK`)

    let secondResult
    try {
      secondResult = await client.register(`useloom`)
    } catch (e) {
      secondResult = e
    }
    expect(secondResult).toBe(`User name taken - useloom`)
  })
})
