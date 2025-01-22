import { IBaseRpc, IExtension } from "../types"

export class CosmosClientNew {
  baseRpc: IBaseRpc
  rpc: string = ''
  constructor(rpc: string, extensionSetups: IExtension[]) {
    this.rpc = rpc
    this.baseRpc = async (method: string, data: any) => {
      const myHeaders = new Headers()
      myHeaders.append('Content-Type', 'application/json')
      const response = await fetch(this.rpc, {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 442326776447,
          method: method,
          params: data
        })
      }).then(item => item.json())
      return response.result
    }

    const extensions = extensionSetups.map(setupExtension => setupExtension(this.baseRpc))
    for (const extension of extensions) {
      for (const [moduleKey, moduleValue] of Object.entries(extension)) {
        (this as any)[moduleKey] = moduleValue
      }
    }
  }

  updateConfig(params: any) {
    this.rpc = params.rpc
  }
}


