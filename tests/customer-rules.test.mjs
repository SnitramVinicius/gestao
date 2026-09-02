import test from 'node:test';
import assert from 'node:assert/strict';
import {clientError,resolveVisit,readAddress,emptyAddress,addressError,formatAddress} from '../lib/customer-rules.ts';
const complete={street:'Rua Exemplo',number:'s/n',neighborhood:'Centro',city:'São Paulo',state:'SP',postalCode:'',complement:''};
test('atendimento no cliente exige endereço; estabelecimento e ambos permitem cadastro sem ele',()=>{
 assert.match(clientError('Ana','11999999999',undefined,'customer'),/Preencha rua/);
 for(const mode of ['business','both']) assert.equal(clientError('Ana','11999999999',undefined,mode),null);
 assert.equal(clientError('Ana','11999999999',complete,'customer'),null);
});
test('endereço opcional parcialmente preenchido deve ser completado',()=>{
 assert.match(clientError('Ana','11999999999',{...emptyAddress,street:'Rua X'},'both'),/Preencha rua/);
 assert.match(clientError('Ana','11999999999',{...complete,state:'XX'},'customer'),/UF válida/);
 assert.match(addressError({...complete,postalCode:'123'}),/CEP/);
 assert.equal(addressError({...complete,postalCode:'01001-000'}),null);
});
test('nome vazio e telefone sem DDD ou letras são rejeitados',()=>{
 assert.match(clientError('  ','11999999999',undefined,'business'),/nome/);
 for(const phone of ['123','abcdefghij','11999999abc']) assert.match(clientError('Ana',phone,undefined,'business'),/telefone/);
});
test('ambos exige endereço apenas na visita externa; não aceita local inválido',()=>{
 assert.deepEqual(resolveVisit('both','business'),{location:'business'});
 assert.throws(()=>resolveVisit('both','customer'),/Complete o endereço/);
 assert.throws(()=>resolveVisit('both','invalid',complete),/Escolha onde/);
 assert.deepEqual(resolveVisit('both','customer',complete),{location:'customer',address:complete});
});
test('modalidade única não pode ser contornada pelo valor enviado pelo formulário',()=>{
 assert.throws(()=>resolveVisit('customer','business'),/Complete o endereço/);
 assert.equal(resolveVisit('customer','business',complete).location,'customer');
 assert.deepEqual(resolveVisit('business','customer',complete),{location:'business'});
});
test('a visita preserva o destino mesmo quando o endereço do cliente é editado',()=>{
 const source={...complete};const visit=resolveVisit('customer','',source);
 source.street='Outra rua';
 assert.equal(visit.address.street,'Rua Exemplo');
 assert.notStrictEqual(visit.address,source);
 assert.equal(resolveVisit('business','',source).address,undefined);
 assert.equal(source.street,'Outra rua');
});
test('leitura normaliza espaços e UF; exibição inclui complemento',()=>{
 const data=new FormData();for(const [key,value] of Object.entries({...complete,state:' sp ',complement:' Bloco B '}))data.set(key,value);
 const address=readAddress(data);assert.equal(address.state,'SP');assert.equal(address.complement,'Bloco B');assert.match(formatAddress(address),/Bloco B/);
});
