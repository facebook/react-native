/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const config = require('./core');

const assertRequiredOptions = require('./util/assertRequiredOptions');
const chalk = require('chalk');
const childProcess = require('child_process');
const commander = require('commander');
const commands = require('./commands');
const init = require('./init/init');
const path = require('path');
const pkg = require('../package.json');

import type {CommandT} from './commands';
import type {ConfigT} from './core';

commander.version(pkg.version);

const defaultOptParser = (val) => val;

const handleError = (err) => {
  console.error();
  console.error(err.message || err);
  console.error();
  process.exit(1);
};

// Custom printHelpInformation command inspired by internal Commander.js
// one modified to suit our needs
function printHelpInformation() {
  let cmdName = this._name;
  if (this._alias) {
    cmdName = cmdName + '|' + this._alias;
  }

  const sourceInformation = this.pkg
    ? [
      `  ${chalk.bold('Source:')} ${this.pkg.name}@${this.pkg.version}`,
      '',
    ]
    : [];

  let output = [
    '',
    chalk.bold(chalk.cyan((`  react-native ${cmdName} ${this.usage()}`))),
    `  ${this._description}`,
    '',
    ...sourceInformation,
    `  ${chalk.bold('Options:')}`,
    '',
    this.optionHelp().replace(/^/gm, '    '),
    '',
  ];

  if (this.examples && this.examples.length > 0) {
    const formattedUsage = this.examples.map(
      example => `    ${example.desc}: \n    ${chalk.cyan(example.cmd)}`,
    ).join('\n\n');

    output = output.concat([
      chalk.bold('  Example usage:'),
      '',
      formattedUsage,
    ]);
  }

  return output.concat([
    '',
    '',
  ]).join('\n');
}

function printUnknownCommand(cmdName) {
  console.log([
    '',
    cmdName
      ? chalk.red(`  Unrecognized command '${cmdName}'`)
      : chalk.red('  You didn\'t pass any command'),
    `  Run ${chalk.cyan('react-native --help')} to see list of all available commands`,
    '',
  ].join('\n'));
}

const addCommand = (command: CommandT, cfg: ConfigT) => {
  const options = command.options || [];

  const cmd = commander
    .command(command.name, undefined, {
      noHelp: !command.description,
    })
    .description(command.description)
    .action(function runAction() {
      const passedOptions = this.opts();
      const argv: Array<string> = Array.from(arguments).slice(0, -1);

      Promise.resolve()
        .then(() => {
          assertRequiredOptions(options, passedOptions);
          return command.func(argv, cfg, passedOptions);
        })
        .catch(handleError);
    });

    cmd.helpInformation = printHelpInformation.bind(cmd);
    cmd.examples = command.examples;
    cmd.pkg = command.pkg;

  options
    .forEach(opt => cmd.option(
      opt.command,
      opt.description,
      opt.parse || defaultOptParser,
      typeof opt.default === 'function' ? opt.default(cfg) : opt.default,
    ));

  // Placeholder option for --config, which is parsed before any other option,
  // but needs to be here to avoid "unknown option" errors when specified
  cmd.option('--config [string]', 'Path to the CLI configuration file');
};

function run() {
  const setupEnvScript = /^win/.test(process.platform)
    ? 'setup_env.bat'
    : 'setup_env.sh';

  childProcess.execFileSync(path.join(__dirname, setupEnvScript));

  commands.forEach(cmd => addCommand(cmd, config));

  commander.parse(process.argv);

  const isValidCommand = commands.find(cmd => cmd.name.split(' ')[0] === process.argv[2]);

  if (!isValidCommand) {
    printUnknownCommand(process.argv[2]);
    return;
  }

  if (!commander.args.length) {
    commander.help();
  }
}

module.exports = {
  run: run,
  init: init,
};
