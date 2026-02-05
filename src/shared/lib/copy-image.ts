import { toPng } from 'html-to-image'

/**
 * Copy a DOM element as a PNG image to the clipboard
 */
export async function copyElementAsImage(
  element: HTMLElement,
  ignoreClassName: string = 'copy-image-button'
): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.write) {
    throw new Error('Clipboard API is not available. Copy-to-image requires a secure (HTTPS) context.')
  }

  const dataUrl = await toPng(element, {
    filter: (node) => {
      // Filter out elements with the ignore class
      if (node instanceof Element && node.classList.contains(ignoreClassName)) {
        return false
      }
      return true
    },
    backgroundColor: '#ffffff',
    pixelRatio: 2,
  })

  // Convert data URL to blob (direct base64 decode avoids CSP connect-src restrictions)
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'image/png' })

  // Copy to clipboard
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
