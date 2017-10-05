#!/usr/bin/env node

/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
"use strict";

/** 
 * This is meant to be a one-time run script that checks out every version of the docs off GitHub. This includes both the Markdown-formatted guides, as well as the autodocs generated from JavaScript code.
 * Given that the autodocs are generated from JavaScript code and stored as HTML in source control, we'll need to go back and regenerate autodocs for every single version.
 * Once we have Markdown formatted docs, we'll need to go through these and generate all the necessary sidebar files.
 * We'll be working with a few directories:
 * 
 *   - /docs - This is where the latest version of the docs will reside. 
 *   - /website/versioned_docs - Here we will have version-XXX folders, one for each React Native version. It shall include both "guides" (regular docs already stored as a Markdown file), as well as "autodocs" (Markdown docs generated from JavaScript comments).
 *   - /website/versioned_sidebars - We'll also have version-XXX folders here, one for each React Native version. These sidebar files will be generated based on the Markdown docs present in the corresponding versioned_docs sub-folder.
 *   - /docgen/build - Here we will store any intermediary build files that shall not be stored in source control. These can be regenerated from source control, and include such things as original files checked out from git tags, as well as intermediary metadata files used to generate the final sidebar files.
 * 
 */

const fm = require("front-matter");
const fs = require("fs");
const glob = require("glob");
const mkdirp = require("mkdirp");
const shell = require("shelljs");

const GIT_USER = process.env.GIT_USER;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_REPONAME = process.env.GITHUB_REPONAME;
const remoteBranch = `https://${GIT_USER}@github.com/${GITHUB_USERNAME}/${GITHUB_REPONAME}.git`;
const localCheckoutDir = `${GITHUB_REPONAME}-docs`;
const DOCS_DIR = `../docs`;
const buildDir = `build/`;

function runChecks() {
  if (!shell.which("git")) {
    shell.echo("Sorry, this script requires git");
    shell.exit(1);
  }
  
  if (!GIT_USER) {
    shell.echo("GIT_USER undefined.");
    shell.exit(1);
  }
  if (!GITHUB_USERNAME) {
    shell.echo("GITHUB_USERNAME undefined.");
    shell.exit(1);
  }
  if (!GITHUB_REPONAME) {
    shell.echo("GITHUB_REPONAME undefined.");
    shell.exit(1);
  }
}

/**
 * Remove any existing build directories and start with a clean slate.
 */
function prepareFilesystem() {
  shell.cd(process.cwd());
  shell.rm('-rf', buildDir);
  shell.mkdir('-p', buildDir + localCheckoutDir);
}

/**
 * Check out each version tag, then run node server/generate.js to get HTML files built.
 * 
 * Generate requires a server to be started up. Can we do this from one location?
 */

function checkOutDocs() {
  shell.cd(localCheckoutDir);

  shell.exec(`git init`).code !== 0;

  if (shell.exec(`git remote add origin ${remoteBranch}`).code !== 0) {
    shell.echo("Error: git remote failed");
    shell.exit(1);
  }

  shell.exec(`git config core.sparsecheckout true`).code !== 0;
  shell.exec(`echo "docs/*" >> .git/info/sparse-checkout`).code !== 0;

  if (shell.exec(`git fetch --depth 1 origin master`).code !== 0) {
    shell.echo("Error: git fetch failed");
    shell.exit(1);
  }

  if (shell.exec(`git pull --depth 1 origin master`).code !== 0) {
    shell.echo("Error: git pull failed");
    shell.exit(1);
  }

  shell.echo(`Checked out ${localCheckoutDir}`);
  shell.cd(`../..`);

  processDocs(`build/${localCheckoutDir}/docs`);
}

function checkOutVersionedDocs() {
  shell.cd(process.cwd() + buildDir + localCheckoutDir);
  shell.exec(`git fetch`);

  const tags = shell.exec(`git tag --sort=version:refname -l 'v0.??.?' 'v0.?.?'`).toString().split('\n');
  console.log(tags);
  tags.forEach(function(tag) {
    if (shell.exec(`git checkout ${tag}`).code !== 0) {
      shell.echo("Error: git checkout failed");
      shell.exit(1);
    }
    shell.echo(`Checked out ${tag}`);
    const version = tag.substring(1);
    const versionDir = `../../website/versioned_docs/${version}`;
    shell.mkdir(versionDir);
    shell.cp(`docs/*`, `${versionDir}/.`)
    processDocs(versionDir, version);
  })

  shell.cd(`../..`);
}

