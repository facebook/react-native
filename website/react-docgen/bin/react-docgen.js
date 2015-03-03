#!/usr/bin/env node
/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

var argv = require('nomnom')
  .script('react-docgen')
  .help(
    'Extract meta information from React components.\n' +
    'If a directory is passed, it is recursively traversed.'
  )
  .options({
    path: {
      position: 0,
      help: 'A component file or directory. If no path is provided it reads from stdin.',
      metavar: 'PATH',
      list: true
    },
    out: {
      abbr: 'o',
      help: 'store extracted information in FILE',
      metavar: 'FILE'
    },
    pretty: {
      help: 'pretty print JSON',
      flag: true
    },
    extension: {
      abbr: 'x',
      help: 'File extensions to consider. Repeat to define multiple extensions. Default:',
      list: true,
      default: ['js', 'jsx']
    },
    ignoreDir: {
      abbr: 'i',
      full: 'ignore',
      help: 'Folders to ignore. Default:',
      list: true,
      default: ['node_modules', '__tests__']
    }
  })
  .parse();

var async = require('async');
var dir = require('node-dir');
var fs = require('fs');
var parser = require('../dist/main.js');

var output = argv.o;
var paths = argv.path;
var extensions = new RegExp('\\.(?:' + argv.extension.join('|') + ')$');
var ignoreDir = argv.ignoreDir;

function writeError(msg, path) {
  if (path) {
    process.stderr.write('Error with path "' + path + '": ');
  }
  process.stderr.write(msg + '\n');
}

function exitWithError(error) {
  writeError(error);
  process.exit(1);
}

function exitWithResult(result) {
  result = argv.pretty ?
    JSON.stringify(result, null, 2) :
    JSON.stringify(result);
  if (argv.o) {
    fs.writeFileSync(argv.o, result);
  } else {
    process.stdout.write(result + '\n');
  }
  process.exit(0);
}

/**
 * 1. No files passed, consume input stream
 */
if (paths.length === 0) {
  var source = '';
  process.stdin.setEncoding('utf8');
  process.stdin.resume();
  var timer = setTimeout(function() {
    process.stderr.write('Still waiting for std input...');
  }, 5000);
  process.stdin.on('data', function (chunk) {
    clearTimeout(timer);
    source += chunk;
  });
  process.stdin.on('end', function () {
    exitWithResult(parser.parse(source));
  });
}

function traverseDir(path, result, done) {
  dir.readFiles(
    path,
    {
      match: extensions,
      excludeDir: ignoreDir
    },
    function(error, content, filename, next) {
      if (error) {
        exitWithError(error);
      }
      try {
        result[filename] = parser.parse(content);
      } catch(error) {
        writeError(error, path);
      }
      next();
    },
    function(error) {
      if (error) {
        writeError(error);
      }
      done();
    }
  );
}

/**
 * 2. Paths are passed.
 */
var result = Object.create(null);
async.eachSeries(paths, function(path, done) {
  fs.stat(path, function(error, stats) {
    if (error) {
      writeError(error, path);
      done();
      return;
    }
    if (stats.isDirectory()) {
      traverseDir(path, result, done);
    }
    else {
      try {
        result[path] = parser.parse(fs.readFileSync(path));
      } catch(error) {
        writeError(error, path);
      }
      finally {
        done();
      }
    }
  });
}, function() {
  var resultsPaths = Object.keys(result);
  if (resultsPaths.length === 0) {
    // we must have gotten an error
    process.exit(1);
  }
  if (paths.length === 1) { // a single path?
    fs.stat(paths[0], function(error, stats) {
      exitWithResult(stats.isDirectory() ? result : result[resultsPaths[0]]);
    });
  } else {
    exitWithResult(result);
  }
});
