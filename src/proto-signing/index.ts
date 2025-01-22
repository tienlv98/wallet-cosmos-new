import { BinaryWriter } from 'cosmjs-types/binary';
import {secp256k1} from 'ethereum-cryptography/secp256k1.js'
import { bigintToUint8Array, rawSecp256k1PubkeyToRawAddress, toBase64, toBech32 } from '../utils';
import {AuthInfo, SignDoc, SignerInfo, TxBody, TxRaw} from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import {Any} from 'cosmjs-types/google/protobuf/any'
import {sha256} from 'ethereum-cryptography/sha256.js'

const privateKeyToKeypair = (privateKey: string) =>{
    const privateKeyBuffer = Buffer.from(privateKey, 'hex')
    const publicKey = secp256k1.getPublicKey(privateKeyBuffer)

    const address = toBech32('sei', rawSecp256k1PubkeyToRawAddress(publicKey))
    return {
      algo: 'secp256k1',
      address,
      publicKey,
      privateKey: privateKeyBuffer
    }
}

export const signDirect = (privateKey: string, messages: any, fee: any, memo?: string, signerData: any, timeoutHeight?: number) => {
  const {accountNumber, sequence, chainId} = signerData

  const accountFromSigner = privateKeyToKeypair(privateKey)
  const writer = BinaryWriter.create()
  writer.uint32(10).bytes(accountFromSigner.publicKey)

  const authInfo = AuthInfo.fromPartial({
    signerInfos: [
      {
        publicKey: Any.fromPartial({
          typeUrl: '/cosmos.crypto.secp256k1.PubKey',
          value: writer.finish()
        }),
        modeInfo: {
          single: {mode: 1}
        },
        sequence: BigInt(sequence)
      }
    ],
    fee: {
      amount: [...fee.amount],
      gasLimit: BigInt(fee.gas)
    }
  })

  const txBody = TxBody.fromPartial({
    memo: memo,
    timeoutHeight: BigInt(timeoutHeight?.toString() ?? '0'),
    messages: messages
  })
  const signDoc = SignDoc.fromPartial({
    accountNumber: accountNumber,
    authInfoBytes: AuthInfo.encode(authInfo).finish(),
    bodyBytes: TxBody.encode(txBody).finish(),
    chainId: chainId
  })

  const signBytes = SignDoc.encode(signDoc).finish()
  const hashedMessage = sha256(signBytes)
  const signature = secp256k1.sign(hashedMessage, accountFromSigner.privateKey)
  const signatureBytes = new Uint8Array([...bigintToUint8Array(signature.r), ...bigintToUint8Array(signature.s)])

  const txRaw = TxRaw.fromPartial({
    bodyBytes: signDoc.bodyBytes,
    authInfoBytes: signDoc.authInfoBytes,
    signatures: [signatureBytes]
  })

  return toBase64(TxRaw.encode(txRaw).finish())
}
