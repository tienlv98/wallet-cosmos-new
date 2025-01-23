import type { KeyType, Wallet } from '@wallet/core';

export interface IAccountInfo {
  address: string
  pubKey: {
    typeUrl: string
    value: Uint8Array
  }
  accountNumber: bigint
  sequence: bigint
}

export interface BankExtension {
  readonly bank: {
    readonly balance: (address: string, denom: string) => Promise<any>
    readonly broadcastTx: (rawtx: string) => Promise<string>
    readonly account: (address: string) => Promise<IAccountInfo>
    readonly simalate: (messages: any, sequence: number) => Promise<number>
  }
}

export type IBaseRpc = (method: string, data: any) => any

export type IExtension = (client: IBaseRpc) => BankExtension


export type CreateOrRestoreGeneric = {
    isOldStandard?: boolean
    passwordTerraStation?:string 
}

export interface Currency {
   coinDenom: string
   coinMinimalDenom: string
   coinDecimals: number
   image?: string
   coinGeckoId?: string
   gasPriceStep?: Record<string, number | string>
}

export interface TokenCurrency extends Currency{
   balance: string
   rawBalance?: string
}

export interface IBIP44 {
   coinType: string | number
}

export interface IBech32 {
   bech32PrefixAccAddr: string
   bech32PrefixAccPub: string
   bech32PrefixValAddr: string
   bech32PrefixValPub: string
   bech32PrefixConsAddr: string
   bech32PrefixConsPub: string
}

export interface CosmosChainInfo {
   rpc: string
   rpcConfig?: any
   rest: string
   restConfig?: any
   chainId: string
   chainName: string

   

   // More Chain Info
   stakeCurrency: Currency
   walletetUrlForStaking?: string
   bip44: IBIP44
   bech32Config: IBech32
   currencies: Currency[]
   
   
   //Optional
   isEthereum?: boolean //Support EIP712 transfer throught Ethermint
   beta?: boolean
   walletUrl?:  string
   walletUrlForStaking?: string
   faucets?: string | string[]
   feeCurrencies: Currency[]
   coinType?: string | number
   alternativeBIP44s?: IBIP44[]
   features?: string[]
   gasPriceStep?: {
       low: string | number
       average: string | number
       high: string | number
   },
   defaultFee?: number


   chainSymbolImageUrl?: string
   // Coin98 Exclusive Fields
   disable?: boolean
}

export interface GetKeyParams {
   mnemonic?: KeyType
   privateKey?: KeyType
}

export interface TxLegacyResponse {
   tx_response: {
       height: string,
       txhash: string,
       codespace: string,
       code: number,
       data: string,
       raw_log: string,
       logs: string | string[],
       info: string,
       gas_wanted: '0',
       gas_used: '0',
       tx: null,
       timestamp: string,
       events: string | string[]
   }
}

export interface TxResponse {
   result: {
       hash?:string
       height: string,
       txhash: string,
       codespace: string,
       code: number,
       data: string,
       raw_log: string,
       logs: string | string[],
       info: string,
       gas_wanted: '0',
       gas_used: '0',
       tx: null,
       timestamp: string,
       events: string | string[]
   }
}


export const FEATURES  = {
   IBCGo: 'ibc-go',
   IBCTransfer: 'ibc-transfer',
   Cosmwasm: 'cosmwasm',
   Secretwasm: 'secretwasm'
}

export interface TransferCw20{
   amount: string,
   to: string,
   wallet: Wallet,
   isEstimateGas?: boolean
   gasLimit?: number
   gasPrice?: string,
   contractAddress: string
}

export const TYPE = {
 send: 'send',
 executeContract: 'executeContract'
}

export const MSG_TYPE = {
 '/cosmos.bank.v1beta1.MsgSend': TYPE.send
}

