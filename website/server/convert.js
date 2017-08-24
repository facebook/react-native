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
var optimist = require('optimist');
var path = require('path');
var removeMd = require('remove-markdown');
var extractDocs = require('./extractDocs');
var cache = require('memory-cache');
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
    'var Post = React.createClass({',
    rawContent && '  statics: { content: content },',
    '  render: function() {',
    '    return (',
    '      <Layout metadata={' + JSON.stringify(metadata) + '}>',
    rawContent && '        {content}',
    '      </Layout>',
    '    );',
    '  }',
    '});',
    'module.exports = Post;'
  ].filter(e => e).join('\n');
}

function execute(options) {
  if (options === undefined) {
      options = {};
  }

  var DOCS_MD_DIR = '../docs/';
  var BLOG_MD_DIR = '../blog/';
  var CONFIG_JSON_DIR = '../';

  // Extracts the Contributor's Guide content from Contributing.md
  // and inserts into repo's CONTRIBUTING.md
  const contributingGuide = splitHeader(
    fs.readFileSync(DOCS_MD_DIR + 'Contributing.md', 'utf8')
  ).content.replace(/\(\/react-native\//g, '(https://facebook.github.io/react-native/');

  let contributingReadme = fs.readFileSync('../CONTRIBUTING.md', 'utf8');
  const guideStart = '<!-- generated_contributing_start -->';
  const guideEnd = '<!-- generated_contributing_end -->';
  contributingReadme =
    contributingReadme.slice(0, contributingReadme.indexOf(guideStart) + guideStart.length) +
    contributingGuide +
    contributingReadme.slice(contributingReadme.indexOf(guideEnd));
  fs.writeFileSync('../CONTRIBUTING.md', contributingReadme);

  glob.sync('src/react-native/docs/*.*').forEach(rmFile);
  glob.sync('src/react-native/blog/*.*').forEach(rmFile);
  glob.sync('../blog/img/*.*').forEach(file => {
    writeFileAndCreateFolder(
      'src/react-native/blog/img/' + path.basename(file),
      fs.readFileSync(file)
    );
  });

  var metadatas = {
    files: [],
  };

  function handleMarkdown(content, filename) {
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
    var extractedDocs = cache.get('extractedDocs');
    if (!extractedDocs) {
      extractedDocs = extractDocs();
      cache.put('extractedDocs', extractedDocs);
    }
    extractedDocs.forEach(function(content) {
      handleMarkdown(content, null);
    });

    var files = glob.sync(DOCS_MD_DIR + '**/*.*');
    files.forEach(function(file) {
      var extension = path.extname(file);
      if (extension === '.md' || extension === '.markdown') {
        var content = fs.readFileSync(file, {encoding: 'utf8'});
        handleMarkdown(content, path.basename(file));
      }

      if (extension === '.json') {
        var content = fs.readFileSync(file, {encoding: 'utf8'});
        metadatas[path.basename(file, '.json')] = JSON.parse(content);
      }
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

  // load showcase apps into metadata
  var showcaseApps = JSON.parse(fs.readFileSync(
    path.basename(CONFIG_JSON_DIR + 'showcase.json'),
    {encoding: 'utf8'}
  ));
  metadatas.showcaseApps = showcaseApps;

  fs.writeFileSync(
    'core/metadata.js',
    '/**\n' +
    ' * @generated\n' +
    ' * @providesModule Metadata\n' +
    ' */\n' +
    'module.exports = ' + JSON.stringify(metadatas, null, 2) + ';'
  );


  files = glob.sync(BLOG_MD_DIR + '**/*.md');
  const metadatasBlog = {
    files: [],
  };

  files.sort().reverse().forEach(file => {
    // Transform
    //   2015-08-13-blog-post-name-0.5.md
    // into
    //   2015/08/13/blog-post-name-0-5.html
    var filePath = path.basename(file)
      .replace('-', '/')
      .replace('-', '/')
      .replace('-', '/')
      // react-middleware is broken with files that contains multiple . like react-0.14.js
      .replace(/\./g, '-')
      .replace(/\-md$/, '.html');

    // Extract 2015-08-13 from 2015/08/13/blog-post-name-0-5.html
    var match = filePath.match(/([0-9]+)\/([0-9]+)\/([0-9]+)/);
    var year = match[1];
    var month = match[2];
    var day = match[3];
    var publishedAt = year + '-' + month + '-' + day;

    var res = extractMetadata(fs.readFileSync(file, {encoding: 'utf8'}));
    var rawContent = res.rawContent;
    var excerpt = removeMd(rawContent).trim().split('\n')[0];
    var metadata = Object.assign({path: filePath, content: rawContent, publishedAt: publishedAt, excerpt: excerpt}, res.metadata);

    metadatasBlog.files.push(metadata);

    writeFileAndCreateFolder(
      'src/react-native/blog/' + filePath.replace(/\.html$/, '.js'),
      buildFile('BlogPostLayout', metadata, rawContent)
    );
  });

  var perPage = 15;
  for (var page = 0; page < Math.ceil(metadatasBlog.files.length / perPage); ++page) {
    writeFileAndCreateFolder(
      'src/react-native/blog' + (page > 0 ? '/page' + (page + 1) : '') + '/index.js',
      buildFile('BlogPageLayout', { page: page, perPage: perPage })
    );
  }
  fs.writeFileSync(
    'core/metadata-blog.js',
    '/**\n' +
    ' * @generated\n' +
    ' * @providesModule MetadataBlog\n' +
    ' */\n' +
    'module.exports = ' + JSON.stringify(metadatasBlog, null, 2) + ';'
  );
  fs.writeFileSync(
    'server/metadata-blog.json',
    JSON.stringify(metadatasBlog, null, 2)
  );

}

if (argv.convert) {
  console.log('convert!');
  execute();
}

module.exports = execute;
