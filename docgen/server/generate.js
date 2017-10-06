/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fetch = require('node-fetch');
const filepath = require('filepath');
const fm = require('front-matter');
const fs = require('fs-extra');
const glob = require('glob-promise');
const jsdom = require('jsdom');
const mkdirp = require('mkdirp');
const Promise = require('bluebird');
const shell = require('shelljs');

const convert = require('./convert.js');
const slugify = require('../core/slugify');

const AUTODOCS_PREFIX = 'autogen_';
const MARKDOWN_EXTENSION = 'md';

const GIT_USER = 'hramos'; //process.env.GIT_USER;
const GITHUB_USERNAME = 'facebook'; // process.env.GITHUB_USERNAME;
const GITHUB_REPONAME = 'react-native'; // process.env.GITHUB_REPONAME;
const remoteBranch = `https://${GIT_USER}@github.com/${GITHUB_USERNAME}/${GITHUB_REPONAME}.git`;

const CHECKOUT_DIR = `${GITHUB_REPONAME}-docs`;
const BUILD_DIR = 'build';
const DOCS_DIR = 'versioned_docs';
const SIDEBAR_DIR = 'versioned_sidebars';

const { JSDOM } = jsdom;

// Start up a server. Don't forget to close the connection when done.
const server = require('./server.js');
server.noconvert = true;

const argv = require('minimist')(process.argv.slice(2), {
  alias: {
    'c': 'clean'
  },
  default: {
    'autodocs': true
  }
});

function runChecks() {
  if (!shell.which('git')) {
    shell.echo('Sorry, this script requires git');
    shell.exit(1);
  }
  
  if (!GIT_USER) {
    shell.echo('GIT_USER undefined.');
    shell.exit(1);
  }
  if (!GITHUB_USERNAME) {
    shell.echo('GITHUB_USERNAME undefined.');
    shell.exit(1);
  }
  if (!GITHUB_REPONAME) {
    shell.echo('GITHUB_REPONAME undefined.');
    shell.exit(1);
  }
}

function cleanFiles() {
  return fs.remove(BUILD_DIR);
}

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

  const pathToOutputDir = filepath.create(BUILD_DIR, DOCS_DIR, options.version);

  console.log(`Processing ${file}`);
  const url = 'http://localhost:8079/' + file
    .replace(/^src/, '')
    .replace(/\.js$/, '.html');

  return fetch(url)
    .then(response => {
      if(response.ok) {
        return response.text();
      }
      throw new Error('Network response was not ok.');
    })
    .then(body => {
      const dom = new JSDOM(body);      
      const markdown = generateMarkdownFromDOM(dom);
      const metadata = fm(markdown);

      const pathToOutputFile = pathToOutputDir.append(`${AUTODOCS_PREFIX}${metadata.attributes.id}.${MARKDOWN_EXTENSION}`);

      return fs.outputFile(pathToOutputFile.toString(), markdown);
    })
    .catch(error => {
      console.log(error);
      reject(error);
    });
}

/**
 * Generates Markdown documentation. Uses the convert script to extract docs from source files.
 */
function generateAutodocs(options = { version: 'next' }) {
  console.log(`Generating Markdown files from JavaScript sources for version ${options.version}.`);
  convert({extractDocs: true});
  
  let queue = Promise.resolve();
  
  return Promise.resolve().then(function() {
    return glob('src/**/*.js');
  }).then(function(files) {
    let p = Promise.resolve();
    files.forEach(function(file) {
      p = p.then(function() {
        return generateAutodocForFile(file, options);
      });
    });
  
    return p;
  }).then(function() {
    console.log(`Generated Markdown files from JavaScript sources for version ${options.version}.`);
  }).catch(function(e) {
    console.error(e);
    process.exit(1);
  });
}

// TODO: I think we have a sync/async problem where we checked out everything before trying to process docs
function checkOutDocs() {
  const pathToGitCheckout = filepath.create(BUILD_DIR, CHECKOUT_DIR);
  const p = Promise.resolve();
  return p
    .then(() => {
      fs.ensureDir(pathToGitCheckout.toString());
    })
    .then(() => {
      return fs.exists(pathToGitCheckout.append(`.git`).toString())
    }).then(gitCheckoutExists => {
      if (!gitCheckoutExists) {
        shell.cd(process.cwd());
        shell.cd(BUILD_DIR);
        shell.cd(CHECKOUT_DIR);
        shell.exec(`git init`).code !== 0;

        if (shell.exec(`git remote add origin ${remoteBranch}`).code !== 0) {
          throw new Error('Error: git remote failed');
        }
      }
      return;
    })
    .then(() => {
      shell.exec(`git config core.sparsecheckout true`).code !== 0;
      shell.exec(`echo "docs/*" >> .git/info/sparse-checkout`).code !== 0;
      shell.exec(`echo "Libraries/*" >> .git/info/sparse-checkout`).code !== 0;
      
      if (shell.exec(`git fetch`).code !== 0) {
        throw new Error('Error: git fetch failed');
      }

      const tags = shell.exec(`git tag --sort=version:refname -l 'v0.??.?' 'v0.?.?'`).toString().split('\n');
      tags.forEach(function(tag) {
        if (shell.exec(`git checkout ${tag}`).code !== 0) {
          throw new Error('Error: git checkout failed');
        }
        shell.echo(`Checked out ${tag}`);
        const version = tag.substring(1);
        // const versionDir = `../../website/versioned_docs/${version}`;
        // shell.mkdir(versionDir);
        // shell.cp(`docs/*`, `${versionDir}/.`)
        // processDocs(versionDir, version);
        return generateAutodocs({ version });
      })
    })
}


// DOM FORMATTING FUNCS

function bodyContentFromDOM(dom) {
  const el = dom.window.document.querySelector('#componentContent');
  if (el) {
    return el.innerHTML;
  } else {
    return null;
  }
}

function componentNameFromDOM(dom) {
  const el = dom.window.document.querySelector('title');
  if (el) {
    return el.innerHTML;
  } else {
    return 'Component';
  }
}

function componentCategoryFromDOM(dom) {
  const el = dom.window.document.querySelector('meta[property="rn:category"]');
  if (el) {
    return el.content;
  } else {
    return 'Components';
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
  let category = 'Components';
  const componentCategory = componentCategoryFromDOM(dom);
  if (componentCategory) {
    category = componentCategory;
  }
  const metadata = { id: slug, category: category };
  const markdown = [
    '---',
    'id: ' + slug,
    'title: ' + componentName,
    // 'category: ' + category,
    // 'permalink: docs/' + slug + '.html',
    '---',
    body
  ]
    .filter(function(line) {
      return line;
    })
    .join('\n');

  return markdown;
}

function generateMetatadaFile(categories) {
  const categoriesMetadataFile = `${BUILD_DIR}/sidebar-metadata.json`;
  return fs.outputFile(categoriesMetadataFile, JSON.stringify(categories));
}
// END DOM


if (argv.clean) {
  cleanFiles();
}

if (argv.autodocs) {
  runChecks();
  checkOutDocs()
    .finally(function() {
      server.close();
    }).catch(function(e) {
      console.error(e);
      process.exit(1);
    });
  
}

module.exports = generateAutodocs;
