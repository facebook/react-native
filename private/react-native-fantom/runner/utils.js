/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as EnvironmentOptions from './EnvironmentOptions';
import {spawn, spawnSync} from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
// $FlowExpectedError[untyped-import]
import {SourceMapConsumer} from 'source-map';

const BUCK_ISOLATION_DIR = 'react-native-fantom-buck-out';

export enum HermesVariant {
  Hermes,
  StaticHermesStable, // Static Hermes Stable
  StaticHermesStaging, // Static Hermes Staging
  StaticHermesExperimental, // Static Hermes Trunk
}

export function getBuckOptionsForHermes(
  variant: HermesVariant,
): $ReadOnlyArray<string> {
  switch (variant) {
    case HermesVariant.Hermes:
      return [];
    case HermesVariant.StaticHermesStable:
      return ['-c hermes.static_hermes=stable'];
    case HermesVariant.StaticHermesStaging:
      return ['-c hermes.static_hermes=staging'];
    case HermesVariant.StaticHermesExperimental:
      return ['-c hermes.static_hermes=trunk'];
  }
}

export function getHermesCompilerTarget(variant: HermesVariant): string {
  switch (variant) {
    case HermesVariant.Hermes:
      return '//xplat/hermes/tools/hermesc:hermesc';
    case HermesVariant.StaticHermesStable:
      return '//xplat/shermes/stable:hermesc';
    case HermesVariant.StaticHermesStaging:
      return '//xplat/shermes/staging:hermesc';
    case HermesVariant.StaticHermesExperimental:
      return '//xplat/static_h:hermesc';
  }
}

export function getBuckModesForPlatform(
  enableRelease: boolean = false,
): $ReadOnlyArray<string> {
  const mode = enableRelease ? 'opt' : 'dev';

  let osPlatform;
  switch (os.platform()) {
    case 'linux':
      osPlatform = `@//arvr/mode/linux/${mode}`;
      break;
    case 'darwin':
      osPlatform =
        os.arch() === 'arm64'
          ? `@//arvr/mode/mac-arm/${mode}`
          : `@//arvr/mode/mac/${mode}`;
      break;
    case 'win32':
      osPlatform = `@//arvr/mode/win/${mode}`;
      break;
    default:
      throw new Error(`Unsupported platform: ${os.platform()}`);
  }

  return ['@//xplat/mode/react-native/granite', osPlatform];
}

export type AsyncCommandResult = {
  originalCommand: string,
  childProcess: ReturnType<typeof spawn>,
  done: Promise<AsyncCommandResult>,
  pid: number,
  status: ?number,
  signal: ?string,
  error: ?Error,
  stdout: ?string,
  stderr: ?string,
};

export type SyncCommandResult = {
  originalCommand: string,
  pid: number,
  status: number,
  signal: ?string,
  error: ?Error,
  stdout: string,
  stderr: string,
};

function isEmpty(value: ?string): boolean {
  return value == null || value === '';
}

export function isRunningFromCI(): boolean {
  return (
    !isEmpty(process.env.SANDCASTLE) || !isEmpty(process.env.GITHUB_ACTIONS)
  );
}

function maybeLogCommand(command: string, args: Array<string>): void {
  if (EnvironmentOptions.logCommands) {
    console.log(`RUNNING \`${command} ${args.join(' ')}\``);
  }
}

export function runCommand(
  command: string,
  args: Array<string>,
): AsyncCommandResult {
  maybeLogCommand(command, args);

  const childProcess = spawn(command, args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `/usr/local/bin:${process.env.PATH ?? ''}`,
    },
  });

  const result: AsyncCommandResult = {
    childProcess,
    done: new Promise(resolve => {
      childProcess.on('close', (code: number, signal: string) => {
        result.status = code;
        result.signal = signal;
        resolve(result);
      });
    }),
    originalCommand: `${command} ${args.join(' ')}`,
    pid: childProcess.pid,
    status: null,
    signal: null,
    error: null,
    stdout: null,
    stderr: null,
  };

  childProcess.on('error', error => {
    result.error = error;
  });

  return result;
}

