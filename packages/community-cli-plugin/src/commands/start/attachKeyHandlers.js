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

import type {Config} from '@react-native-community/cli-types';
import type TerminalReporter from 'metro/src/lib/TerminalReporter';

import {logger} from '../../utils/logger';
import OpenDebuggerKeyboardHandler from './OpenDebuggerKeyboardHandler';
import chalk from 'chalk';
import execa from 'execa';
import invariant from 'invariant';
import readline from 'readline';
import {ReadStream} from 'tty';

const CTRL_C = '\u0003';
const CTRL_D = '\u0004';
const RELOAD_TIMEOUT = 500;

const throttle = (callback: () => void, timeout: number) => {
  let previousCallTimestamp = 0;
  return () => {
    const currentCallTimestamp = new Date().getTime();
    if (currentCallTimestamp - previousCallTimestamp > timeout) {
      previousCallTimestamp = currentCallTimestamp;
      callback();
    }
  };
};

type KeyEvent = {
  sequence: string,
  name: string,
  ctrl: boolean,
  meta: boolean,
  shift: boolean,
};

export default function attachKeyHandlers({
  cliConfig,
  devServerUrl,
  messageSocket,
  reporter,
}: {
  cliConfig: Config,
  devServerUrl: string,
  messageSocket: $ReadOnly<{
    broadcast: (type: string, params?: Record<string, mixed> | null) => void,
    ...
  }>,
  reporter: TerminalReporter,
}) {
  if (process.stdin.isTTY !== true) {
    logger.debug('Interactive mode is not supported in this environment');
    return;
  }

  readline.emitKeypressEvents(process.stdin);
  setRawMode(true);

  const execaOptions = {
    env: {FORCE_COLOR: chalk.supportsColor ? 'true' : 'false'},
  };

  const reload = throttle(() => {
    logger.info('Reloading connected app(s)...');
    messageSocket.broadcast('reload', null);
  }, RELOAD_TIMEOUT);

  const openDebuggerKeyboardHandler = new OpenDebuggerKeyboardHandler({
    reporter,
    devServerUrl,
  });

  process.stdin.on('keypress', (str: string, key: KeyEvent) => {
    logger.debug(`Key pressed: ${key.sequence}`);

    if (openDebuggerKeyboardHandler.maybeHandleTargetSelection(key.name)) {
      return;
    }

    switch (key.sequence) {
      case 'r':
        reload();
        break;
      case 'd':
        logger.info('Opening Dev Menu...');
        messageSocket.broadcast('devMenu', null);
        break;
      case 'i':
        logger.info('Opening app on iOS...');
        execa(
          'npx',
          [
            'react-native',
            'run-ios',
            ...(cliConfig.project.ios?.watchModeCommandParams ?? []),
          ],
          execaOptions,
        ).stdout?.pipe(process.stdout);
        break;
      case 'a':
        logger.info('Opening app on Android...');
        execa(
          'npx',
          [
            'react-native',
            'run-android',
            ...(cliConfig.project.android?.watchModeCommandParams ?? []),
          ],
          execaOptions,
        ).stdout?.pipe(process.stdout);
        break;
      case 'j':
        // eslint-disable-next-line no-void
        void openDebuggerKeyboardHandler.handleOpenDebugger();
        break;
      case CTRL_C:
      case CTRL_D:
        openDebuggerKeyboardHandler.dismiss();
        logger.info('Stopping server');
        setRawMode(false);
        process.stdin.pause();
        process.emit('SIGINT');
        process.exit();
    }
  });

  logger.log(
    [
      '',
      `${chalk.bold('i')} - run on iOS`,
      `${chalk.bold('a')} - run on Android`,
      `${chalk.bold('r')} - reload app`,
      `${chalk.bold('d')} - open Dev Menu`,
      `${chalk.bold('j')} - open DevTools`,
      '',
    ].join('\n'),
  );
}

function setRawMode(enable: boolean) {
  invariant(
    process.stdin instanceof ReadStream,
    'process.stdin must be a readable stream to modify raw mode',
  );
  process.stdin.setRawMode(enable);
}
