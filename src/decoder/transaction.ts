import {Any} from 'cosmjs-types/google/protobuf/any'
import {MsgSend} from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import {MsgExecuteContract} from 'cosmjs-types/cosmwasm/wasm/v1/tx'

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

const encodeDataTx = {encodeTransferNative, encodeExecuteContract}
export {encodeDataTx}
