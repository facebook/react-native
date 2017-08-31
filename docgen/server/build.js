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

cd(process.cwd());

cd(`../docs`);
rm(`-rf`, `autogen_*.md`);
cd(`../docgen`);
rm(`-rf`, `build`);
rm(`-rf`, `src`);
mkdir(`-p`, `build`);
mkdir(`-p`, `src`);

if (exec(`node server/generate.js`).code !== 0) {
  echo(`Error: Rendering Autodocs to HTML failed`);
  exit(1);
}

if (exec(`node server/build-autodocs-markdown.js`).code !== 0) {
  echo(`Error: Generating Autodocs Markdown failed`);
  exit(1);
}

if (exec(`node server/build-autodocs-sidebar.js`).code !== 0) {
  echo(`Error: Generating Autodocs Sidebar failed`);
  exit(1);
}