export function runCommandSync(
  command: string,
  args: Array<string>,
): SyncCommandResult {
  maybeLogCommand(command, args);

  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `/usr/local/bin:${process.env.PATH ?? ''}`,
    },
  });

  return {
    originalCommand: `${command} ${args.join(' ')}`,
    pid: result.pid,
    status: result.status,
    signal: result.signal,
    error: result.error,
    stdout: result.stdout.toString(),
    stderr: result.stderr?.toString() ?? '',
  };
}

export function getDebugInfoFromCommandResult(
  commandResult: SyncCommandResult | AsyncCommandResult,
): string {
  const maybeSignal =
    commandResult.signal != null ? `, signal: ${commandResult.signal}` : '';
  const resultByStatus =
    commandResult.status === 0
      ? 'succeeded'
      : `failed (status code: ${commandResult.status ?? '(empty)'}${maybeSignal})`;

  const logLines = [
    `Command ${resultByStatus}: ${commandResult.originalCommand}`,
    '',
    'stdout:',
    // $FlowExpectedError[sketchy-null-string]
    commandResult.stdout || '(empty)',
    '',
    'stderr:',
    // $FlowExpectedError[sketchy-null-string]
    commandResult.stderr || '(empty)',
  ];

  if (commandResult.error) {
    logLines.push('', 'error:', String(commandResult.error));
  }

  return logLines.join('\n');
}

function getCommandAndArgsWithFDB(
  command: string,
  args: Array<string>,
  useFDB: boolean,
) {
  if (useFDB) {
    return ['fdb', [command].concat(args)];
  } else {
    return [command, args];
  }
}

export function runBuck2(
  args: Array<string>,
  options?: {withFDB: boolean},
): AsyncCommandResult {
  const [actualCommand, actualArgs] = getCommandAndArgsWithFDB(
    'buck2',
    processArgsForBuck(args),
    options?.withFDB ?? false,
  );
  return runCommand(actualCommand, actualArgs);
}

export function runBuck2Sync(
  args: Array<string>,
  options?: {withFDB: boolean},
): SyncCommandResult {
  const [actualCommand, actualArgs] = getCommandAndArgsWithFDB(
    'buck2',
    processArgsForBuck(args),
    options?.withFDB ?? false,
  );
  return runCommandSync(actualCommand, actualArgs);
}

function processArgsForBuck(args: Array<string>): Array<string> {
  // If these tests are already running from withing a buck2 process, e.g. when
  // they are scheduled by a `buck2 test` wrapper, calling `buck2` again would
  // cause a daemon-level deadlock.
  // To prevent this - explicitly pass custom `--isolation-dir`. Reuse the same
  // dir across tests (even running in different jest processes) to properly
  // employ caching.
  if (process.env.BUCK2_WRAPPER != null) {
    return ['--isolation-dir', BUCK_ISOLATION_DIR].concat(args);
  }

  return args;
}

export function getShortHash(contents: string): string {
  return crypto.createHash('md5').update(contents).digest('hex').slice(0, 8);
}

export function symbolicateStackTrace(
  sourceMapPath: string,
  stackTrace: string,
): string {
  const sourceMapData = JSON.parse(fs.readFileSync(sourceMapPath, 'utf8'));
  const consumer = new SourceMapConsumer(sourceMapData);

  return stackTrace
    .split('\n')
    .map(line => {
      const match = line.match(/at (.*) \((.*):(\d+):(\d+)\)/);
      if (match) {
        const functionName = match[1];
        // const fileName = match[2];
        const lineNumber = parseInt(match[3], 10);
        const columnNumber = parseInt(match[4], 10);
        // Get the original position
        const originalPosition = consumer.originalPositionFor({
          line: lineNumber,
          column: columnNumber,
        });
        return `at ${originalPosition.name ?? functionName} (${originalPosition.source}:${originalPosition.line}:${originalPosition.column})`;
      } else {
        return line;
      }
    })
    .join('\n');
}

export type ConsoleLogMessage = {
  type: 'console-log',
  level: 'info' | 'warn' | 'error',
  message: string,
};

export function printConsoleLog(log: ConsoleLogMessage): void {
  if (process.env.SANDCASTLE != null) {
    return;
  }

  switch (log.type) {
    case 'console-log':
      switch (log.level) {
        case 'info':
          console.log(log.message);
          break;
        case 'warn':
          console.warn(log.message);
          break;
        case 'error':
          console.error(log.message);
          break;
      }
      break;
  }
}
