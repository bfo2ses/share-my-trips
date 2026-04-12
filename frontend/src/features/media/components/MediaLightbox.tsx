import Lightbox, { type Slide } from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import type { DayMediaQuery } from '../../../graphql/generated/graphql';

type Media = DayMediaQuery['dayMedia'][number];

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
    };
  });

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Captions]}
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
                  style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px' }}
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
