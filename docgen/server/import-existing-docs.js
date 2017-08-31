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

const fm = require("front-matter");
const fs = require("fs");
const glob = require("glob");
const mkdirp = require("mkdirp");
const shell = require("shelljs");

const GIT_USER = process.env.GIT_USER;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_REPONAME = process.env.GITHUB_REPONAME;
const remoteBranch = `https://${GIT_USER}@github.com/${GITHUB_USERNAME}/${GITHUB_REPONAME}.git`;
const targetDir = `${GITHUB_REPONAME}-docs`;
const DOCS_DIR = `../docs`;

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

if (!shell.which("git")) {
  shell.echo("Sorry, this script requires git");
  shell.exit(1);
}

function prepareFilesystem() {
  shell.cd(process.cwd());
  shell.exec(`rm -rf build/`);
  shell.mkdir(`build`);
  shell.cd(`build`);
  shell.exec(`rm -rf ${targetDir}`);
  shell.mkdir(targetDir);
}

function checkOutDocs() {
  shell.cd(targetDir);

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

  shell.echo(`Checked out ${targetDir}`);
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

      const res = [
        "---",
        "id: " + doc.id,
        "title: " + doc.title,
        "---",
        doc.content
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

function processDocs() {
  // Generate sidebars.json
  glob(`build/${targetDir}/docs/*.md`, function(er, files) {
    const sidebarsMetadata = generateDocsMetadata(files);
    const sidebars = generateSidebarsFromMetadata(sidebarsMetadata);
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

prepareFilesystem();
checkOutDocs();
processDocs();
