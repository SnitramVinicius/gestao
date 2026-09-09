import type {Address,AttendanceMode} from './customer-rules';
export const sectors=['Vidraçaria','Mecânica','Personal trainer','Clínica','Barbearia','Salão de beleza'] as const;
export type Sector=typeof sectors[number];
export const timezones=['America/Sao_Paulo','America/Manaus','America/Rio_Branco','America/Noronha'] as const;
export const weekdays=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
export const moduleNames={agenda:'Agenda',customers:'Clientes',quotes:'Orçamentos',orders:'Ordens de serviço',routes:'Visitas e rotas',professionals:'Profissionais',resources:'Salas e recursos',inventory:'Estoque',plans:'Planos e evolução'} as const;
export type ModuleId=keyof typeof moduleNames;
export type PricingModel='fixed'|'monthly'|'quote';
export type Service={id:string;name:string;description:string;duration:number;price:number;pricingModel:PricingModel;active:boolean};
export type TeamMember={id:string;name:string;role:string;phone:string;email:string;active:boolean};
export type BusinessDay={day:number;enabled:boolean;open:string;close:string;breakStart:string;breakEnd:string};
export type CompanySettings={sector:string;phone:string;email:string;address?:Address;timezone:string;services:Service[];hours:BusinessDay[];modules:ModuleId[];hasTeam:boolean;team:TeamMember[];onboardingComplete:boolean};
type Template={description:string;mode:AttendanceMode;modules:ModuleId[];services:Array<[string,number,PricingModel?]>};
const genericTemplate:Template={description:'Agenda, clientes, serviços e organização do dia a dia.',mode:'business',modules:['agenda','customers','quotes','orders'],services:[]};
export const sectorTemplates:Record<Sector,Template>={
 'Vidraçaria':{description:'Visitas, medidas, orçamentos e instalações.',mode:'customer',modules:['agenda','customers','quotes','orders','routes'],services:[['Visita técnica',60],['Medição',60],['Instalação',120,'quote'],['Manutenção',60,'quote']]},
 'Mecânica':{description:'Veículos, diagnósticos, serviços e peças.',mode:'business',modules:['agenda','customers','quotes','orders','inventory'],services:[['Diagnóstico',60],['Troca de óleo',45],['Revisão',120],['Manutenção',120]]},
 'Personal trainer':{description:'Alunos, avaliações, treinos e evolução.',mode:'both',modules:['agenda','customers','professionals','plans'],services:[['Avaliação física',60],['Treino individual',60],['Treino em dupla',60],['Acompanhamento mensal',60,'monthly']]},
 'Clínica':{description:'Pacientes, profissionais, consultas e salas.',mode:'business',modules:['agenda','customers','professionals','resources'],services:[['Primeira consulta',60],['Consulta',45],['Retorno',30],['Procedimento',60]]},
 'Barbearia':{description:'Clientes, barbeiros, serviços e cadeiras.',mode:'business',modules:['agenda','customers','professionals','resources'],services:[['Corte',45],['Barba',30],['Corte e barba',60],['Plano mensal de corte',45,'monthly']]},
 'Salão de beleza':{description:'Clientes, profissionais e serviços de beleza.',mode:'business',modules:['agenda','customers','professionals','resources','inventory'],services:[['Corte',60],['Escova',45],['Coloração',120],['Manicure',60]]}
};
export function knownSector(value:string):Sector|undefined{return sectors.find(sector=>sector.toLocaleLowerCase('pt-BR')===value.trim().toLocaleLowerCase('pt-BR'));}
export function templateFor(sector:string):Template{const known=knownSector(sector);return known?sectorTemplates[known]:genericTemplate;}
export function servicesFor(sector:string):Service[]{return templateFor(sector).services.map(([name,duration,pricingModel='fixed'],i)=>({id:sector.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)+'-'+i,name,description:'',duration,price:0,pricingModel,active:true}))}
export function defaultSettings():CompanySettings{return {sector:'',phone:'',email:'',timezone:'America/Sao_Paulo',services:[],modules:['agenda','customers'],hasTeam:false,team:[],onboardingComplete:false,hours:weekdays.map((_,day)=>({day,enabled:day!==0,open:'09:00',close:'18:00',breakStart:'',breakEnd:''}))};}
export function storedSettings(raw:unknown):CompanySettings{let parsed:Partial<CompanySettings>={};try{parsed=typeof raw==='string'?JSON.parse(raw):raw&&typeof raw==='object'?raw as Partial<CompanySettings>:{};}catch{}const base=defaultSettings(),services=Array.isArray(parsed.services)?parsed.services.map(service=>({...service,description:service.description??'',price:Number(service.price??0),pricingModel:service.pricingModel??'fixed'})):base.services,team=Array.isArray(parsed.team)?parsed.team:base.team;return {...base,...parsed,services,team,hasTeam:parsed.hasTeam===true,hours:Array.isArray(parsed.hours)&&parsed.hours.length===7?parsed.hours:base.hours,modules:Array.isArray(parsed.modules)?parsed.modules:base.modules,onboardingComplete:parsed.onboardingComplete===true};}
export function minute(time:string){const [h,m]=time.split(':').map(Number);return h*60+m;}
export function businessDay(date:string,settings:CompanySettings){return settings.hours[new Date(date+'T12:00:00Z').getUTCDay()];}
export function hoursLabel(date:string,settings:CompanySettings){const d=businessDay(date,settings);return !d?'Selecione uma data válida':!d.enabled?'Fechado nesta data':d.open+' às '+d.close+(d.breakStart?' · Intervalo '+d.breakStart+' às '+d.breakEnd:'');}
