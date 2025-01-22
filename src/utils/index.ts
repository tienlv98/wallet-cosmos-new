import {BinaryReader} from 'cosmjs-types/binary'
import base64js from 'base64-js'
import bech32 from 'bech32'
import {ripemd160} from 'ethereum-cryptography/ripemd160.js'
import {sha256} from 'ethereum-cryptography/sha256.js'

const toBase64 = (data: Uint8Array) => {
  return base64js.fromByteArray(data)
}

const toBech32 = (prefix: string, data: Uint8Array, limit?: number) => {
  const address = bech32.encode(prefix, bech32.toWords(data), limit)
  return address
}

const fromBech32 = (address: string, limit = Infinity) => {
  const decodedAddress = bech32.decode(address, limit)
  return {
    prefix: decodedAddress.prefix,
    data: new Uint8Array(bech32.fromWords(decodedAddress.words))
  }
}

const rawSecp256k1PubkeyToRawAddress = (data: Uint8Array) => {
  return ripemd160(sha256(data))
}

const bigintToUint8Array = (value: BigInt) => {
  const hex = value.toString(16)
  const len = Math.ceil(hex.length / 2)
  const u8 = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    u8[len - i - 1] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return u8.reverse()
}

const decodeAbciQuery = (data: any) => {
  const {response} = data
  return {
    key: response.key,
    value: Uint8Array.from(Buffer.from(response.value, 'base64')),
    proof: response.proofOps,
    height: response.height,
    code: response.code,
    codespace: response.codespace,
    index: response.index,
    log: response.log,
    info: response.info
  }
}

export class ChainMissingError extends Error {
  constructor() {
    super('Chain must be provided')
  }
}
export class ParamsError extends Error {
  constructor() {
    super('Params must be provided')
  }
}

export {toBase64, toBech32, fromBech32, rawSecp256k1PubkeyToRawAddress, bigintToUint8Array, decodeAbciQuery}
