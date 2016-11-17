/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const SourceMapConsumer = require('source-map').SourceMapConsumer;
const fs = require('fs');
const http = require('http');
const path = require('path');
const urlLib = require('url');

class TreeTransformator {
  constructor() {
    this.urlResults = {};
  }

  transform(tree, callback) {
    this.afterUrlsCacheBuild(tree, () => {
      callback(this.transformNode(tree));
    });
  }

  // private
  transformNode(tree) {
    if (tree.url in this.urlResults) {
      const original = this.urlResults[tree.url].originalPositionFor({
        line: tree.lineNumber,
        column: tree.columnNumber,
      });
      tree.functionName = original.name
        || (path.posix.basename(original.source || '') + ':' + original.line);
      tree.scriptId = tree.id;
      tree.url = 'file://' + original.source;
      tree.lineNumber = original.line;
      tree.columnNumber = original.column;
    } else if (tree.deoptReason === 'outside_vm') {
      tree.functionName = 'OUTSIDE VM';
    }
    tree.children = tree.children.map((t) => this.transformNode(t));
    return tree;
  }

  // private
  afterUrlsCacheBuild(tree, callback) {
    let urls = new Set();
    this.gatherUrls(tree, urls);

    let size = urls.size;
    if (size === 0) {
      callback();
    } else {
      urls.forEach((url) => {
        this.callUrlCached(url, () => {
          --size;
          if (size === 0) {
            callback();
          }
        });
      });
    }
  }

  // private
  gatherUrls(tree, urls) {
    urls.add(tree.url);
    tree.children.map((t) => this.gatherUrls(t, urls));
  }

  // private
  callUrlCached(url, callback) {
    if (url === '' || url === null || url in this.urlResults) {
      callback();
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
        this.urlResults[url] = new SourceMapConsumer(resBody);
        callback();
      }).on('close', (err) => {
        if (!sawEnd) {
          console.error('Connection terminated prematurely because of: '
                        + err.code + ' for url: ' + url);
          callback();
        }
      });
    }).on('error', (err) => {
      console.error('Could not get response from: ' + url);
      callback();
    });
  }
}

module.exports = function(req, res, next) {
  if (req.url !== '/jsc-profile') {
    next();
    return;
  }

  console.log('Received request from JSC profiler, post processing it...');
  let profile = JSON.parse(req.rawBody);
  (new TreeTransformator()).transform(profile.head, (newHead) => {
    profile.head = newHead;

    console.log('Dumping JSC profile information...');
    const dumpName = '/tmp/jsc-profile_' + Date.now() + '.cpuprofile';

    fs.writeFile(dumpName, JSON.stringify(profile), (err) => {
      let response = '';
      if (err) {
        response =
          'An error occured when trying to save the profile at ' + dumpName;
        console.error(response, err);
      } else {
        response =
          'Your profile was generated at\n\n' + dumpName + '\n\n' +
          'Open `Chrome/Atom Dev Tools > Profiles > Load` '
          + 'and select the profile to visualize it.';
        console.log(response);
      }
      res.end(response);
    });
  });
};