function generateDocsMetadata(files) {
  let sidebarsMetadata = new Object();

  files.forEach(function(file) {
    const data = fs.readFileSync(file, "utf8");
    const content = fm(data);
    const metadata = content.attributes;
    const rawContent = content.body;

    if (metadata.layout !== "docs") {
      console.log(`Skipping ${file} due to non-docs layout ${metadata.layout}`);
      return;
    }

    if (metadata.category) {
      if (!Object.keys(sidebarsMetadata).includes(metadata.category)) {
        sidebarsMetadata = Object.assign({}, sidebarsMetadata, {
          [metadata.category]: {}
        });
      }
      const sidebarMetadata = {
        previous: metadata.previous,
        next: metadata.next,
        id: metadata.id,
        title: metadata.title,
        content: rawContent,
        filename: file
      };
      const updatedCategory = Object.assign(
        {},
        sidebarsMetadata[metadata.category],
        { [sidebarMetadata.id]: sidebarMetadata }
      );

      sidebarsMetadata = Object.assign({}, sidebarsMetadata, {
        [metadata.category]: updatedCategory
      });
    } else {
      console.log(`Skipping ${file} due to lack of category`);
      return;
    }

    if (!metadata.permalink) {
      console.log(`Skipping ${file} due to lack of permalink`);
      return;
    }

    if (metadata.permalink.match(/^https?:/)) {
      console.log(`Skipping ${file} as its permalink is external`);
      return;
    }
  });
  fs.writeFileSync(
    `build/sidebars-metadata.json`,
    JSON.stringify(sidebarsMetadata)
  );
  return sidebarsMetadata;
}

function generateSidebarsFromMetadata(sidebarsMetadata) {
  let sidebars = new Object();

  Object.keys(sidebarsMetadata).forEach(function(category) {
    if (!Object.keys(sidebars).includes(category)) {
      sidebars = Object.assign({}, sidebars, { [category]: [] });
    }
    let categoryHead;
    let allFilesInCategory = Object.keys(sidebarsMetadata[category]);
    Object.entries(sidebarsMetadata[category]).forEach(function([id, file]) {
      if (allFilesInCategory.includes(file.previous)) {
        // skip, we're looking for head
        console.log(`skipping ${file.id}`);
        return;
      }
      categoryHead = file;
    });

    let updatedCategory = [categoryHead.id];
    let currentFile = categoryHead;
    while (allFilesInCategory.includes(currentFile.next)) {
      updatedCategory = updatedCategory.concat([currentFile.next]);
      currentFile = sidebarsMetadata[category][currentFile.next];
    }
    sidebars = Object.assign({}, sidebars, { [category]: updatedCategory });
  });

  return sidebars;
}

function generateMarkdownFromMetadata(sidebarMetadata) {
  Object.keys(sidebarMetadata).forEach(function(category) {
    Object.keys(sidebarMetadata[category]).forEach(function(docId) {
      const doc = sidebarMetadata[category][docId];
      const targetFile = `../docs/${doc.id}.md`;

      const migratedContent = doc.content.replace('src="img/', 'src="/react-native/img/');

      const res = [
        "---",
        "id: " + doc.id,
        "title: " + doc.title,
        "---",
        migratedContent
      ]
        .filter(function(line) {
          return line;
        })
        .join("\n");

      fs.writeFileSync(targetFile, res);
      console.log(`Wrote ${targetFile}`);
    });
  });
}

function processDocs(workingDir, version) {
  // Generate sidebars.json
  glob(`${workingDir}/*.md`, function(er, files) {
    const sidebarsMetadata = generateDocsMetadata(files);
    const sidebars = generateSidebarsFromMetadata(sidebarsMetadata);
    const sidebarFile = `../website/` + version ? `versioned_sidebars/${version}/` : '' + 'sidebars.json'
    fs.writeFileSync(
      `../website/sidebars.json`,
      JSON.stringify({
        docs: sidebars
      })
    );
    console.log("Generated sidebars.json file from docs");
    generateMarkdownFromMetadata(sidebarsMetadata);
    console.log("Generated markdown files from docs");
  });
}

runChecks();
prepareFilesystem();
checkOutDocs();
// checkOutVersionedDocs();