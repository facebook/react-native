/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';
/*eslint no-console-disallow: "off"*/

const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');
const http = require('http');
const urlLib = require('url');
const SourceMapConsumer = require('source-map').SourceMapConsumer;


// url: string
// onSuccess: function (SourceMapConsumer)
// onFailure: function (string)
function getSourceMapForUrl(url, onFailure, onSuccess) {
  if (!url) {
    onFailure('must provide a URL');
    return;
  }

  if (url === 'assets://default_bundle') {
    onFailure('Don\'t know how to symbolicate in-app bundle, please load from server');
    return;
  }

  const parsedUrl = urlLib.parse(url);
  const mapPath = parsedUrl.pathname.replace(/\.bundle$/, '.map');
  const options = {
    host: 'localhost',
    port: parsedUrl.port,
    path: mapPath + parsedUrl.search + '&babelSourcemap=true',
  };

  http.get(options, (res) => {
    res.setEncoding('utf8');
    let sawEnd = false;
    let resBody = '';
    res.on('data', (chunk) => {
      resBody += chunk;
    }).on('end', () => {
      sawEnd = true;
      onSuccess(new SourceMapConsumer(resBody));
    }).on('close', (err) => {
      if (!sawEnd) {
        onFailure('Connection terminated prematurely because of: '
                      + err.code + ' for url: ' + url);
      }
    });
  }).on('error', (err) => {
    onFailure('Could not get response from: ' + url + ', error: ' + err.message);
  });
}

// capture: capture object
// onSuccess: function (Map of url -> SourceMapConsumer)
// onFailure: function (string)
function getSourceMapsForCapture(capture, onFailure, onSuccess) {
  const urls = new Set();
  const sourcemaps = new Map();
  for (const id in capture.refs) {
    const ref = capture.refs[id];
    if ((ref.type === 'ScriptExecutable' ||
        ref.type === 'EvalExecutable' ||
        ref.type === 'ProgramExecutable' ||
        ref.type === 'FunctionExecutable') && ref.value.url) {
      urls.add(ref.value.url);
    }
  }
  urls.forEach((url) => {
    getSourceMapForUrl(url, onFailure, (sourcemap) => {
      sourcemaps.set(url, sourcemap);
      urls.delete(url);
      if (urls.size === 0) {
        onSuccess(sourcemaps);
      }
    });
  });
  if (urls.size === 0) {
    console.warn('No source information found in capture');
    onSuccess(sourcemaps);
  }
}

// capture: capture object
// onSuccess: function (capture object)
// onFailure: function (string)
function symbolicateHeapCaptureFunctions(capture, onFailure, onSuccess) {
  getSourceMapsForCapture(capture, onFailure, (sourcemaps) => {
    for (const id in capture.refs) {
      const ref = capture.refs[id];
      if (ref.type === 'ScriptExecutable' ||
          ref.type === 'EvalExecutable' ||
          ref.type === 'ProgramExecutable' ||
          ref.type === 'FunctionExecutable') {
        const sourcemap = sourcemaps.get(ref.value.url);
        if (sourcemap) {
          const original = sourcemap.originalPositionFor({
            line: ref.value.line,
            column: ref.value.col,
          });
          if (original.name) {
            ref.value.name = original.name;
          } else if (!ref.value.name) {
            ref.value.name = path.posix.basename(original.source || '') + ':' + original.line;
          }
          ref.value.url = original.source;
          ref.value.line = original.line;
          ref.value.col = original.column;
        }
      }
    }
    onSuccess(capture);
  });
}

module.exports = function(req, res, next) {
  if (req.url !== '/jscheapcaptureupload') {
    next();
    return;
  }

  console.log('symbolicating Heap Capture');
  symbolicateHeapCaptureFunctions(JSON.parse(req.rawBody), (err) => {
      console.error('Error when symbolicating: ' + err);
    },
    (capture) => {
      res.end();
      const preload = path.join(__dirname, 'heapCapture/preLoadedCapture.js');
      fs.writeFileSync(preload, 'var preLoadedCapture = ');
      fs.appendFileSync(preload, JSON.stringify(capture));
      fs.appendFileSync(preload, ';');
      const captureDir = path.join(__dirname, 'heapCapture/captures');
      if (!fs.existsSync(captureDir)) {
        fs.mkdirSync(captureDir);
      }
      console.log('Packaging Trace');
      var captureHtml = captureDir + '/capture_' + Date.now() + '.html';
      var capture = fs.createWriteStream(captureHtml);
      var inliner = spawn(
        'inliner',
        ['--nocompress', 'heapCapture.html'],
        { cwd: path.join(__dirname, '/heapCapture/'),
          stdio: [ process.stdin, 'pipe', process.stderr ],
        });
      inliner.stdout.pipe(capture);
      inliner.on('error', (err) => {
        console.error('Error processing heap capture: ' + err.message);
        console.error('make sure you have installed inliner with \'npm install inliner -g\'');
      });
      inliner.on('exit', (code, signal) => {
        if (code === 0) {
          console.log('Heap capture written to: ' + captureHtml);
        } else {
          console.error('Error processing heap capture, inliner returned code: ' + code);
        }
      });
    }
  );
};
