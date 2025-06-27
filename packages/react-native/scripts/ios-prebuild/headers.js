/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const fs = require('fs');
const glob = require('glob');
const path = require('path');

/**
 * This regular expression is designed to match function calls to `podspec_sources` within a podspec file.
 *
 * Example matches:
 * 1. `podspec_sources("source1", "sourceForPrebuilds1")`
 *    - Captures: "source1" as the first argument, "sourceForPrebuilds1" as the second argument.
 *
 * 2. `podspec_sources(["source1", "source2"], ["sourceForPrebuilds1", "sourceForPrebuilds2"])`
 *    - Captures: ["source1", "source2"] as the first argument, ["sourceForPrebuilds1", "sourceForPrebuilds2"] as the second argument.
 *
 * 3. `podspec_sources('source1', ['sourceForPrebuilds1', 'sourceForPrebuilds2'])`
 *    - Captures: 'source1' as the first argument, ['sourceForPrebuilds1', 'sourceForPrebuilds2'] as the second argument.
 */
const regex =
  /podspec_sources\s*\(\s*((?:\[[^\]]*\]|"[^"]*"|'[^']*'|[^,])+)\s*,\s*((?:\[[^\]]*\]|"[^"]*"|'[^']*'|[^)])+)\s*\)/gs;

function getHeaderFilesFromPodspecs(
  rootFolder /*:string*/,
) /*: { [key: string]: string[] }*/ {
  // Find podspec files
  const podSpecFiles = glob.sync('**/*.podspec', {
    cwd: rootFolder,
    absolute: true,
  });

  const headers /*: { [key: string]: string[] }*/ = {};

  podSpecFiles.forEach(podspec => {
    const content = fs.readFileSync(podspec, 'utf8');
    // Find all podspec_sources calls
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match) {
        let globPatterns /*: string[] */;
        let arg2 = match[2]?.trim().replace(/['"]/g, '');
        if (!arg2) {
          // Skip
          return;
        }
        // Check if arg2 is an array (e.g., ['a', 'b'])
        if (arg2.startsWith('[') && arg2.endsWith(']')) {
          // Remove the brackets and split by comma
          globPatterns = arg2
            .slice(1, -1)
            .split(',')
            .map(item => item.trim());
        } else {
          globPatterns = [arg2];
        }

        // Do the glob!
        const p = path.resolve(process.cwd(), path.dirname(podspec));
        const results = globPatterns
          .map(g => {
            return glob.sync(g.replace('{h}', 'h'), {
              cwd: p,
              absolute: true,
            });
          })
          .flat();

        if (!headers[podspec]) {
          headers[podspec] = results;
        } else {
          headers[podspec].push(...results);
        }
      }
    }
  });

  return headers;
}

module.exports = {
  getHeaderFilesFromPodspecs,
};
