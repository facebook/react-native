#!/usr/bin/env node
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

require('shelljs/global');
const yargs = require('yargs');
const execSync = require('child_process').execSync;

let argv = yargs.option('srcs', {
    alias: 'srcs_dir',
    type: 'string',
    description: 'Path to JavaScript sources',
}).option('modules_library_name', {
    type: 'string',
    description: 'Native modules interfaces library name',
}).option('modules_output_dir', {
    type: 'string',
    description: 'Native modules interfaces output dir',
}).option('components_library_name', {
    type: 'string',
    description: 'Native components interfaces library name',
}).option('components_output_dir', {
    type: 'string',
    description: 'Native components interfaces output dir',
}).argv;

let env_vars = [];
const { srcs_dir, modules_library_name, modules_output_dir, components_library_name, components_output_dir } = argv;

if (srcs_dir) {
    env_vars.push(`SRCS_DIR=${srcs_dir}`);
}
if (modules_library_name) {
    env_vars.push(`MODULES_LIBRARY_NAME=${modules_library_name}`);
}
if (modules_output_dir) {
    env_vars.push(`MODULES_OUTPUT_DIR=${modules_output_dir}`);
}
if (components_library_name) {
    env_vars.push(`COMPONENTS_LIBRARY_NAME=${components_library_name}`);
}
if (components_output_dir) {
    env_vars.push(`COMPONENTS_OUTPUT_DIR=${components_output_dir}`);
}

execSync(`${env_vars.join(' ')} ./generate-specs.sh`);
