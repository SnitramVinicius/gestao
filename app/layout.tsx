import type {Metadata,Viewport} from 'next';
import './globals.css';
const title='NAVALHY | Gestão para barbearias';
const description='Clientes, agenda e atividades organizados para o dia a dia da sua empresa.';
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'),title,description,manifest:'/manifest.webmanifest',appleWebApp:{capable:true,statusBarStyle:'default',title:'NAVALHY'},icons:{icon:'/navalhy-icon-192.png',apple:'/navalhy-apple-touch.png'},openGraph:{title,description,locale:'pt_BR',type:'website',images:[{url:'/navalhy-logo.png',width:1536,height:1152,alt:'NAVALHY'}]},twitter:{card:'summary_large_image',title,description,images:['/navalhy-logo.png']}};
export const viewport:Viewport={themeColor:'#303437'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>}

