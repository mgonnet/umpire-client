[![codecov](https://codecov.io/gh/mgonnet/umpire-client/branch/master/graph/badge.svg)](https://codecov.io/gh/mgonnet/umpire-client)

# @mgonnet/umpire-client

## Functions
- register(name) : Promise<'OK'>
- leave() : Promise<'OK'>
- createLobby(name) : Promise<{lobbyInfo}>
- joinLobby(name) : Promise<{lobbyInfo}>
- chooseRol(rol) : Promise<{lobbyInfo}>
- startGame() : Promise<{lobbyInfo, gameInfo}>
- move(move) : Promise<{gameInfo}>
- moves(options) : Promise<{moves}>

## Listeners
- 'LOBBY-UPDATE': {lobbyInfo}
- 'GAME-START': {lobbyInfo, gameInfo}
- 'MOVE': {gameInfo}

## References