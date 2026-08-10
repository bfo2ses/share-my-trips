import type { TravelLegTransport } from '../../../graphql/generated/graphql';
import { transportIconSVG } from '../transport';

interface TransportIconProps {
  transport: TravelLegTransport;
  className?: string;
}

export function TransportIcon({ transport, className }: TransportIconProps) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: transportIconSVG(transport) }} />;
}
