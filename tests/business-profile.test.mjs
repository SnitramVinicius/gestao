import test from 'node:test';import assert from 'node:assert/strict';
import {businessProfile} from '../lib/business-profile.ts';
test('known sectors receive their own vocabulary',()=>{assert.equal(businessProfile('Clínica odontológica').customers,'Pacientes');assert.equal(businessProfile('Personal trainer').agenda,'Treinos');assert.equal(businessProfile('Oficina mecânica').workPlural,'Ordens de serviço');assert.equal(businessProfile('Vidraçaria').newWork,'Novo pedido');});
test('new sectors receive safe generic vocabulary',()=>{const profile=businessProfile('Pet shop');assert.equal(profile.customers,'Clientes');assert.equal(profile.workPlural,'Solicitações');assert.equal(profile.siteLabel,'Local do atendimento');});
