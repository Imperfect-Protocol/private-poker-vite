export interface NetworkShape {
  connector: NetworkConnector;
  lobby: PokerLobby;
  games?: PokerGame[];
  players?: Bot[];
}

export class Network {
  connector: NetworkConnector;
  lobby: PokerLobby;
  games: PokerGame[];
  players: Bot[];

  constructor({ connector, lobby, games = [], players = [] }: NetworkShape) {
    this.connector = connector;
    this.lobby = lobby;
    this.games = games;
    this.players = players;
  }
}

export class NetworkConnector {}

export class PokerLobby {
  async run(): Promise<unknown> {
    throw new Error("PokerLobby.run must be implemented by the concrete lobby");
  }
}

export class PokerGame {
  session(): PokerGameSession {
    throw new Error("PokerGame.session must be implemented by the concrete game");
  }

  session_mut(): PokerGameSession {
    return this.session();
  }
}

export class PokerGameSession {
  state(): unknown {
    throw new Error("PokerGameSession.state must be implemented by the concrete session");
  }

  state_mut(): unknown {
    return this.state();
  }

  connector(): NetworkConnector {
    throw new Error("PokerGameSession.connector must be implemented by the concrete session");
  }

  connector_mut(): NetworkConnector {
    return this.connector();
  }
}

export class BotGame {}

export class Bot {
  games(): BotGame[] {
    throw new Error("Bot.games must be implemented by the concrete bot");
  }

  games_mut(): BotGame[] {
    return this.games();
  }
}
