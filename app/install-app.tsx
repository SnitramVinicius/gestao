'use client';
import {useEffect,useState} from 'react';
import {Download} from 'lucide-react';

type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
export function InstallApp(){const [prompt,setPrompt]=useState<InstallEvent|null>(null),[ios,setIos]=useState(false),[message,setMessage]=useState('');useEffect(()=>{if('serviceWorker'in navigator)void navigator.serviceWorker.register('/sw.js');setIos(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!('standalone'in navigator&&Boolean((navigator as Navigator&{standalone?:boolean}).standalone)));const capture=(event:Event)=>{event.preventDefault();setPrompt(event as InstallEvent)};window.addEventListener('beforeinstallprompt',capture);return()=>window.removeEventListener('beforeinstallprompt',capture)},[]);if(!prompt&&!ios)return null;return <div className="install-app"><button onClick={async()=>{if(prompt){await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted')setPrompt(null);}else setMessage('No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.');}}><Download/>Instalar aplicativo</button>{message&&<span>{message}</span>}</div>}
