import { balanceOkla, accountOkla } from '../decoder'
import {IBaseRpc, BankExtension} from '../types'
import {decodeAbciQuery} from '../utils'

export const setupBankExtension = (client: IBaseRpc): BankExtension => {
  return {
    bank: {
      balance: async (address: string, denom: string) => {
        const dataRequest = balanceOkla.encode(address,denom)
        const rawData = await client('abci_query', {
          path: '/cosmos.bank.v1beta1.Query/Balance',
          data: dataRequest,
          prove: false
        })
        const dataRaw = decodeAbciQuery(rawData)
        return balanceOkla.decode(dataRaw.value)
      },
      broadcastTx: async rawTx => {
        const rawData = await client('broadcast_tx_sync', {
          tx: rawTx
        })
        return rawData.hash
      },
      account: async (address: string) => {
        const dataRequest = accountOkla.encode(address)
        const rawData = await client('abci_query', {
          path: '/cosmos.auth.v1beta1.Query/Account',
          data: dataRequest,
          prove: false
        })
        const dataRaw = decodeAbciQuery(rawData)
        return accountOkla.decode(dataRaw.value)
      }
    }
  }
}