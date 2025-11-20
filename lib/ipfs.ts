export function convertIpfsUrl(ipfsUrl: string): string {
  if (ipfsUrl.startsWith('ipfs://')) {
    const cid = ipfsUrl.replace('ipfs://', '')
    return `https://ipfs.io/ipfs/${cid}`
  }
  return ipfsUrl
}