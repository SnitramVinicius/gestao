export type AttendanceMode = 'customer' | 'business' | 'both';
export type VisitLocation = 'customer' | 'business';
export type Address = { street: string; number: string; neighborhood: string; city: string; state: string; postalCode: string; complement: string };
export type Client = { id: string; name: string; phone: string; address?: Address; notes?:string; preferredProfessional?:string; version: number; createdAt?: string };
export const attendanceLabels: Record<AttendanceMode, string> = {customer:'No endereço do cliente',business:'No estabelecimento',both:'Nos dois locais'};
export const emptyAddress: Address = {street:'',number:'',neighborhood:'',city:'',state:'',postalCode:'',complement:''};
const states = new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));
export function readAddress(data: FormData): Address {
  const text = (name: string) => String(data.get(name) ?? '').trim();
  return {street:text('street'),number:text('number'),neighborhood:text('neighborhood'),city:text('city'),state:text('state').toUpperCase(),postalCode:text('postalCode'),complement:text('complement')};
}
export function hasAddress(address?: Address): boolean {return !!address && Object.values(address).some(value => value.trim() !== '');}
export function addressError(address?: Address): string | null {
  if (!address || !address.street.trim() || !address.number.trim() || !address.neighborhood.trim() || !address.city.trim() || !address.state.trim()) return 'Preencha rua, número (ou s/n), bairro, cidade e UF do endereço.';
  if (!states.has(address.state.toUpperCase())) return 'Informe uma UF válida, como SP, RJ ou MG.';
  if (address.postalCode.trim() && !/^\d{5}-?\d{3}$/.test(address.postalCode.trim())) return 'Informe um CEP com 8 dígitos ou deixe esse campo em branco.';
  return null;
}
export function clientError(name: string, phone: string, address: Address | undefined, mode: AttendanceMode): string | null {
  if (!name.trim()) return 'Informe o nome do cliente.';
  if (!/^[+()\d\s-]+$/.test(phone) || !/^\d{10,13}$/.test(phone.replace(/\D/g,''))) return 'Informe um telefone válido com DDD.';
  return mode === 'customer' || hasAddress(address) ? addressError(address) : null;
}
export function resolveVisit(mode: AttendanceMode, requested: string, address?: Address): {location: VisitLocation; address?: Address} {
  const location = mode === 'both' ? requested : mode;
  if (location !== 'customer' && location !== 'business') throw new Error('Escolha onde será o atendimento.');
  if (location === 'business') return {location};
  const error = addressError(address);
  if (error) throw new Error('Complete o endereço no cadastro do cliente antes de agendar uma visita. ' + error);
  return {location, address: {...address!}};
}
export function formatAddress(address?: Address): string {
  if (!hasAddress(address)) return 'Endereço não informado';
  return [address!.street + ', ' + address!.number, address!.complement, address!.neighborhood, address!.city + ' / ' + address!.state, address!.postalCode].filter(Boolean).join(' · ');
}

// Universal Google Maps URL: https://developers.google.com/maps/documentation/urls/get-started#directions
export function mapsDirectionsUrl(location: VisitLocation, address?: Address): string | null {
  if (location !== 'customer' || !address || addressError(address)) return null;
  // Apartment / access references remain in the agenda; Maps needs the street destination.
  const destination = [address.street.trim() + ', ' + address.number.trim(), address.neighborhood.trim(), address.city.trim() + ' - ' + address.state.toUpperCase(), address.postalCode.trim(), 'Brasil'].filter(Boolean).join(', ');
  const url = new URL('https://www.google.com/maps/dir/');
  url.search = new URLSearchParams({api:'1',destination,travelmode:'driving',dir_action:'navigate'}).toString();
  return url.href.length <= 2048 ? url.href : null;
}

