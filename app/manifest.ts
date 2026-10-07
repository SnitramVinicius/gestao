import type {MetadataRoute} from 'next';

export default function manifest():MetadataRoute.Manifest{return {name:'Órbita — Gestão para barbearias',short_name:'Órbita',description:'Agenda, clientes e gestão da sua barbearia.',start_url:'/',display:'standalone',background_color:'#f6f8f4',theme_color:'#173e31',orientation:'portrait-primary',icons:[{src:'/favicon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]}}
