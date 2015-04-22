var http = require('http');
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var blacklist = require('../packager/blacklist.js');
var ReactPackager = require('../packager/react-packager');

var OUT_PATH = 'iOS/main.jsbundle';

function getBundle(flags) {

  var options = {
    projectRoots: [path.resolve(__dirname, '../../..')],
    transformModulePath: require.resolve('../packager/transformer.js'),
    assetRoots: [path.resolve(__dirname, '../../..')],
    cacheVersion: '2',
    blacklistRE: blacklist('ios')
  };

  var url = '/index.ios.bundle?dev=' + flags.dev;

  console.log('Building package...');
  ReactPackager.buildPackageFromUrl(options, url)
    .done(function(bundle) {
      console.log('Build complete');
      fs.writeFile(OUT_PATH, bundle.getSource({
        inlineSourceMap: false,
        minify: flags.minify
      }), function(err) {
        if (err) {
          console.log(chalk.red('Error saving bundle to disk'));
          throw err;
        } else {
          console.log('Successfully saved bundle to ' + OUT_PATH);
        }
      });
    });
}

function showHelp() {
  console.log([
    'Usage: react-native bundle [options]',
    '',
    'Options:',
    '  --dev\t\tsets DEV flag to true',
    '  --minify\tminify js bundle'
  ].join('\n'));
  process.exit(1);
}

module.exports = {
  init: function(args) {
    var flags = {
      help: args.indexOf('--help') !== -1,
      dev: args.indexOf('--dev') !== -1,
      minify: args.indexOf('--minify') !== -1
    }

    if (flags.help) {
      showHelp();
    } else {
      getBundle(flags);
    }
  }
}
