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
import {convertBalanceToWei} from '@wallet/utils'
import {ChainConfigs, COSMOS_DEFAULT_GAS} from '../constants'
import {CosmosClientNew} from '../client'
import {setupBankExtension} from '../client/extension'
import {signDirect} from '../proto-signing'
import {CosmosChainInfo} from '../types'
import {ChainMissingError} from '../utils'
import {encodeDataTx} from '../decoder'
const INFORMATION_C98_API = 'https://superwallet-information-api.coin98.tech'

export class CosmosEngine extends Engine {
  chain?: Chain | undefined
  chainInfo: CosmosChainInfo[] = ChainConfigs
  private defaultGasMultiplier = 1.4
  client: CosmosClientNew & ReturnType<typeof setupBankExtension>
  constructor(_config?: EngineConfiguration) {
    super(_config)
    this.chains = this.initChainSupport()
    this.client = new CosmosClientNew('', [setupBankExtension]) as any
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

  updateConfig(config: EngineConfiguration<any>): void {
    this.config = config
    this.chains = this.initChainSupport()
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
    const config = await this.fetchChainInfo(chain)
    // balance cw20
    // if (this.validateContractAddress({address: asset})) {
    //   return 0
    // }
    this.client.updateConfig({rpc: config.rpc})
    const demon = config.currencies[0].coinMinimalDenom.toLowerCase()

    const {amount} = await this.client.bank.balance(address, demon)
    return amount
  }

  public transfer = async (params: TransferParams<TransferOptions>): Promise<string> => {
    const {transaction, wallet, isEstimateGas, chain} = params
    const {memo = '', amount: amountBalance, to, asset, token} = transaction
    const config = await this.fetchChainInfo(chain)

    this.client.updateConfig({rpc: config.rpc})
    const denom = config.currencies[0].coinMinimalDenom
    const decimal = token?.decimal ?? config.currencies[0]?.coinDecimals
    const amount = convertBalanceToWei(amountBalance, decimal)
    const {accountNumber, sequence} = await this.client.bank.account(wallet.address)
    let rawTransaction: any
    // if (this.validateContractAddress({address: asset})) {
    //   rawTransaction = encodeDataTx.encodeExecuteContract(wallet.address, asset, {
    //     transfer: {
    //       amount: amount,
    //       recipient: to
    //     }
    //   })
    // }
    rawTransaction = encodeDataTx.encodeTransferNative(wallet.address, to, amount, asset || denom)
    let [gasLimit, gasPrice] = [params.gasLimit, params.gasPrice]
    if (!gasLimit) {
      gasLimit = await this.client.bank.simalate(rawTransaction, Number(sequence))
      gasPrice = String(this.defaultGasMultiplier * gasLimit * config.gasPriceStep?.average)
    }
    const fee = {
      gas: String(gasLimit),
      amount: [
        {
          denom: denom,
          amount: String(gasPrice)
        }
      ]
    }
    const signerData = {
      accountNumber,
      sequence,
      chainId: config.chainId
    }
    const signedTransaction = signDirect(wallet.privateKey, rawTransaction, fee, memo, signerData)
    const hash = await this.client.bank.broadcastTx(signedTransaction)
    return hash
  }

  validateContractAddress = (params: ValidateAddressParams): boolean => {
    const prefix = this.getChainInfo(params.chain).bech32Config.bech32PrefixAccAddr
    return params.address?.startsWith(prefix) && params.address?.length - prefix.length === 59
  }

  getChainInfo = (chain: string) => {
    const finalChains = {...CHAIN_DATA, ...(this.config.custom.networks.cosmos || {})}
    const chainData = finalChains[chain]

    return this.chainInfo.find(cInfo => {
      if (chainData) {
        return cInfo.chainId === chainData.chainId || cInfo.chainId === chainData.chain
      }
      return cInfo.chainId === chain
    })
  }

  multipleTransfer<T extends MultipleTransferParams<any>>(params: T): Promise<string> {
    throw new Error('Method not implemented.')
  }
  validateAddress(params: ValidateAddressParams): boolean {
    const prefix = this.getChainInfo(params.chain).bech32Config.bech32PrefixAccAddr
    if ([CHAIN_TYPE.functionX, CHAIN_TYPE.evmos].includes(params.chain ?? '')) {
      const reg = /^(0x)[0-9A-Fa-f]{40}$/
      const isValid = reg.test(params.address)
      if (isValid) return true
    }
    return params.address?.startsWith(prefix) && [39, 59].includes(params.address.length - prefix.length)
  }
  tokens<T extends GetTokensParams>(params: T): Promise<Token[]> {
    throw new Error('Method not implemented.')
  }
  getTokenInfo(_params: GetTokenInfoParams): Promise<Partial<TokenInfo>> {
    throw new Error('Method not implemented.')
  }
  nfts<T extends GetNftParams>(params: T): Promise<Collection[]> {
    throw new Error('Method not implemented.')
  }
  transferNft<T extends TransferNftParams<any>>(params: T): Promise<string> {
    throw new Error('Method not implemented.')
  }
  estimateGas(params: EstimateGasParams): Promise<IGasEstimate> {
    throw new Error('Method not implemented.')
  }
  faucet(_params: FaucetParams): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  history(_params: HistoryParams): Promise<HistoryResponse[]> {
    throw new Error('Method not implemented.')
  }
  hasChain(params: string): boolean {
    throw new Error('Method not implemented.')
  }
  integrationHandle<T extends BaseIntegrationRequest>(request: T, options?: IntegrationHandleOptions<any> | undefined) {
    throw new Error('Method not implemented.')
  }
  hasNftSupported(chain: string): boolean {
    throw new Error('Method not implemented.')
  }

  async fetchChainInfo(chain: string): Promise<CosmosChainInfo> {
    const formatChain = chain.startsWith('sei') ? 'sei' : chain
    const chainInfo = this.getChainInfo(chain) as CosmosChainInfo
    const CHAINS_INCLUDE_API = ['aura', 'sei', 'cosmos', 'injective']
    if (!CHAINS_INCLUDE_API.some(chainApi => chain.startsWith(chainApi))) return chainInfo
    const endpoint = `${INFORMATION_C98_API}/chains/`

    try {
      const configs = await (await fetch(`${endpoint}${formatChain}`)).json()
      if (configs.data) {
        const formatData = Array.isArray(configs.data) ? configs.data : typeof configs.data === 'object' ? Object.values(configs.data) : []
        const findChain = formatData.find((chain: any) => chain.chainId === chainInfo.chainId)
        return findChain || chainInfo
      } else {
        return chainInfo
      }
    } catch (error) {
      return chainInfo
    }
  }
}
