import type { Media } from '../data/portfolio'

export const isVideo = (src: string) => /\.(mp4|webm)$/i.test(src)

/**
 * Shows a project screenshot, GIF or screen recording.
 * Videos (.mp4 / .webm) play like a GIF — muted, looping, inline — but stay
 * much sharper and smaller than GIFs, so prefer them for recordings.
 */
export function MediaView({
  media,
  className,
  style,
  decorative = false,
}: {
  media: Media
  className?: string
  style?: React.CSSProperties
  decorative?: boolean
}) {
  if (isVideo(media.src)) {
    return (
      <video
        src={media.src}
        className={className}
        style={style}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={decorative ? undefined : media.alt}
        aria-hidden={decorative || undefined}
      />
    )
  }
  return <img src={media.src} alt={decorative ? '' : media.alt} loading="lazy" decoding="async" className={className} style={style} />
}
