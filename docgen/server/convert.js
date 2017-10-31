/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var fs = require('fs')
var glob = require('glob');
var mkdirp = require('mkdirp');
var path = require('path');
var removeMd = require('remove-markdown');
var extractDocs = require('./extractDocs');
var cache = require('memory-cache');
var optimist = require('optimist');
var argv = optimist.argv;

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

function rmFile(file) {
  try {
    fs.unlinkSync(file);
  } catch(e) {
    /* seriously, unlink throws when the file doesn't exist :( */
  }
}

function backtickify(str) {
  var escaped = '`' + str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/{/g, '\\{') + '`';
  // Replace require( with require\( so node-haste doesn't replace example
  // require calls in the docs
  return escaped.replace(/require\(/g, 'require\\(');
}

function writeFileAndCreateFolder(file, content) {
  mkdirp.sync(file.replace(new RegExp('/[^/]*$'), ''));
  fs.writeFileSync(file, content);
}

// Extract markdown metadata header
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

function buildFile(layout, metadata, rawContent) {
  return [
    '/**',
    ' * @generated',
    ' */',
    'var React = require("React");',
    'var Layout = require("' + layout + '");',
    rawContent && 'var content = ' + backtickify(rawContent) + ';',
    'var Page = React.createClass({',
    rawContent && '  statics: { content: content },',
    '  render: function() {',
    '    return (',
    '      <Layout metadata={' + JSON.stringify(metadata) + '}>',
    rawContent && '        {content}',
    '      </Layout>',
    '    );',
    '  }',
    '});',
    'module.exports = Page;'
  ].filter(e => e).join('\n');
}

function execute(options) {
  if (options === undefined) {
      options = {};
  }

  var DOCS_MD_DIR = '../docs/';
  var CONFIG_JSON_DIR = '../';

  glob.sync('src/react-native/docs/*.*').forEach(rmFile);

  var metadatas = {
    files: [],
  };

  function handleMarkdown(content, filename) {
    if (!content) {
      console.log(`Empty content for ${filename}`);
      return;
    }
    if (content.slice(0, 3) !== '---') {
      return;
    }

    const res = extractMetadata(content);
    const metadata = res.metadata;
    const rawContent = res.rawContent;

    if (metadata.sidebar !== false) {
      metadatas.files.push(metadata);
    }

    if (metadata.permalink.match(/^https?:/)) {
      return;
    }

    metadata.filename = filename;

    // Create a dummy .js version that just calls the associated layout
    var layout = metadata.layout[0].toUpperCase() + metadata.layout.substr(1) + 'Layout';

    writeFileAndCreateFolder(
      'src/react-native/' + metadata.permalink.replace(/\.html$/, '.js'),
      buildFile(layout, metadata, rawContent)
    );
  }

  if (options.extractDocs) {
    // Rendering docs can take up to 8 seconds. We wait until /docs/ are
    // requested before doing so, then we store the results in memory to
    // speed up subsequent requests.
    extractDocs().forEach(function(content) {
      handleMarkdown(content, null);
    });
  }

  // we need to pass globals for the components to be configurable
  // metadata is generated in this process which has access to process.env
  // but the web pages are generated in a sandbox context and have only access to CommonJS module files
  metadatas.config = Object.create(null);
  Object
    .keys(process.env)
    .filter(key => key.startsWith('RN_'))
    .forEach((key) => {
      metadatas.config[key] = process.env[key];
    });

  console.log(`conversion finished.`)
  return JSON.stringify(metadatas, null, 2);
}

if (argv.convert) {
  console.log('convert!');
  execute();
}

module.exports = execute;
