/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fetch = require("node-fetch");
const fs = require('fs.extra');
const glob = require('glob-promise');
const jsdom = require("jsdom");
const mkdirp = require('mkdirp');
const Promise = require('bluebird');

const convert = require('./convert.js');
const slugify = require("../core/slugify");

const FORMAT_HTML = 'html';
const FORMAT_MARKDOWN = 'markdown';

const { JSDOM } = jsdom;

const argv = require('minimist')(process.argv.slice(2), {
  alias: {
    'f': 'format'
  },
  default: {
    'autodocs': true,
    'format': FORMAT_HTML
  }
});

/**
 * Generates documentation for a given file.
 * 
 * @param {*} file 
 * @param {*} options 
 */
function generateAutodocForFile(file, options) {
  if (file.match(/src\/react-native\/js/)) {
    // Ensure we're only processing extracted docs
    console.log(`Skipping ${file}`);
    return;
  }

  console.log(`Processing ${file}`);
  const targetFile = file
    .replace(/^src/, 'build')
    .replace(/\.js$/, '.html');

  const targetFileServerPath = targetFile.replace(/^build\//, '');

  const url = 'http://localhost:8079/' + targetFileServerPath;
  return fetch(url)
    .then(response => {
      if(response.ok) {
        return response.text();
      }
      throw new Error('Network response was not ok.');
    })
    .then(body => {
      mkdirp.sync(targetFile.replace(new RegExp('/[^/]*$'), ''));
      fs.writeFileSync(targetFile, body);
      return JSDOM.fromFile(targetFile);
    })
    .then(dom => {
      // TODO: Generate Markdown file as needed.
      // Also, do we need to generate metadata now as well, regardless of format? Should we go straight to Markdown anyway?
      // Figure out where these files should be written.
      const metadata = generateMarkdownFromDOM(dom);
      console.log(metadata);
      // if (categories[metadata.category]) {
      //   categories[metadata.category].push(metadata.id);
      // } else {
      //   categories[metadata.category] = [metadata.id];
      // }
    })
    .catch(error => {
      console.log(error);
      reject(error);
    });
}

/**
 * Generates HTML or Markdown documentation. Uses the convert script to extract docs from source files.
 */
function generateAutodocs(options) {
  if (options === undefined) {
    options = { format: FORMAT_HTML };
  }

  // Start up a server. Don't forget to close the connection when done.
  const server = require('./server.js');
  convert({extractDocs: true});
  server.noconvert = true;
  
  let queue = Promise.resolve();
  
  queue = queue.then(function() {
    return glob('src/**/*.js');
  }).then(function(files) {
    let p = Promise.resolve();
    files.forEach(function(file) {
      p = p.then(function() {
        return generateAutodocForFile(file);
      });
    });
  
    return p;
  }).then(function() {
    console.log(`Generated ${options.format} files from JavaScript sources.`);
  }).finally(function() {
    server.close();
  }).catch(function(e) {
    console.error(e);
    process.exit(1);
  });
}

// DOM FORMATTING FUNCS

function bodyContentFromDOM(dom) {
  const el = dom.window.document.querySelector("#componentContent");
  if (el) {
    return el.innerHTML;
  } else {
    return null;
  }
}

function componentNameFromDOM(dom) {
  const el = dom.window.document.querySelector("title");
  if (el) {
    return el.innerHTML;
  } else {
    return "Component";
  }
}

function componentCategoryFromDOM(dom) {
  const el = dom.window.document.querySelector('meta[property="rn:category"]');
  if (el) {
    return el.content;
  } else {
    return "Components";
  }
}

/**
 * Generates a markdown formatted file, including frontmatter.
 * 
 * @param {*} dom 
 */
function generateMarkdownFromDOM(dom) {
  const body = bodyContentFromDOM(dom);
  if (!body) {
    return;
  }
  const componentName = componentNameFromDOM(dom);
  const slug = slugify(componentName);
  let category = "Components";
  const componentCategory = componentCategoryFromDOM(dom);
  if (componentCategory) {
    category = componentCategory;
  }
  const metadata = { id: slug, category: category };
  const res = [
    "---",
    "id: " + slug,
    "title: " + componentName,
    "category: " + category,
    "permalink: docs/" + slug + ".html",
    "---",
    body
  ]
    .filter(function(line) {
      return line;
    })
    .join("\n");

  // ORIGINAL
  // const targetFile = "../docs/autogen_" + componentName + ".md";
  
  mkdirp.sync('build/autodocs');
  const targetFile = "build/autodocs/autogen_" + componentName + ".md";
    // ORIGINAL
  // mkdirp.sync(targetFile.replace(new RegExp("/[^/]*$"), ""));
  console.log("Writing " + targetFile);
  fs.writeFileSync(targetFile, res);
  return metadata;
}

function generateMetatadaFile(categories) {
  const categoriesMetadataFile = "build/sidebar-metadata.json";
  fs.writeFileSync(categoriesMetadataFile, JSON.stringify(categories));
}
// END DOM

if (argv.autodocs) {
  let format = argv.format;
  console.log(`Generating ${format} files from JavaScript sources.`);
  generateAutodocs({ format });
}

module.exports = generateAutodocs;
