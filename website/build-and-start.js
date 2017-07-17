/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
"use strict";

const { cd, cp, echo, exec, exit, ls, mkdir, rm, which } = require("shelljs");

cd(`../docs`);
rm(`-rf`, `autogen_*.md`);
cd(`..`);
cd(`docgen`);
rm(`-rf`, `build`);
rm(`-rf`, `src`);
mkdir(`-p`, `build`);
mkdir(`-p`, `src`);

if (exec(`node server/generate.js`).code !== 0) {
  echo(`Error: Generating HTML failed`);
  exit(1);
}

if (exec(`node server/build.js`).code !== 0) {
  echo(`Error: Generating Markdown failed`);
  exit(1);
}

cd(`..`);
cd(`website`);
// exec(`npm start`);
