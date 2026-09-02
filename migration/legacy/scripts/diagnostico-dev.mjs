// Local startup diagnostics: reports process names and error codes, never env values.
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { errorMonitor } from 'node:events';
import { basename } from 'node:path';

const report = (message) => console.error(`[diagnostico] ${message}`);
report(`Node ${process.version}; Windows ${process.arch}`);
for (const name of ['NODE_OPTIONS', 'VSCODE_INSPECTOR_OPTIONS', 'HTTP_PROXY', 'HTTPS_PROXY', 'WORKERD_BINARY_PATH']) {
  report(`${name}: ${process.env[name] ? 'definida' : 'ausente'}`);
}
const originalSpawn = childProcess.spawn;
childProcess.spawn = function (...args) {
  const label = basename(String(args[0]));
  const child = Reflect.apply(originalSpawn, this, args);
  report(`iniciando ${label}; pid=${child.pid ?? '?'}`);
  child.on('error', (error) => report(`${label}: falha ${error.code ?? error.name}`));
  child.on('exit', (code, signal) => report(`${label}: encerrou; codigo=${code}; sinal=${signal ?? 'nenhum'}`));
  for (const [index, stream] of (child.stdio ?? []).entries()) {
    stream?.on(errorMonitor, (error) => report(`${label}: canal ${index}; erro=${error.code ?? error.name}; codigoSaida=${child.exitCode}`));
  }
  return child;
};
syncBuiltinESMExports();
process.on('uncaughtExceptionMonitor', (error) => report(`falha principal: ${error.code ?? error.name}`));
