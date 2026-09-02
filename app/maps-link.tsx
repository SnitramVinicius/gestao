import {Navigation} from 'lucide-react';
import {buttonVariants} from '@/components/ui/button';
import {mapsDirectionsUrl,type Address,type VisitLocation} from '@/lib/customer-rules';
export function MapsLink({location,address,status,customerName}:{location:VisitLocation;address?:Address;status:string;customerName?:string}) {
  const href=mapsDirectionsUrl(location,address);
  if(!href || status==='Cancelado') return null;
  return <a href={href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className={buttonVariants({variant:'outline',size:'sm'})+' maps-link'} aria-label={`Abrir rota no Google Maps${customerName?' para '+customerName:''} (nova aba)`}><Navigation aria-hidden="true"/>Abrir rota no Maps</a>;
}
