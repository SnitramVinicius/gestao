import type {Metadata} from 'next';
import './globals.css';
const title='Órbita | Seu negócio em movimento';
const description='Piloto de clientes, visitas técnicas e acompanhamento de propostas para uma vidraçaria.';
export const metadata:Metadata={metadataBase:new URL('https://orbita-ia-operacional-pires.fernandoventemillhas.chatgpt.site'),title,description,icons:{icon:'/favicon.svg'},openGraph:{title,description,locale:'pt_BR',type:'website',images:[{url:'/og.png',width:1731,height:909,alt:'Órbita. Seu negócio, em movimento.'}]},twitter:{card:'summary_large_image',title,description,images:['/og.png']}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>}

