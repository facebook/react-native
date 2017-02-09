/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var Promise = require('bluebird');
var request = require('request');
var glob = require('glob');
var fs = require('fs.extra');
var mkdirp = require('mkdirp');
var server = require('./server.js');
var Feed = require('feed');

require('./convert.js')({extractDocs: true});
server.noconvert = true;

// Sadly, our setup fatals when doing multiple concurrent requests
// I don't have the time to dig into why, it's easier to just serialize
// requests.
var queue = Promise.resolve();

// Generate RSS Feeds
queue = queue.then(function() {
  return new Promise(function(resolve, reject) {
    var targetFile = 'build/react-native/blog/feed.xml';

    var basePath = 'https://facebook.github.io/react-native/';
    var blogPath = basePath + 'blog/';

    var metadataBlog = JSON.parse(fs.readFileSync('server/metadata-blog.json'));
    var latestPost = metadataBlog.files[0];
    var feed = new Feed({
      title: 'React Native Blog',
      description: 'The best place to stay up-to-date with the latest React Native news and events.',
      id: blogPath,
      link: blogPath,
      image: basePath + 'img/header_logo.png',
      copyright: 'Copyright © ' + new Date().getFullYear() + ' Facebook Inc.',
      updated: new Date(latestPost.publishedAt),
    });

    metadataBlog.files.forEach(function(post) {
      var url = blogPath + post.path;
      feed.addItem({
        title: post.title,
        id: url,
        link: url,
        date: new Date(post.publishedAt),
        author: [{
          name: post.author,
          link: post.authorURL
        }],
        description: post.excerpt,
      });
    });

    mkdirp.sync(targetFile.replace(new RegExp('/[^/]*$'), ''));
    fs.writeFileSync(targetFile, feed.render('atom-1.0'));
    console.log('Generated RSS feed')
    resolve();
  });
});

// Generate HTML for each non-source code JS file
glob('src/**/*.*', function(er, files) {
  files.forEach(function(file) {
    var targetFile = file.replace(/^src/, 'build');

    if (file.match(/\.js$/) && !file.match(/src\/react-native\/js/)) {
      targetFile = targetFile.replace(/\.js$/, '.html');
      queue = queue.then(function() {
        return new Promise(function(resolve, reject) {
          request('http://localhost:8079/' + targetFile.replace(/^build\//, ''), function(error, response, body) {
            if (error) {
              reject(error);
              return;
            }
            if (response.statusCode != 200) {
              reject(new Error('Status ' + response.statusCode + ':\n' + body));
              return;
            }
            mkdirp.sync(targetFile.replace(new RegExp('/[^/]*$'), ''));
            fs.writeFileSync(targetFile, body);
            resolve();
          });
        });
      });
    } else {
      queue = queue.then(function() {
        return new Promise(function(resolve, reject) {
          mkdirp.sync(targetFile.replace(new RegExp('/[^/]*$'), ''));
          fs.copy(file, targetFile, resolve);
        });
      });
    }
  });

  queue = queue.then(function() {
    console.log('Generated HTML files from JS');
  }).finally(function() {
    server.close();
  }).catch(function(e) {
    console.error(e);
    process.exit(1);
  });
});
