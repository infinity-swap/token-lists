import axios from 'axios';
import TokenJson from './tokenlist.json';

const IC_API_BASE_URL = 'https://ic-api.internetcomputer.org';
const TOKENLIST_URL =
  'https://raw.githubusercontent.com/infinity-swap/token-lists/main/src/tokenlist.json';

interface TokenListJson {
  name: string;
  tokens: Token[];
}

interface CanisterInfo {
  canisterId: string;
  controllers: string[];
  wasmHash: string;
  subnetId: string;
}

interface TokenProperties {
  principal: string;
  name: string;
  symbol: string;
  decimals: number;
  standard: string;
  canisterInfo?: CanisterInfo;
}

type JsonnableToken = TokenProperties;

export class Token {
  private _principal: string;
  private _name: string;
  private _symbol: string;
  private _decimals: number;
  private _standard: string;
  private _canisterInfo?: CanisterInfo;

  constructor(props: TokenProperties) {
    this._principal = props.principal;
    this._name = props.name;
    this._symbol = props.symbol;
    this._decimals = props.decimals;
    this._standard = props.standard;
    this._canisterInfo = props.canisterInfo;
  }

  get name() {
    return this._name;
  }

  get principal() {
    return this._principal;
  }

  get symbol() {
    return this._symbol;
  }

  get decimals() {
    return this._decimals;
  }

  get standard() {
    return this._standard;
  }

  get wasmHash() {
    return this._canisterInfo?.wasmHash;
  }
  get controllers() {
    return this._canisterInfo?.controllers;
  }

  async getCanisterInfo(): Promise<CanisterInfo> {
    const url = `${IC_API_BASE_URL}/api/v3/canisters/${this.principal}`;
    const { data } = await axios.get(url);
    const {
      canister_id: canisterId,
      module_hash: wasmHash,
      subnet_id: subnetId,
      controllers
    } = data;
    return { canisterId, wasmHash, subnetId, controllers };
  }

  static fromJSON(json: string | JsonnableToken): Token {
    let token;

    if (typeof json === 'string') {
      token = JSON.parse(json);
    } else {
      token = json;
    }

    return new this(token);
  }

  toJSON(): JsonnableToken {
    return {
      principal: this._principal,
      name: this._name,
      symbol: this._symbol,
      decimals: this._decimals,
      standard: this._standard,
      canisterInfo: this._canisterInfo
    };
  }
}

interface JsonableTokenList {
  name: string;
  tokens: TokenProperties[];
}

export class TokenList {
  private _name: string;
  private _tokens: Token[];

  constructor(name: string, tokens: Token[]) {
    this._name = name;
    this._tokens = tokens;
  }

  get name() {
    return this._name;
  }

  get tokens() {
    return this._tokens;
  }

  static async create(): Promise<TokenList> {
    const { data } = await axios.get<TokenListJson>(TOKENLIST_URL);

    const tokens = data.tokens.map((token) => Token.fromJSON(token));

    return new this(TokenJson.name, tokens);
  }

  static fromJSON(json: string | JsonableTokenList): TokenList {
    let tokenList: JsonableTokenList;
    if (typeof json === 'string') {
      tokenList = JSON.parse(json);
    } else {
      tokenList = json;
    }

    const tokens = tokenList.tokens.map((token) => Token.fromJSON(token));
    return new this(tokenList.name, tokens);
  }
}
