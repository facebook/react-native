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

import {KeyPressHandler} from '../../utils/KeyPressHandler';
import {logger} from '../../utils/logger';
import chalk from 'chalk';
import execa from 'execa';
import fetch from 'node-fetch';

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

  const execaOptions = {
    env: {FORCE_COLOR: chalk.supportsColor ? 'true' : 'false'},
  };

  const reload = throttle(() => {
    logger.info('Reloading connected app(s)...');
    messageSocket.broadcast('reload', null);
  }, RELOAD_TIMEOUT);

  const onPress = async (key: string) => {
    switch (key.toLowerCase()) {
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
        // TODO(T192878199): Add multi-target selection
        await fetch(devServerUrl + '/open-debugger', {method: 'POST'});
        break;
      case CTRL_C:
      case CTRL_D:
        logger.info('Stopping server');
        keyPressHandler.stopInterceptingKeyStrokes();
        process.emit('SIGINT');
        process.exit();
    }
  };

  const keyPressHandler = new KeyPressHandler(onPress);
  keyPressHandler.createInteractionListener();
  keyPressHandler.startInterceptingKeyStrokes();

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
