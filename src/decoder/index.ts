import {BinaryReader, BinaryWriter} from 'cosmjs-types/binary'
import {Any} from 'cosmjs-types/google/protobuf/any'
import {MsgSend} from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import {MsgExecuteContract} from 'cosmjs-types/cosmwasm/wasm/v1/tx'
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
    accountNumber: 0,
    sequence: 0
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
        message.accountNumber = Number(reader.uint64())
        break
      case 4:
        message.sequence = Number(reader.uint64())
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
    amount: 0
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
    amount: 0
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

const encodeTransferNative = (from: string, to: string, amount: number, denom: string) => {
  return [
    Any.fromPartial({
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: MsgSend.encode(
        MsgSend.fromPartial({
          fromAddress: from,
          toAddress: to,
          amount: [
            {
              amount: String(amount),
              denom: denom
            }
          ]
        })
      ).finish()
    })
  ]
}

const encodeExecuteContract = (sender: string, contractAddress: string, msg: any, funds?: any[]) => {
  return [
    Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: MsgExecuteContract.encode(
        MsgExecuteContract.fromPartial({
          sender: sender,
          contract: contractAddress,
          msg: new TextEncoder().encode(JSON.stringify(msg)),
          funds: [...(funds || [])]
        })
      ).finish()
    })
  ]
}

const accountOkla = {
  encode: encodeAccount,
  decode: decodeAccount
}

const balanceOkla = {
  encode: encodeBalance,
  decode: decodeBalance
}

const encodeDataTx = {encodeTransferNative, encodeExecuteContract}
export {accountOkla, balanceOkla, encodeDataTx}
