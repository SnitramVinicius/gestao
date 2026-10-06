export type WhatsAppBooking={customer:string;phone:string;service:string;barber?:string;date:string;time:string;company:string};
const dateLabel=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'});
export function whatsAppUrl(phone:string,message:string){const digits=phone.replace(/\D/g,'');const number=digits.startsWith('55')?digits:'55'+digits;return 'https://wa.me/'+number+'?text='+encodeURIComponent(message);}
export function confirmationMessage(item:WhatsAppBooking){return ['Olá, '+item.customer+'! 👋','Seu horário na '+item.company+' foi confirmado.','','📅 '+dateLabel(item.date),'🕐 '+item.time,'✂️ '+item.service,item.barber?'💈 Barbeiro: '+item.barber:'','','Se precisar cancelar ou reagendar, avise a gente. Até lá!'].filter(Boolean).join('\n');}
export function reminderMessage(item:WhatsAppBooking){return ['Olá, '+item.customer+'! Passando para lembrar do seu horário na '+item.company+'.','','📅 '+dateLabel(item.date),'🕐 '+item.time,'✂️ '+item.service,item.barber?'💈 Barbeiro: '+item.barber:'','','Esperamos você!'].filter(Boolean).join('\n');}
export function openWhatsApp(item:WhatsAppBooking,kind:'confirmation'|'reminder'){window.open(whatsAppUrl(item.phone,kind==='confirmation'?confirmationMessage(item):reminderMessage(item)),'_blank','noopener,noreferrer');}

