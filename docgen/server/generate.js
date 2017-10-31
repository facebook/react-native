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

// const convert = require('./convert.js');
const slugify = require('../core/slugify');

const CWD = process.cwd();

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
// const server = require('./server.js');
// server.noconvert = true;

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
      const frontmatter = fm(markdown);

      const pathToOutputFile = pathToOutputDir.append(`${AUTODOCS_PREFIX}${frontmatter.attributes.original_id}.${MARKDOWN_EXTENSION}`);

      return fs.outputFile(pathToOutputFile.toString(), markdown);
    })
    .catch(error => {
      console.log(error);
      reject(error);
    });
}

/**
 * Generates Markdown documentation. Uses the convert script to extract docs from source files.
 *
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

// Check out gh-pages branch
function checkOutDocs() {
  const pathToGitCheckout = filepath.create(BUILD_DIR, CHECKOUT_DIR);

  let sidebarMetadata = {};
  const p = Promise.resolve();
  return p
    .then(() => {
      return fs.ensureDir(pathToGitCheckout.toString());
    })
    .then(() => {
      shell.cd(CWD);
      shell.cd(BUILD_DIR);
      shell.cd(CHECKOUT_DIR);
      return fs.exists(pathToGitCheckout.append(`.git`).toString())
    }).then(gitCheckoutExists => {
      if (!gitCheckoutExists) {
        shell.exec(`git init`).code !== 0;

        if (shell.exec(`git remote add origin ${remoteBranch}`).code !== 0) {
          throw new Error('Error: git remote failed');
        }
      }
      return;
    })
    .then(() => {
      if (shell.exec(`git fetch`).code !== 0) {
        throw new Error('Error: git fetch failed');
      }

      if (shell.exec(`git checkout gh-pages`).code !== 0) {
        throw new Error('Error: git checkout failed');
      }

      return glob('releases/**/*.html');
    }).then(files => {
      let seq = Promise.resolve();
      files.forEach(function(file) {
        seq = seq.then(() => {
          return extractMarkdownFromHTMLDocs(file);
        }).then((res) => {
          // console.log(res);
          if (res.markdown === undefined) {
            return;
          }
          const { frontmatter, markdown } = res;
          const version = extractDocVersionFromFilename(file);

          if (!version) {
            return;
          }

          const pathToOutputFile = filepath.create(CWD, '..', 'website', DOCS_DIR, version, `${frontmatter.attributes.original_id}.${MARKDOWN_EXTENSION}`);

          if (sidebarMetadata[version] === undefined) {
            sidebarMetadata[version] = [];
          }

          if (frontmatter.attributes.original_id !== "404" 
            && frontmatter.attributes.original_id !== "index" 
            && frontmatter.attributes.original_id !== "help" 
            && frontmatter.attributes.original_id !== "users" 
            && frontmatter.attributes.original_id !== "showcase" 
            && frontmatter.attributes.original_id !== "support" 
            && frontmatter.attributes.original_id !== "versions") {
            sidebarMetadata[version].push(frontmatter.attributes.id);
            return fs.outputFile(pathToOutputFile.toString(), markdown);
          }
          return;
        });
      });
      return seq;
    }).then(() => {
      console.log(sidebarMetadata)
      const pathToSidebarMetadataFile = filepath.create(CWD, BUILD_DIR, SIDEBAR_DIR, `sidebars-metadata.json`);
      return fs.outputFile(pathToSidebarMetadataFile.toString(), JSON.stringify(sidebarMetadata));
    }).then(() => {
      filepath.create(CWD, '..', 'website', SIDEBAR_DIR);
      for (const version in sidebarMetadata) {
        if (sidebarMetadata.hasOwnProperty(version)) {
          const documents = sidebarMetadata[version];
          let sidebar = {};
          sidebar[`version-${version}-docs`] = { "APIs": documents };

          const pathToSidebarFile = filepath.create(CWD, '..', 'website', SIDEBAR_DIR, `version-${version}-sidebars.json`);
          console.log(`Writing ${pathToSidebarFile}: ${sidebar}`);

          fs.outputFileSync(pathToSidebarFile.toString(), JSON.stringify(sidebar));
        }
      }
      return;
    }).then(() => {
      filepath.create(CWD, BUILD_DIR, SIDEBAR_DIR);
      const versions = Object.keys(sidebarMetadata); 

      const pathToVersionsFile = filepath.create(CWD, BUILD_DIR, `versions.json`);
      return fs.outputFile(pathToVersionsFile.toString(), JSON.stringify(versions.reverse()));
    }).then(() => {
      shell.cd(CWD);
      shell.cd(BUILD_DIR);
      shell.cd(CHECKOUT_DIR);

      shell.exec(`git config core.sparsecheckout true`).code !== 0;
      shell.exec(`echo "docs/*" >> .git/info/sparse-checkout`).code !== 0;
      shell.exec(`echo "Libraries/*" >> .git/info/sparse-checkout`).code !== 0;

      if (shell.exec(`git checkout master`).code !== 0) {
        throw new Error('Error: git checkout failed');
      }

      // maybe should clear out before?
      shell.cp('-r', 'docs/*.md', '../../docs/.');

      return glob('docs/**/*.md');
    }).then(() => {
      // now we handle sidebarring
      // and make versioned sidebar?
      return; //copy
    }).then(() => {
      // then finally we run docgen over Libraries/...
    });
}

