import { CosmosChainInfo } from "../types"
import { ChainConfigsCosmos, COSMOS_DEFAULT_GAS as defaultGasCosmos } from "@wallet/constants"

export const COSMOS_DEFAULT_GAS: Record<string, number | string> = defaultGasCosmos

export const ChainConfigs: CosmosChainInfo[] = ChainConfigsCosmos
