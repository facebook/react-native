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

import {
  addInteractionListener,
  logger,
} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import execa from 'execa';
import fetch from 'node-fetch';
import readline from 'readline';
import {KeyPressHandler} from '../../utils/KeyPressHandler';

const CTRL_C = '\u0003';
const CTRL_Z = '\u0026';

export default function attachKeyHandlers({
  cliConfig,
  devServerUrl,
  messageSocket,
}: {
  cliConfig: Config,
  devServerUrl: string,
  messageSocket: $ReadOnly<{
    broadcast: (type: string, params?: Record<string, mixed> | null) => void,
    ...
  }>,
}) {
  if (process.stdin.isTTY !== true) {
    logger.debug('Interactive mode is not supported in this environment');
    return;
  }

  readline.emitKeypressEvents(process.stdin);
  // $FlowIgnore[prop-missing]
  process.stdin.setRawMode(true);

  const execaOptions = {
    env: {FORCE_COLOR: chalk.supportsColor ? 'true' : 'false'},
  };

  const onPress = async (key: string) => {
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
        await fetch(devServerUrl + '/open-debugger', {method: 'POST'});
        break;
      case CTRL_Z:
        process.emit('SIGTSTP', 'SIGTSTP');
        break;
      case CTRL_C:
        process.exit();
    }
  };

  const keyPressHandler = new KeyPressHandler(onPress);
  const listener = keyPressHandler.createInteractionListener();
  addInteractionListener(listener);
  keyPressHandler.startInterceptingKeyStrokes();

  logger.log(
    '\n' +
      [
        `${chalk.bold('i')} - run on iOS`,
        `${chalk.bold('a')} - run on Android`,
        `${chalk.bold('d')} - open Dev Menu`,
        `${chalk.bold('j')} - open debugger`,
        `${chalk.bold('r')} - reload app`,
      ].join('\n'),
  );
}
