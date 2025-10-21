'use client'

import { useEffect } from 'react'

interface AdSenseProps {
  adSlot: string
  adFormat?: string
  fullWidthResponsive?: boolean
  style?: React.CSSProperties
}

export function AdSense({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  style = { display: 'block' }
}: AdSenseProps) {
  useEffect(() => {
    try {
      // @ts-expect-error - AdSense global variable is injected by Google's script
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, []) 

  return (
    <ins
      className="adsbygoogle"
      style={style}
      data-ad-client="ca-pub-8196212883156501"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive.toString()}
    />
  )
}
