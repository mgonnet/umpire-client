const Umpire = require(`@mgonnet/umpire`).Umpire
const Chess = require(`chess.js`).Chess
const UmpireClient = require(`../../src/UmpireClient`).UmpireClient
const PORT = 3000
const URL = `ws://localhost:${PORT}`

describe(`Registration`, function () {
  let server
  let client

  beforeEach(async function () {
    server = Umpire({ port: PORT, game: Chess })
    await server.start()
    client = UmpireClient({ url: URL })
  })

  it(`should allow to register a user`, async function () {
    const result = await client.register(`useloom`)

    expect(result).toBe(`OK`)
  })
})
