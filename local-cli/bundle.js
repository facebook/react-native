var http = require('http');
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var blacklist = require('../packager/blacklist.js');
var ReactPackager = require('../packager/react-packager');

var OUT_PATH = {
  android: 'android/app/src/main/assets/index.android.bundle',
  ios: 'ios/main.jsbundle'
};
var URL_PATH = {
  android: '/index.android.bundle?platform=android&dev=',
  ios: '/index.ios.bundle?platform=ios&dev='
};

function getBundle(flags) {
  var platform = flags.platform ? flags.platform : 'ios';
  var outPath = flags.out ? flags.out : OUT_PATH[platform];

  var projectRoots = [path.resolve(__dirname, '../../..')];
  if (flags.root) {
    projectRoots.push(path.resolve(flags.root));
  }

  var assetRoots = [path.resolve(__dirname, '../../..')];
  if (flags.assetRoots) {
    assetRoots = assetRoots.concat(flags.assetRoots.split(",").map(function(root) {
      return path.resolve(root);
    }));
  }


  var options = {
    projectRoots: projectRoots,
    transformModulePath: require.resolve('../packager/transformer.js'),
    assetRoots: assetRoots,
    cacheVersion: '3',
    blacklistRE: blacklist(platform),
  };

  var url = flags.url ? flags.url.replace(/\.js$/i, '.bundle?dev=') : URL_PATH[platform];
  url = url.match(/^\//) ? url : '/' + url;
  url += flags.dev;

  console.log('Building package...');
  ReactPackager.buildPackageFromUrl(options, url)
    .done(function(bundle) {
      console.log('Build complete');
      fs.writeFile(outPath, bundle.getSource({
        inlineSourceMap: false,
        minify: flags.minify
      }), function(err) {
        if (err) {
          console.log(chalk.red('Error saving bundle to disk'));
          throw err;
        } else {
          console.log('Successfully saved bundle to ' + outPath);
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
    '  --minify\tminify js bundle',
    '  --root\t\tadd another root(s) to be used in bundling in this project',
    '  --assetRoots\t\tspecify the root directories of app assets',
    '  --out\t\tspecify the output file',
    '  --url\t\tspecify the bundle file url',
    '  --platform\t\tspecify the platform(android/ios)',
  ].join('\n'));
  process.exit(1);
}

module.exports = {
  init: function(args) {
    var flags = {
      help: args.indexOf('--help') !== -1,
      dev: args.indexOf('--dev') !== -1,
      minify: args.indexOf('--minify') !== -1,
      root: args.indexOf('--root') !== -1 ? args[args.indexOf('--root') + 1] : false,
      platform: args.indexOf('--platform') !== -1 ? args[args.indexOf('--platform') + 1] : false,
      assetRoots: args.indexOf('--assetRoots') !== -1 ? args[args.indexOf('--assetRoots') + 1] : false,
      out: args.indexOf('--out') !== -1 ? args[args.indexOf('--out') + 1] : false,
      url: args.indexOf('--url') !== -1 ? args[args.indexOf('--url') + 1] : false,
    }

    if (flags.help) {
      showHelp();
    } else {
      getBundle(flags);
    }
  }
}
