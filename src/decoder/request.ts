import {BinaryReader, BinaryWriter} from 'cosmjs-types/binary'
import {Any} from 'cosmjs-types/google/protobuf/any'
import {AuthInfo, TxBody, TxRaw, Fee} from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import {IAccountInfo} from '../types'

const encodeAccount = (address: string) => {
  const writer = BinaryWriter.create()
  writer.uint32(10).string(address)
  return Buffer.from(writer.finish()).toString('hex')
}

const decodeAccount = (data: Uint8Array) => {
  const readerAny = new BinaryReader(data)
  let endAny = readerAny.len
  let account: Any | undefined
  while (readerAny.pos < endAny) {
    const tag = readerAny.uint32()
    switch (tag >>> 3) {
      case 1:
        account = Any.decode(readerAny, readerAny.uint32())
        break
      default:
        readerAny.skipType(tag & 7)
        break
    }
  }

  const reader = new BinaryReader(account.value)
  let end = reader.len
  const message: IAccountInfo = {
    address: '',
    pubKey: {
      typeUrl: '',
      value: new Uint8Array()
    },
    accountNumber: BigInt(0),
    sequence: BigInt(0)
  }
  while (reader.pos < end) {
    const tag = reader.uint32()
    switch (tag >>> 3) {
      case 1:
        message.address = reader.string()
        break
      case 2:
        message.pubKey = Any.decode(reader, reader.uint32())
        break
      case 3:
        message.accountNumber = reader.uint64()
        break
      case 4:
        message.sequence = reader.uint64()
        break
      default:
        reader.skipType(tag & 7)
        break
    }
  }
  return message
}

const encodeBalance = (address: string, denom: string) => {
  const writer = BinaryWriter.create()
  writer.uint32(10).string(address)
  writer.uint32(18).string(denom)
  return Buffer.from(writer.finish()).toString('hex')
}

const coinDecode = (input: BinaryReader, length?: number) => {
  const reader = input // new BinaryReader(input)
  let end = length === undefined ? reader.len : reader.pos + length
  const message = {
    denom: 'usei',
    amount: '0'
  }
  while (reader.pos < end) {
    const tag = reader.uint32()
    switch (tag >>> 3) {
      case 1:
        message.denom = reader.string()
        break
      case 2:
        message.amount = reader.string()
        break
      default:
        reader.skipType(tag & 7)
        break
    }
  }
  return message
}

const decodeBalance = (data: Uint8Array) => {
  const reader = new BinaryReader(data)
  const end = reader.len
  let balance = {
    denom: 'usei',
    amount: '0'
  }
  while (reader.pos < end) {
    const tag = reader.uint32()
    switch (tag >>> 3) {
      case 1:
        balance = coinDecode(reader, reader.uint32())
        break
      default:
        reader.skipType(tag & 7)
        break
    }
  }
  return balance
}

const encodeSimulate = (messages: any, sequence: number) => {
  const authInfo = AuthInfo.fromPartial({
    signerInfos: [
      {
        publicKey: Any.fromPartial({
          typeUrl: '/cosmos.crypto.secp256k1.PubKey',
          value: new Uint8Array()
        }),
        modeInfo: {
          single: {mode: 0}
        },
        sequence: BigInt(sequence)
      }
    ],
    fee: Fee.fromPartial({})
  })
  const txBody = TxBody.fromPartial({
    messages: messages,
    memo: ''
  })
  const tx = TxRaw.fromPartial({
    authInfoBytes: AuthInfo.encode(authInfo).finish(),
    bodyBytes: TxBody.encode(txBody).finish(),
    signatures: [new Uint8Array()]
  })
  const txBytes = TxRaw.encode(tx).finish()
  const writer = BinaryWriter.create()
  writer.uint32(18).bytes(txBytes)
  return Buffer.from(writer.finish()).toString('hex')
}

const decodeGas = (data: BinaryReader, length: number) => {
  const reader = data
  let end = length === undefined ? reader.len : reader.pos + length
  const message: any = {}
  while (reader.pos < end) {
    const tag = reader.uint32()
    switch (tag >>> 3) {
      case 1:
        message.gasWanted = reader.uint64()
        break
      case 2:
        message.gasUsed = reader.uint64()
        break
      default:
        reader.skipType(tag & 7)
        break
    }
  }
  return message
}

const decodeSimulate = (data: Uint8Array) => {
  const reader = new BinaryReader(data.slice(0, 6))
  let end = reader.len
  const message: any = {}
  while (reader.pos < end) {
    const tag = reader.uint32()
    switch (tag >>> 3) {
      case 1:
        message.gasInfo = decodeGas(reader, reader.uint32())
        break
      case 2:
        message.result = {}
        break
      default:
        reader.skipType(tag & 7)
        break
    }
  }

  return Number(message.gasInfo.gasUsed)
}

const accountOkla = {
  encode: encodeAccount,
  decode: decodeAccount
}

const balanceOkla = {
  encode: encodeBalance,
  decode: decodeBalance
}

const simulateOkla = {
  encode: encodeSimulate,
  decode: decodeSimulate
}

export {accountOkla, balanceOkla, simulateOkla}
