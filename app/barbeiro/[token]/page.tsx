import {BarberAgenda} from '../../barber-agenda';
export default async function BarberPage({params}:{params:Promise<{token:string}>}){const {token}=await params;return <BarberAgenda token={token}/>;}

