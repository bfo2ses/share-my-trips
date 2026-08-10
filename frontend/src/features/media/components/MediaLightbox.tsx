import Lightbox, { type Slide } from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Download from 'yet-another-react-lightbox/plugins/download';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import type { Media } from '../../../graphql/generated/graphql';

interface MediaLightboxProps {
  media: Media[];
  index: number;
  open: boolean;
  onClose: () => void;
}

export function MediaLightbox({ media, index, open, onClose }: MediaLightboxProps) {
  const slides: Slide[] = media.map((m) => {
    if (m.contentType.startsWith('video/')) {
      return {
        type: 'custom-video' as unknown as undefined,
        src: m.url,
        contentType: m.contentType,
        caption: m.caption ?? undefined,
        description: m.caption ?? undefined,
      } as Slide;
    }
    return {
      src: m.url,
      alt: m.caption ?? m.filename,
      description: m.caption ?? undefined,
      download: { url: m.url, filename: m.filename },
    };
  });

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Captions, Download]}
      labels={{ Download: 'Télécharger' }}
      controller={{ closeOnPullDown: true }}
      render={{
        slide: ({ slide }) => {
          const s = slide as Slide & { contentType?: string };
          if (s.contentType?.startsWith('video/')) {
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <video
                  src={s.src}
                  controls
                  autoPlay
                  style={{ maxWidth: '100%', maxHeight: '80svh', borderRadius: '8px' }}
                />
              </div>
            );
          }
          return undefined;
        },
      }}
    />
  );
}
