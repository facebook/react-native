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

const commander = require('commander');

const Config = require('./util/Config');
const childProcess = require('child_process');
const Promise = require('promise');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const gracefulFs = require('graceful-fs');

const init = require('./init/init');
const commands = require('./commands');
const assertRequiredOptions = require('./util/assertRequiredOptions');
const pkg = require('../package.json');
const defaultConfig = require('./default.config');

import type { Command } from './commands';

// graceful-fs helps on getting an error when we run out of file
// descriptors. When that happens it will enqueue the operation and retry it.
gracefulFs.gracefulify(fs);

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

  let output = [
    '',
    chalk.bold(chalk.cyan((`  react-native ${cmdName} ${this.usage()}`))),
    `  ${this._description}`,
    '',
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

const addCommand = (command: Command, config: Config) => {
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
          return command.func(argv, config, passedOptions);
        })
        .catch(handleError);
    });

    cmd.helpInformation = printHelpInformation.bind(cmd);
    cmd.examples = command.examples;

  options
    .forEach(opt => cmd.option(
      opt.command,
      opt.description,
      opt.parse || defaultOptParser,
      typeof opt.default === 'function' ? opt.default(config) : opt.default,
    ));
};

function run() {
  const config = Config.get(__dirname, defaultConfig);
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
