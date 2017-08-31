/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

const fs = require('fs');
const path = require('path');
const convert = require('../convert.js');
const http = require('http');
const extractDocs = require('../extractDocs');
const docsList = require('../docsList');
const glob = require('glob');

const DOCS_MD_DIR = path.join(__dirname, '/../../src/react-native');
const BUILD_DIR = path.join(__dirname, '/../../build/react-native');

function splitHeader(content) {
  var lines = content.split(/\r?\n/);
  for (var i = 1; i < lines.length - 1; ++i) {
    if (lines[i] === '---') {
      break;
    }
  }
  return {
    header: i < lines.length - 1 ?
      lines.slice(1, i + 1).join('\n') : null,
    content: lines.slice(i + 1).join('\n')
  };
}

function extractMetadata(content) {
  var metadata = {};
  var both = splitHeader(content);
  var lines = both.header.split('\n');
  for (var i = 0; i < lines.length - 1; ++i) {
    var keyvalue = lines[i].split(':');
    var key = keyvalue[0].trim();
    var value = keyvalue.slice(1).join(':').trim();
    // Handle the case where you have "Community #10"
    try { value = JSON.parse(value); } catch(e) { }
    metadata[key] = value;
  }
  return {metadata: metadata, rawContent: both.content};
}

function rmFile(file) {
  try {
    fs.unlinkSync(file);
  } catch(e) {
    /* seriously, unlink throws when the file doesn't exist :( */
  }
}

let extractedDocs;
beforeAll(() => {
  glob(DOCS_MD_DIR + '/**/*.*', function(er, files) {
    files.forEach(rmFile);
    extractedDocs = extractDocs();
    require('../build');
  });
});

describe('extractDocs.js', () => {
  it('doc has frontmatter', () => {
      const firstDoc = extractedDocs[0];
      expect(firstDoc.slice(0, 3) === '---').toBeTruthy();
  });

  it ('extracted expected number of docs', () => {
      const all = docsList.components
          .concat(docsList.apis)
          .concat(docsList.stylesWithPermalink);

      expect(extractedDocs.length == all.length);
  })
})

describe('convert.js', () => {
  it ('converted a component', () => {
      const files = glob.sync(DOCS_MD_DIR + '/**/*.*');
      expect(files.length).toBeGreaterThan(0);
  });

  it ('converted a component with DocsLayout', () => {
      const files = glob.sync(DOCS_MD_DIR + '/**/*.*');
      let foundDocsLayout = false;
      files.forEach(function (file) {
          const content = fs.readFileSync(file, {encoding: 'utf8'});
          if (content.indexOf("var Layout = require(\"DocsLayout\");") !== -1) {
              foundDocsLayout = true;
          }
      });
      expect(foundDocsLayout).toBeTruthy();
  });

  it ('converted a component with AutodocsLayout', () => {
      const files = glob.sync(DOCS_MD_DIR + '/**/*.*');
      let foundDocsLayout = false;
      files.forEach(function (file) {
          const content = fs.readFileSync(file, {encoding: 'utf8'});
          if (content.indexOf("var Layout = require(\"AutodocsLayout\");") !== -1) {
              foundDocsLayout = true;
          }
      });
      expect(foundDocsLayout).toBeTruthy();
  });
})

describe('generate.js', () => {
  it ('rendered all webpages', () => {
      const files = glob.sync(DOCS_MD_DIR + '/**/*.*');
      files.forEach(function (file) {
          const targetFile = file.replace(/^src/, 'build');
          const content = fs.readFileSync(targetFile, {encoding: 'utf8'});
          expect(content.length).toBeGreaterThan(0);
      });
  });

})

describe('build.js', () => {
  it ('rendered files', () => {
      const files = glob.sync(DOCS_MD_DIR + '/**/*.*');
      expect(files.length).toBeGreaterThan(0);
  });

  it ('rendered all files', () => {
      const files = glob.sync(DOCS_MD_DIR + '/**/*.*');
      files.forEach(function (file) {
          const targetFile = file.replace(/^src/, 'build').replace(/\.html$/, '.md');;
          const content = fs.readFileSync(targetFile, {encoding: 'utf8'});
          expect(content.length).toBeGreaterThan(0);
      });
  });

  it ('rendered markdown contains frontmatter', () => {
      const files = glob.sync(BUILD_DIR + '/**/*.md');
      files.forEach(function (file) {
          const content = fs.readFileSync(file, {encoding: 'utf8'});
          expect(content.slice(0, 3) === '---').toBeTruthy();
      });
  });

})