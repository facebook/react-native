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

import chalk from 'chalk';

const SEPARATOR = ', ';

let verbose: boolean = process.argv.includes('--verbose');
let disabled: boolean = false;
let hidden: boolean = false;

const formatMessages = (messages: Array<string>) =>
  chalk.reset(messages.join(SEPARATOR));

const success = (...messages: Array<string>) => {
  if (!disabled) {
    console.log(`${chalk.green.bold('success')} ${formatMessages(messages)}`);
  }
};

const info = (...messages: Array<string>) => {
  if (!disabled) {
    console.log(`${chalk.cyan.bold('info')} ${formatMessages(messages)}`);
  }
};

const warn = (...messages: Array<string>) => {
  if (!disabled) {
    console.warn(`${chalk.yellow.bold('warn')} ${formatMessages(messages)}`);
  }
};

const error = (...messages: Array<string>) => {
  if (!disabled) {
    console.error(`${chalk.red.bold('error')} ${formatMessages(messages)}`);
  }
};

const debug = (...messages: Array<string>) => {
  if (verbose && !disabled) {
    console.log(`${chalk.gray.bold('debug')} ${formatMessages(messages)}`);
  } else {
    hidden = true;
  }
};

const log = (...messages: Array<string>) => {
  if (!disabled) {
    console.log(`${formatMessages(messages)}`);
  }
};

const setVerbose = (level: boolean) => {
  verbose = level;
};

const isVerbose = (): boolean => verbose;

const disable = () => {
  disabled = true;
};

const enable = () => {
  disabled = false;
};

const hasDebugMessages = (): boolean => hidden;

let communityLogger;
try {
  const {logger} = require('@react-native-community/cli-tools');
  logger.debug("Using @react-naive-community/cli-tools' logger");
  communityLogger = logger;
} catch {
  // This is no longer a required dependency in react-native projects, but use it instead of
  // our forked version if it's available. Fail silently otherwise.
}

type Logger = $ReadOnly<{
  debug: (...message: Array<string>) => void,
  error: (...message: Array<string>) => void,
  log: (...message: Array<string>) => void,
  info: (...message: Array<string>) => void,
  warn: (...message: Array<string>) => void,
  ...
}>;

export const logger: Logger = communityLogger ?? {
  success,
  info,
  warn,
  error,
  debug,
  log,
  setVerbose,
  isVerbose,
  hasDebugMessages,
  disable,
  enable,
};

if (communityLogger == null) {
  logger.debug("Using @react-native/communityu-cli-plugin's logger");
}
