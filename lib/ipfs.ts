export function convertIpfsUrl(ipfsUrl: string): string {
  if (ipfsUrl.startsWith('ipfs://')) {
    const cid = ipfsUrl.replace('ipfs://', '')
    // Using Cloudflare's IPFS gateway for better reliability and speed
    return `https://white-holy-caterpillar-795.mypinata.cloud/ipfs/${cid}`
  }
  return ipfsUrl
}