/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var semverCmp = require('semver-compare');

const {
  cd,
  cp,
  echo,
  exec,
  exit,
  ls,
  mkdir,
  rm,
  which,
} = require('shelljs');

const CIRCLE_BRANCH = process.env.CIRCLE_BRANCH;
const CIRCLE_PROJECT_USERNAME = process.env.CIRCLE_PROJECT_USERNAME;
const CI_PULL_REQUEST = process.env.CI_PULL_REQUEST;
const GIT_USER = process.env.GIT_USER;
const remoteBranch = `https://${GIT_USER}@github.com/facebook/react-native.git`;

if (!which(`git`)) {
  echo(`Sorry, this script requires git`);
  exit(1);
}

let version;
let areVersionlessSectionsToBeDeployed = false;
if (CIRCLE_BRANCH.indexOf(`-stable`) !== -1) {
  version = CIRCLE_BRANCH.slice(0, CIRCLE_BRANCH.indexOf(`-stable`));
} else if (CIRCLE_BRANCH === `master`) {
  version = `next`;
  areVersionlessSectionsToBeDeployed = true;
}

rm(`-rf`, `build`);
mkdir(`-p`, `build`);
// if current commit is tagged "latest" we do a release to gh-pages root
const currentCommit = exec(`git rev-parse HEAD`).stdout.trim();
const latestTagCommit = exec(`git ls-remote origin latest`).stdout.split(/\s/)[0];
// pass along which branch contains latest version so that gh-pages root could mark it as latest
const branchWithLatestTag = exec(`git branch -r --contains ${latestTagCommit}`).stdout.split('/')[1];
let latestVersion = ``;
if (branchWithLatestTag.indexOf(`-stable`) !== -1) {
  latestVersion = branchWithLatestTag.slice(0, branchWithLatestTag.indexOf(`-stable`));
}

if (!CI_PULL_REQUEST && CIRCLE_PROJECT_USERNAME === `facebook`) {
  echo(`Building branch ${version}, preparing to push to gh-pages`);
  // if code is running in a branch in CI, commit changes to gh-pages branch
  cd(`build`);
  rm(`-rf`, `react-native-gh-pages`);

  if (exec(`git clone ${remoteBranch} react-native-gh-pages`).code !== 0) {
    echo(`Error: Git clone failed`);
    exit(1);
  }

  cd(`react-native-gh-pages`);

  if (exec(`git checkout origin/gh-pages`).code +
    exec(`git checkout -b gh-pages`).code +
    exec(`git branch --set-upstream-to=origin/gh-pages`).code !== 0
    ) {
    echo(`Error: Git checkout gh-pages failed`);
    exit(1);
  }
  cd(`releases`);
  let releasesFolders = ls(`-d`, `*`);
  cd(`..`);
  let versions = releasesFolders.filter(name => name !== `next`);
  if (version !== `next` && versions.indexOf(version) === -1) {
    versions.push(version);
  }

  versions.sort(semverCmp).reverse();

  // generate to releases/XX when branch name indicates that it is some sort of release
  if (!!version) {
    echo(`------------ DEPLOYING /releases/${version}`);
    rm(`-rf`, `releases/${version}`);
    mkdir(`-p`, `releases/${version}`);
    cd(`../..`);
    if (exec(`RN_DEPLOYMENT_PATH=releases/${version} RN_VERSION=${version} RN_LATEST_VERSION=${latestVersion} \
    RN_AVAILABLE_DOCS_VERSIONS=${versions.join(',')} node server/generate.js`).code !== 0) {
      echo(`Error: Generating HTML failed`);
      exit(1);
    }
    cd(`build/react-native-gh-pages`);
    // blog, showcase, support are copied separately
    let toCopy = ls(`../react-native`)
      .filter(file => (file !== `blog`) && (file !== `showcase.html`) && (file !== `support.html`))
      .map(file => `../react-native/${file}`);
    cp(`-R`, toCopy, `releases/${version}`);
    // versions.html is located in root of website and updated with every release
    cp(`../react-native/versions.html`, `.`);
  }
  // generate to root folder when commit is tagged as latest, i.e. stable and needs to be shown at the root of repo
  if (currentCommit === latestTagCommit) {
    echo(`------------ DEPLOYING latest`);
    // leave only releases and blog folder
    rm(`-rf`, ls(`*`).filter(name => (name !== 'releases') && (name !== 'blog') && (name !== 'showcase.html') && (name !== 'support.html')));
    cd(`../..`);
    if (exec(`RN_VERSION=${version} RN_LATEST_VERSION=${latestVersion} \
    RN_AVAILABLE_DOCS_VERSIONS=${versions} node server/generate.js`).code !== 0) {
      echo(`Error: Generating HTML failed`);
      exit(1);
    }
    cd(`build/react-native-gh-pages`);
    // blog, showcase, support are copied separately
    let toCopy = ls(`../react-native`)
      .filter(file => (file !== `blog`) && (file !== `showcase.html`) && (file !== `support.html`))
      .map(file => `../react-native/${file}`);
    cp(`-R`, toCopy, `.`);
  }
  // blog, showcase, support are versionless, we always build them in root file
  if (areVersionlessSectionsToBeDeployed) {
    echo(`------------ COPYING blog`);
    rm(`-rf`, `blog`);
    cp(`-R`, `../react-native/blog`, `.`);
    echo(`------------ COPYING showcase`);
    cp(`../react-native/showcase.html`, `.`);
    echo(`------------ COPYING support`);
    cp(`../react-native/support.html`, `.`);
  }
  if (currentCommit === latestTagCommit || version) {
    exec(`git status`);
    exec(`git add -A .`);
    if (exec(`git diff-index --quiet HEAD --`).code !== 0) {
      if (exec(`git commit -m "Updated docs for ${version}"`).code !== 0) {
        echo(`Error: Git commit gh-pages failed`);
        exit(1);
      }
      if (exec(`git push origin gh-pages`).code !== 0) {
        echo(`Error: Git push gh-pages failed`);
        exit(1);
      }
    }
    echo(`------------ gh-pages updated`);
  }

}
