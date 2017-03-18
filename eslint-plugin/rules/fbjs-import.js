/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * ESLint rule to avoid importing fbjs modules using haste, they should be imported
 * using `fbjs/lib/<module>` otherwise it won't work in OSS.
 */
const fs = require('fs');
const moduleVisitor = require('eslint-module-utils/moduleVisitor').default;
const path = require('path');

// Note that this file will be in the `<root>/node_modules/eslint-plugin-custom/rules`
// folder when installed so file paths are relative to that.
// Find modules that could be imported from fbjs.
const fbjsFiles = fs
  .readdirSync(path.resolve(__dirname, '../../fbjs/lib'))
  .filter(file => file.match(/\.js$/g));

// Find RN dependencies to avoid false positive if there is a commonjs module with
// the same name as one of the fbjs modules.
const reactNativePackageJSON = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../package.json'))
);

const fbjsModules = new Set(
  fbjsFiles
    .map(file => file.replace('.js', ''))
    .filter(module => !reactNativePackageJSON.dependencies[module])
);

module.exports = {
  create: context => {
    const visitor = source => {
      const moduleName = source.value;
      if (fbjsModules.has(moduleName)) {
        context.report({
          node: source,
          message: `fbjs module \`${moduleName}\` should not be imported using haste`,
          fix: fixer => {
            return fixer.insertTextBeforeRange(
              [source.start + 1, source.end],
              'fbjs/lib/'
            );
          },
        });
      }
    };

    return moduleVisitor(visitor, { commonjs: true });
  },
};