function checkoutMasterDocs() {
  const pathToGitCheckout = filepath.create(BUILD_DIR, CHECKOUT_DIR);
  
    let sidebarMetadata = {};
    const p = Promise.resolve();
    return p
      .then(() => {
        return fs.ensureDir(pathToGitCheckout.toString());
      })
      .then(() => {
        shell.cd(CWD);
        shell.cd(BUILD_DIR);
        shell.cd(CHECKOUT_DIR);
        return fs.exists(pathToGitCheckout.append(`.git`).toString())
      }).then(gitCheckoutExists => {
        if (!gitCheckoutExists) {
          shell.exec(`git init`).code !== 0;
  
          if (shell.exec(`git remote add origin ${remoteBranch}`).code !== 0) {
            throw new Error('Error: git remote failed');
          }
        }
        return;
      })
      .then(() => {
        if (shell.exec(`git fetch`).code !== 0) {
          throw new Error('Error: git fetch failed');
        }
 
        shell.exec(`git config core.sparsecheckout true`).code !== 0;
        shell.exec(`echo "docs/*" >> .git/info/sparse-checkout`).code !== 0;
        shell.exec(`echo "Libraries/*" >> .git/info/sparse-checkout`).code !== 0;
  
        if (shell.exec(`git checkout master`).code !== 0) {
          throw new Error('Error: git checkout failed');
        }
  
        return glob('docs/**/*.md');
      }).then((files) => {
        let seq = Promise.resolve(); 
        files.forEach((file) => {
          seq = seq.then(() => {
            console.log(`reading ${file}`)
            return fs.readFile(file);
          }).then((originalMarkdown) => {
            console.log(`got:\n${originalMarkdown}`)
            const frontmatter = fm(originalMarkdown);
            
            const transformedMarkdown = [
              '---',
              'id: ' + frontmatter.attributes.id,
              'title: ' + frontmatter.attributes.title,
              '---',
              frontmatter.body
            ]
              .filter(function(line) {
                return line;
              })
              .join('\n');
  
              const pathToOutputFile = filepath.create(CWD, '../..', 'docs', `${frontmatter.attributes.id}.${MARKDOWN_EXTENSION}`);
            return fs.outputFile(pathToOutputFile.toString(), transformedMarkdown);
          });
        });
        // now we convert
        // now we handle sidebarring
        // and make versioned sidebar?
        return seq; //copy
      }).then(() => {
        // then finally we run docgen over Libraries/...
        console.log(`should codegen`)
      });
    
}

function extractDocVersionFromFilename(file) {
  const re = new RegExp('\/([0-9]*[.]?[0-9]*)');
  return file.match(re)[1];
}


function extractComponentNameFromFilename(file) {
  const re = new RegExp('([A-Za-z-]*).html');
  return file.match(re)[1];
}


function extractMarkdownFromHTMLDocs(file) {
  if (file.indexOf("404") !== -1) {
    return { };
  }
  // console.log(`Processing ${file}`);
  return JSDOM.fromFile(filepath.create(file).toString())
  .then((dom) => {
    const body = bodyContentFromDOM(dom);

    if (!body) {
      return {};
    }
    const componentName = extractComponentNameFromFilename(file);
    const version = extractDocVersionFromFilename(file);
    const markdown = generateMarkdown(componentName, body, version);
    const frontmatter = fm(markdown);
    return { frontmatter, markdown };
  })
}

// DOM FORMATTING FUNCS

function bodyContentFromDOM(dom) {
  const el = dom.window.document.querySelector('.inner-content');
  if (el) {
    return el.innerHTML;
  } else {
    return null;
  }
}

function componentNameFromDOM(dom) {
  const el = dom.window.document.querySelector('h1');
  if (el) {
    let componentName = el.innerHTML;
    const re = new RegExp('docs/([A-Za-z]*)(.html)');
    const parsedTitle = el.innerHTML.match(re);
    if (parsedTitle) {
      componentName = parsedTitle[1];
    }
    return componentName;
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
  const markdown = [
    '---',
    'id: ' + slug,
    'title: ' + componentName,
    '---',
    body
  ]
    .filter(function(line) {
      return line;
    })
    .join('\n');

  return markdown;
}

function generateMarkdown(componentName, body, version) {
  const slug = slugify(componentName);

  let markdown = [
    '---',
    'id: ' + slug,
    'title: ' + componentName,
    '---',
    body
  ];
  if (version) {
    markdown = [
      '---',
      'id: version-' + version + '-' + slug,
      'title: ' + componentName,
      'original_id: ' + slug,
      '---',
      body
    ];
  }
  return markdown.filter(function(line) {
    return line;
  }).join('\n');
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
  // checkOutDocs();
  checkoutMasterDocs();
}

/**
 * Check out gh-pages branch, cd releases/
 * For each version,
 * For each HTML,
 * Parse out jsdom
 * Get body contents
 * Generate frontmatter
 * Save into versioned_docs
 * Then finally generate sidebar files for each version
 *
 */

module.exports = generateAutodocs;
