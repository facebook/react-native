/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var execFile = require('child_process').execFile;
var http = require('http');
var isAbsolutePath = require('absolute-path');

var getFlowTypeCheckMiddleware = require('./getFlowTypeCheckMiddleware');

if (!fs.existsSync(path.resolve(__dirname, '..', 'node_modules'))) {
  console.log(
    '\n' +
    'Could not find dependencies.\n' +
    'Ensure dependencies are installed - ' +
    'run \'npm install\' from project root.\n'
  );
  process.exit();
}

var chalk = require('chalk');
var connect = require('connect');
var ReactPackager = require('./react-packager');
var blacklist = require('./blacklist.js');
var checkNodeVersion = require('./checkNodeVersion');
var formatBanner = require('./formatBanner');
var launchEditor = require('./launchEditor.js');
var parseCommandLine = require('./parseCommandLine.js');
var webSocketProxy = require('./webSocketProxy.js');

var options = parseCommandLine([{
  command: 'port',
  default: 8081,
  type: 'string',
}, {
  command: 'root',
  type: 'string',
  description: 'add another root(s) to be used by the packager in this project',
}, {
  command: 'assetRoots',
  type: 'string',
  description: 'specify the root directories of app assets'
}, {
  command: 'skipflow',
  description: 'Disable flow checks'
}, {
  command: 'nonPersistent',
  description: 'Disable file watcher'
}, {
  command: 'transformer',
  type: 'string',
  default: require.resolve('./transformer.js'),
  description: 'Specify a custom transformer to be used (absolute path)'
}]);

if (options.projectRoots) {
  if (!Array.isArray(options.projectRoots)) {
    options.projectRoots = options.projectRoots.split(',');
  }
} else {
  // match on either path separator
  if (__dirname.match(/node_modules[\/\\]react-native[\/\\]packager$/)) {
     // packager is running from node_modules of another project
    options.projectRoots = [path.resolve(__dirname, '../../..')];
  } else if (__dirname.match(/Pods\/React\/packager$/)) {
    // packager is running from node_modules of another project
    options.projectRoots = [path.resolve(__dirname, '../../..')];
  } else {
    options.projectRoots = [path.resolve(__dirname, '..')];
  }
}

if (options.root) {
  if (!Array.isArray(options.root)) {
    options.root = options.root.split(',');
  }

  options.root.forEach(function(root) {
    options.projectRoots.push(path.resolve(root));
  });
}

if (options.assetRoots) {
  if (!Array.isArray(options.assetRoots)) {
    options.assetRoots = options.assetRoots.split(',').map(function (dir) {
      return path.resolve(process.cwd(), dir);
    });
  }
} else {
  // match on either path separator
  if (__dirname.match(/node_modules[\/\\]react-native[\/\\]packager$/)) {
    options.assetRoots = [path.resolve(__dirname, '../../..')];
  } else if (__dirname.match(/Pods\/React\/packager$/)) {
    options.assetRoots = [path.resolve(__dirname, '../../..')];
  } else {
    options.assetRoots = [path.resolve(__dirname, '..')];
  }
}

checkNodeVersion();

console.log(formatBanner(
  'Running packager on port ' + options.port + '.\n'+
  '\n' +
  'Keep this packager running while developing on any JS projects. Feel free ' +
  'to close this tab and run your own packager instance if you prefer.\n' +
  '\n' +
  'https://github.com/facebook/react-native', {
    marginLeft: 1,
    marginRight: 1,
    paddingBottom: 1,
  })
);

console.log(
  'Looking for JS files in\n  ',
  chalk.dim(options.projectRoots.join('\n   ')),
  '\n'
);

