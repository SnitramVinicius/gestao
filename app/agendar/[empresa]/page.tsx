import {PublicBooking} from '../../public-booking';
export default async function BookingPage({params}:{params:Promise<{empresa:string}>}){const {empresa}=await params;return <PublicBooking empresa={empresa}/>;}

