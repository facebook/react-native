/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = require('fs');
const path = require('path');

function readOutcomes() {
  const baseDir = '/tmp';
  let outcomes = [];
  fs.readdirSync(baseDir).forEach(file => {
    const fullPath = path.join(baseDir, file);
    if (fullPath.endsWith('outcome') && fs.statSync(fullPath).isDirectory) {
      fs.readdirSync(fullPath).forEach(subFile => {
        const subFullPath = path.join(fullPath, subFile);
        if (subFullPath.endsWith('outcome')) {
          const [library, status] = String(fs.readFileSync(subFullPath, 'utf8'))
            .trim()
            .split(':');
          const platform = subFile.includes('android') ? 'Android' : 'iOS';
          console.log(
            `[${platform}] ${library} completed with status ${status}`,
          );
          outcomes.push({
            library: library.trim(),
            platform,
            status: status.trim(),
          });
        }
      });
    } else if (fullPath.endsWith('outcome')) {
      const [library, status] = String(fs.readFileSync(fullPath, 'utf8'))
        .trim()
        .split(':');
      const platform = file.includes('android') ? 'Android' : 'iOS';
      console.log(`[${platform}] ${library} completed with status ${status}`);
      outcomes.push({
        library: library.trim(),
        platform,
        status: status.trim(),
      });
    }
  });
  return outcomes;
}

function printFailures(outcomes) {
  console.log('Printing failures...');
  let failures = 0;
  outcomes.forEach(entry => {
    if (entry.status !== 'success') {
      console.log(
        `❌ [${entry.platform}] ${entry.library} failed with status ${entry.status}`,
      );
      failures++;
    }
  });
  return failures > 0;
}

function collectResults() {
  const outcomes = readOutcomes();
  const failures = printFailures(outcomes);
  if (failures) {
    process.exit(1);
  }
  console.log('✅ All tests passed!');
}
module.exports = {
  collectResults,
};
