// @ts-check
const fs = require("fs");
const path = require("path");
const semver = require('semver');
const {execSync} = require('child_process');

const pkgJsonPath = path.resolve(__dirname, "../package.json");
let publishBranchName = '';
try {
  publishBranchName = process.env.BUILD_SOURCEBRANCH.match(/refs\/heads\/(.*)/)[1];
} catch (error) {}

if (publishBranchName === 'main') {
  console.log('nightly');
} else if (publishBranchName.endsWith('-stable')) {
  console.log('release');
} else {
  process.exit(1);
}