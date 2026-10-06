import {BookingStatus} from '../../booking-status';
export default async function StatusPage({params}:{params:Promise<{token:string}>}){const {token}=await params;return <BookingStatus token={token}/>;}

