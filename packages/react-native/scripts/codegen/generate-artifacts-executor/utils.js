/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';
const {CODEGEN_REPO_PATH} = require('./constants');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

function pkgJsonIncludesGeneratedCode(pkgJson) {
  return pkgJson.codegenConfig && pkgJson.codegenConfig.includesGeneratedCode;
}

const codegenLog = (text, info = false) => {
  // ANSI escape codes for colors and formatting
  const reset = '\x1b[0m';
  const cyan = '\x1b[36m';
  const yellow = '\x1b[33m';
  const bold = '\x1b[1m';

  const color = info ? yellow : '';
  console.log(`${cyan}${bold}[Codegen]${reset} ${color}${text}${reset}`);
};

function readPkgJsonInDirectory(dir) {
  const pkgJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    throw `[Codegen] Error: ${pkgJsonPath} does not exist.`;
  }
  return JSON.parse(fs.readFileSync(pkgJsonPath));
}

function buildCodegenIfNeeded() {
  if (!fs.existsSync(CODEGEN_REPO_PATH)) {
    return;
  }
  // Assuming we are working in the react-native repo. We might need to build the codegen.
  // This will become unnecessary once we start using Babel Register for the codegen package.
  const libPath = path.join(CODEGEN_REPO_PATH, 'lib');
  if (fs.existsSync(libPath) && fs.readdirSync(libPath).length > 0) {
    return;
  }
  codegenLog('Building react-native-codegen package.', true);
  execSync('yarn install', {
    cwd: CODEGEN_REPO_PATH,
    stdio: 'inherit',
  });
  execSync('yarn build', {
    cwd: CODEGEN_REPO_PATH,
    stdio: 'inherit',
  });
}

module.exports = {
  buildCodegenIfNeeded,
  pkgJsonIncludesGeneratedCode,
  codegenLog,
  readPkgJsonInDirectory,
};
