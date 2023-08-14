/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {spawnSync} = require('child_process');

function retryCommand(maxRetries, command) {
  for (let i = 1; i <= maxRetries; i++) {
    console.log(`Attempt ${i}: ${command}`);
    const result = spawnSync(command, {shell: true, stdio: 'inherit'});

    if (result.status === 0) {
      console.log(`Command succeeded on attempt ${i}`);
      process.exit(0);
    } else {
      console.log(`Command failed on attempt ${i}`);
      if (i < maxRetries) {
        console.log('Retrying...');
      } else {
        console.log('Maximum retries reached. Exiting.');
        process.exit(1);
      }
    }
  }
}

const maxRetries = process.argv[2];
const command = process.argv.slice(3).join(' ');

if (!maxRetries || !command) {
  console.log('Usage: node retry_script.js <max_retries> <command>');
  process.exit(1);
}

retryCommand(maxRetries, command);
