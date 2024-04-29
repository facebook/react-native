/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {retry} = require('./retry');

async function retryCommand(maxRetries, command) {
  const success = await retry(
    command,
    {shell: true, stdio: 'inherit'},
    maxRetries,
    0,
  );
  if (!success) {
    process.exit(1);
  }
}

const maxRetries = process.argv[2];
const command = process.argv.slice(3).join(' ');

if (!maxRetries || !command) {
  console.log('Usage: node retry_script.js <max_retries> <command>');
  process.exit(1);
}

retryCommand(maxRetries, command);
