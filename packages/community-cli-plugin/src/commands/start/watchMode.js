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

import readline from 'readline';
import {
  addInteractionListener,
  logger,
  hookStdout,
} from '@react-native-community/cli-tools';
import execa from 'execa';
import chalk from 'chalk';
import {KeyPressHandler} from '../../utils/KeyPressHandler';

const CTRL_C = '\u0003';
const CTRL_Z = '\u0026';

function printWatchModeInstructions() {
  logger.log(
    `${chalk.bold('r')} - reload the app\n${chalk.bold(
      'd',
    )} - open developer menu\n${chalk.bold('i')} - run on iOS\n${chalk.bold(
      'a',
    )} - run on Android`,
  );
}

function enableWatchMode(
  messageSocket: $ReadOnly<{
    broadcast: (type: string, params?: Record<string, mixed> | null) => void,
    ...
  }>,
  ctx: Config,
) {
  // We need to set this to true to catch key presses individually.
  // As a result we have to implement our own method for exiting
  // and other commands (e.g. ctrl+c & ctrl+z)
  // $FlowIgnore[method-unbinding]
  // $FlowFixMe[sketchy-null-mixed]
  if (!process.stdin.setRawMode) {
    logger.debug('Watch mode is not supported in this environment');
    return;
  }

  readline.emitKeypressEvents(process.stdin);

  // $FlowIgnore[prop-missing]
  process.stdin.setRawMode(true);

  // We have no way of knowing when the dependency graph is done loading
  // except by hooking into stdout itself. We want to print instructions
  // right after its done loading.
  const restore: () => void = hookStdout((output: string) => {
    // TODO(T160391951) Replace this string check with a suitable integration point
    // in Metro
    if (output.includes('Fast - Scalable - Integrated')) {
      printWatchModeInstructions();
      restore();
    }
  });

  const onPressAsync = async (key: string) => {
    switch (key) {
      case 'r':
        messageSocket.broadcast('reload', null);
        logger.info('Reloading app...');
        break;
      case 'd':
        messageSocket.broadcast('devMenu', null);
        logger.info('Opening Dev Menu...');
        break;
      case 'i':
        logger.info('Opening app on iOS...');
        execa('npx', [
          'react-native',
          'run-ios',
          ...(ctx.project.ios?.watchModeCommandParams ?? []),
        ]).stdout?.pipe(process.stdout);
        break;
      case 'a':
        logger.info('Opening app on Android...');
        execa('npx', [
          'react-native',
          'run-android',
          ...(ctx.project.android?.watchModeCommandParams ?? []),
        ]).stdout?.pipe(process.stdout);
        break;
      case CTRL_Z:
        process.emit('SIGTSTP', 'SIGTSTP');
        break;
      case CTRL_C:
        process.exit();
    }
  };

  const keyPressHandler = new KeyPressHandler(onPressAsync);
  const listener = keyPressHandler.createInteractionListener();
  addInteractionListener(listener);
  keyPressHandler.startInterceptingKeyStrokes();
}

export default enableWatchMode;
