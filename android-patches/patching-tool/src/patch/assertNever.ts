import {log} from '../logger';
export function assertNever(x: never): never {
  log.error("assertNever", "Unexpected object: " + x);
  throw new Error("Unexpected object: " + x)
}
