import {
  BaseIntegrationRequest,
  Chain,
  Collection,
  CreateOrRestoreParams,
  Engine,
  EngineConfiguration,
  EstimateGasParams,
  FaucetParams,
  GetBalancesParams,
  GetNftParams,
  GetTokenInfoParams,
  GetTokensParams,
  HistoryParams,
  HistoryResponse,
  IGasEstimate,
  IntegrationHandleOptions,
  MultipleTransferParams,
  Token,
  TokenInfo,
  TransferNftParams,
  TransferParams,
  ValidateAddressParams,
  Wallet
} from '@wallet/core'
import {CHAIN_DATA, CHAIN_TYPE} from '@wallet/constants'
import {ChainConfigs, COSMOS_DEFAULT_GAS} from '../constants'
import {CosmosClientNew} from '../client'
import {setupBankExtension} from '../client/extension'
import {signDirect} from '../proto-signing'
import {CosmosChainInfo} from '../types'
import {ChainMissingError} from '../utils'
import {encodeDataTx} from '../decoder'

export class CosmosEngine extends Engine {
  chain?: Chain | undefined
  chainInfo: CosmosChainInfo[] = ChainConfigs
  client: CosmosClientNew & ReturnType<typeof setupBankExtension>
  constructor(_config?: EngineConfiguration) {
    super(_config)

    this.client = new CosmosClientNew('dadada', [setupBankExtension]) as any
  }

  initChainSupport() {
    const filteredChains = Object.keys(CHAIN_DATA)
      .filter(chain => {
        const chainData = CHAIN_DATA[chain]
        // Temp for all factory chain
        return chainData?.isCosmos && chainData.isFactory
      })
      .map(chain => CHAIN_DATA[chain])

    const customChains = Object.values({...(this.config.custom.networks.cosmos || {})})
    this.chainInfo = this.chainInfo.concat(customChains)

    const finalChains = [...filteredChains, ...customChains]
    return finalChains
  }

  async createOrRestore(params: CreateOrRestoreParams<any>): Promise<Wallet | Wallet[]> {
    const {name, privateKey, mnemonic, isPrivateKey} = params

    // const path = `m/44'/118'/0'/0/0`
    // const seed = bip39.mnemonicToSeedSync(mnemonic)
    // const keyPair = generateMasterSeedHd(seed, path)
    // const publicKey = rawSecp256k1PubkeyToRawAddress(keyPair.publicKey)
    // const address = toBech32('sei', publicKey)
    // const privateKey = Buffer.from(keyPair.privateKey).toString('hex')

    try {
    } catch (error) {
      throw new Error('Method not implement')
    }
  }

  async getBalance(_params: GetBalancesParams): Promise<string> {
    const {chain, asset, address} = _params
    if (!chain) {
      throw new ChainMissingError()
    }
    // balance cw20
    if (this.validateContractAddress({address: asset})) {
    }
    const demon = this.chainInfo.currencies[0].coinMinimalDenom.toLowerCase()
    const {amount} = await this.client.bank.balance(address, demon)
    return amount
  }

  public transfer = async (params: TransferParams<TransferOptions>): Promise<string> => {
    const {transaction, wallet, isEstimateGas, gasLimit, gasPrice} = params
    const {memo = '', amount, to, asset} = transaction
    const {accountNumber, sequence} = await this.client.bank.account(wallet.address)
    let rawTransaction: any
    if (this.validateContractAddress({address: asset})) {
      rawTransaction = encodeDataTx.encodeExecuteContract(wallet.address, asset, {
        transfer: {
          amount: amount,
          recipient: to
        }
      })
    }
    rawTransaction = encodeDataTx.encodeTransferNative(wallet.address, to, 10000, 'usei')
    const fee = {
      gas: '250000',
      amount: [
        {
          denom: 'usei',
          amount: '37500'
        }
      ]
    }
    const signerData = {
      accountNumber,
      sequence,
      chainId: this.chainInfo.chainId
    }
    const signedTransaction = signDirect(wallet.privateKey, rawTransaction, fee, memo, signerData)
    const hash = await this.client.bank.broadcastTx(signedTransaction)
    return hash
  }

  validateContractAddress = (params: ValidateAddressParams): boolean => {
    const prefix = this.chainInfo.bech32Config.bech32PrefixAccAddr
    return params.address?.startsWith(prefix) && params.address?.length - prefix.length === 59
  }
}
