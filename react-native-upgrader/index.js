#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));

var cli = require('./cli');


if (argv._.length === 0 && (argv.h || argv.help)) {
  console.log([
    '',
    '  Usage: react-native-upgrader [version] [options]',
    '',
    '',
    '  Commands:',
    '',
    '    [Version]     upgrades React Native and app templates to the desired version',
    '                  (latest, if not specified)',
    '',
    '  Options:',
    '',
    '    -h, --help    output usage information',
    '    -v, --version output the version number',
    '    --verbose output',
    '',
  ].join('\n'));
  process.exit(0);
}

if (argv._.length === 0 && (argv.v || argv.version)) {
  console.log('react-native-upgrader: ' + require('./package.json').version);
  process.exit(0);
}


cli.run(argv._[0], argv)
  .catch(console.error);
