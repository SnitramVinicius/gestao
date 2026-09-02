import type {Address} from './customer-rules';
export const sectors=['Vidraçaria','Barbearia','Salão de beleza','Clínica','Comércio','Serviços','Outro'] as const;
export const timezones=['America/Sao_Paulo','America/Manaus','America/Rio_Branco','America/Noronha'] as const;
export const weekdays=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
export type Service={id:string;name:string;duration:number;active:boolean};
export type BusinessDay={day:number;enabled:boolean;open:string;close:string;breakStart:string;breakEnd:string};
export type CompanySettings={sector:string;phone:string;email:string;address?:Address;timezone:string;services:Service[];hours:BusinessDay[]};
export function defaultSettings():CompanySettings{return {sector:'',phone:'',email:'',timezone:'America/Sao_Paulo',services:[],hours:weekdays.map((_,day)=>({day,enabled:true,open:'09:00',close:'18:00',breakStart:'',breakEnd:''}))};}
export function storedSettings(raw:unknown):CompanySettings{return typeof raw==='string'?JSON.parse(raw):defaultSettings();}
export function minute(time:string){const [h,m]=time.split(':').map(Number);return h*60+m;}
export function businessDay(date:string,settings:CompanySettings){return settings.hours[new Date(date+'T12:00:00Z').getUTCDay()];}
export function hoursLabel(date:string,settings:CompanySettings){const d=businessDay(date,settings);return !d?'Selecione uma data válida':!d.enabled?'Fechado nesta data':d.open+' às '+d.close+(d.breakStart?' · Intervalo '+d.breakStart+' às '+d.breakEnd:'');}