process.on('uncaughtException', function(e) {
  if (e.code === 'EADDRINUSE') {
    console.log(
      chalk.bgRed.bold(' ERROR '),
      chalk.red('Packager can\'t listen on port', chalk.bold(options.port))
    );
    console.log('Most likely another process is already using this port');
    console.log('Run the following command to find out which process:');
    console.log('\n  ', chalk.bold('lsof -n -i4TCP:' + options.port), '\n');
    console.log('You can either shut down the other process:');
    console.log('\n  ', chalk.bold('kill -9 <PID>'), '\n');
    console.log('or run packager on different port.');
  } else {
    console.log(chalk.bgRed.bold(' ERROR '), chalk.red(e.message));
    var errorAttributes = JSON.stringify(e);
    if (errorAttributes !== '{}') {
      console.error(chalk.red(errorAttributes));
    }
    console.error(chalk.red(e.stack));
  }
  console.log('\nSee', chalk.underline('http://facebook.github.io/react-native/docs/troubleshooting.html'));
  console.log('for common problems and solutions.');
  process.exit(1);
});

var server = runServer(options, function() {
  console.log('\nReact packager ready.\n');
});

webSocketProxy.attachToServer(server, '/debugger-proxy');

function loadRawBody(req, res, next) {
  req.rawBody = '';
  req.setEncoding('utf8');

  req.on('data', function(chunk) {
    req.rawBody += chunk;
  });

  req.on('end', function() {
    next();
  });
}

function openStackFrameInEditor(req, res, next) {
  if (req.url === '/open-stack-frame') {
    var frame = JSON.parse(req.rawBody);
    launchEditor(frame.file, frame.lineNumber);
    res.end('OK');
  } else {
    next();
  }
}

function getDevToolsLauncher(options) {
  return function(req, res, next) {
    if (req.url === '/debugger-ui') {
      var debuggerPath = path.join(__dirname, 'debugger.html');
      res.writeHead(200, {'Content-Type': 'text/html'});
      fs.createReadStream(debuggerPath).pipe(res);
    } else if (req.url === '/launch-chrome-devtools') {
      var debuggerURL = 'http://localhost:' + options.port + '/debugger-ui';
      var script = 'launchChromeDevTools.applescript';
      console.log('Launching Dev Tools...');
      execFile(path.join(__dirname, script), [debuggerURL], function(err, stdout, stderr) {
        if (err) {
          console.log('Failed to run ' + script, err);
        }
        console.log(stdout);
        console.warn(stderr);
      });
      res.end('OK');
    } else {
      next();
    }
  };
}

// A status page so the React/project.pbxproj build script
// can verify that packager is running on 8081 and not
// another program / service.
function statusPageMiddleware(req, res, next) {
  if (req.url === '/status') {
    res.end('packager-status:running');
  } else {
    next();
  }
}

function getAppMiddleware(options) {
  var transformerPath = options.transformer;
  if (!isAbsolutePath(transformerPath)) {
    transformerPath = path.resolve(process.cwd(), transformerPath);
  }

  return ReactPackager.middleware({
    nonPersistent: options.nonPersistent,
    projectRoots: options.projectRoots,
    blacklistRE: blacklist(),
    cacheVersion: '2',
    transformModulePath: transformerPath,
    assetRoots: options.assetRoots,
    assetExts: ['png', 'jpeg', 'jpg'],
    polyfillModuleNames: [
      require.resolve(
        '../Libraries/JavaScriptAppEngine/polyfills/document.js'
      ),
    ],
  });
}

function runServer(
  options,
  readyCallback
) {
  var app = connect()
    .use(loadRawBody)
    .use(openStackFrameInEditor)
    .use(getDevToolsLauncher(options))
    .use(statusPageMiddleware)
    // Temporarily disable flow check until it's more stable
    //.use(getFlowTypeCheckMiddleware(options))
    .use(getAppMiddleware(options));

  options.projectRoots.forEach(function(root) {
    app.use(connect.static(root));
  });

  app.use(connect.logger())
    .use(connect.compress())
    .use(connect.errorHandler());

  return http.createServer(app).listen(options.port, '::', readyCallback);
}
