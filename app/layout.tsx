import type {Metadata,Viewport} from 'next';
import './globals.css';
const title='Órbita | Seu negócio em movimento';
const description='Clientes, agenda e atividades organizados para o dia a dia da sua empresa.';
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'),title,description,manifest:'/manifest.webmanifest',appleWebApp:{capable:true,statusBarStyle:'default',title:'Órbita'},icons:{icon:'/favicon.svg',apple:'/favicon.svg'},openGraph:{title,description,locale:'pt_BR',type:'website',images:[{url:'/og.png',width:1731,height:909,alt:'Órbita. Seu negócio, em movimento.'}]},twitter:{card:'summary_large_image',title,description,images:['/og.png']}};
export const viewport:Viewport={themeColor:'#173e31'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>}

