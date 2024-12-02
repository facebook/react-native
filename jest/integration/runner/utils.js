/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import {spawnSync} from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
// $FlowExpectedError[untyped-import]
import {extract, parse} from 'jest-docblock';
import os from 'os';
// $FlowExpectedError[untyped-import]
import {SourceMapConsumer} from 'source-map';

type DocblockPragmas = {[key: string]: string | string[]};
type FantomTestMode = 'dev' | 'opt';
type FantomTestConfig = {
  mode: FantomTestMode,
};

const DEFAULT_MODE: FantomTestMode = 'dev';

/**
 * Extracts the Fantom configuration from the test file, specified as part of
 * the docblock comment. E.g.:
 *
 * ```
 * /**
 *  * @flow strict-local
 *  * @fantom mode:opt
 *  *
 * ```
 *
 * So far the only supported option is `mode`, which can be 'dev' or 'opt'.
 */
export function getFantomTestConfig(testPath: string): FantomTestConfig {
  const docblock = extract(fs.readFileSync(testPath, 'utf8'));
  const pragmas = parse(docblock) as DocblockPragmas;

  const config = {
    mode: DEFAULT_MODE,
  };

  const maybeMode = pragmas.fantom_mode;

  if (maybeMode != null) {
    if (Array.isArray(maybeMode)) {
      throw new Error('Expected a single value for @fantom_mode');
    }

    const mode = maybeMode;

    if (mode === 'dev' || mode === 'opt') {
      config.mode = mode;
    } else {
      throw new Error(`Invalid Fantom mode: ${mode}`);
    }
  }

  return config;
}

export function getBuckModeForPlatform(enableRelease: boolean = false): string {
  const mode = enableRelease ? 'opt' : 'dev';

  switch (os.platform()) {
    case 'linux':
      return `@//arvr/mode/linux/${mode}`;
    case 'darwin':
      return os.arch() === 'arm64'
        ? `@//arvr/mode/mac-arm/${mode}`
        : `@//arvr/mode/mac/${mode}`;
    case 'win32':
      return `@//arvr/mode/win/${mode}`;
    default:
      throw new Error(`Unsupported platform: ${os.platform()}`);
  }
}

type SpawnResultWithOriginalCommand = {
  ...ReturnType<typeof spawnSync>,
  originalCommand: string,
  ...
};

export function runBuck2(args: Array<string>): SpawnResultWithOriginalCommand {
  const result = spawnSync('buck2', args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `/usr/local/bin:${process.env.PATH ?? ''}`,
    },
  });

  return {
    ...result,
    originalCommand: `buck2 ${args.join(' ')}`,
  };
}

export function getDebugInfoFromCommandResult(
  commandResult: SpawnResultWithOriginalCommand,
): string {
  const logLines = [
    `Command ${commandResult.status === 0 ? 'succeeded' : 'failed'}: ${commandResult.originalCommand}`,
    '',
    'stdout:',
    commandResult.stdout,
    '',
    'stderr:',
    commandResult.stderr,
  ];

  if (commandResult.error) {
    logLines.push('', 'error:', String(commandResult.error));
  }

  return logLines.join('\n');
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
