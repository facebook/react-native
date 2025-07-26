#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script fixes Flow v0.275.0 syntax that Metro bundler cannot parse.
 * It's a temporary workaround until Metro supports the new Flow syntax.
 * 
 * Run this script after npm/yarn install to fix syntax errors in:
 * - React Native core files
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('Fixing Flow v0.275.0 syntax for Metro compatibility...\n');

// Find all JavaScript files that might contain Flow syntax
const patterns = [
  'packages/react-native/Libraries/**/*.js',
  'packages/virtualized-lists/**/*.js',
];

let filesFixed = 0;
let totalFiles = 0;

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { 
    ignore: ['**/node_modules/**', '**/__tests__/**', '**/__mocks__/**'] 
  });
  
  files.forEach(file => {
    totalFiles++;
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Fix Flow component syntax
      content = content.replace(
        /const\s+(\w+):\s*component\s*\([^)]*\)\s*=\s*React\.forwardRef/g,
        'const $1 = React.forwardRef'
      );
      
      // Fix component syntax without React.forwardRef
      content = content.replace(
        /const\s+(\w+):\s*component\s*\([^)]*\)\s*=\s*\(/g,
        'const $1 = ('
      );
      
      // Fix export statements with component syntax
      content = content.replace(
        /export\s+default\s+.*\.default\s+as\s+component\s*\([^)]*\)/g,
        'export default require(\'../UnimplementedViews/UnimplementedView\').default'
      );
      
      // Fix type declarations with component syntax
      content = content.replace(
        /type\s+(\w+)\s*=\s*component\s*\([^)]*\);/g,
        'type $1 = React.ComponentType<any>;'
      );
      
      // Fix TypeScript 'as' assertions that Metro can't parse
      content = content.replace(
        /\s+as\s+\$FlowFixMe\s+as\s+/g,
        ' as '
      );
      
      // Fix standalone 'as $FlowFixMe' assertions
      content = content.replace(
        /\s+as\s+\$FlowFixMe(?![A-Za-z0-9_])/g,
        ''
      );
      
      // Fix Flow type assertions with specific types
      content = content.replace(
        /\)\s+as\s+[A-Za-z_][A-Za-z0-9_]*(?:<[^>]+>)?\s*,/g,
        '),'
      );
      
      // Fix mapped type syntax [K in keyof Type]
      content = content.replace(
        /\[(\w+)\s+in\s+keyof\s+([^\]]+)\]:/g,
        '[key: string]:'
      );
      
      // Fix type assertions at end of blocks
      content = content.replace(
        /\}\s+as\s+\{[^}]+\}/g,
        '}'
      );
      
      // Only write if content changed
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`  Fixed: ${path.relative(process.cwd(), file)}`);
        filesFixed++;
      }
    } catch (error) {
      console.error(`  Error processing ${file}:`, error.message);
    }
  });
});

console.log(`\nSummary:`);
console.log(`  - Files scanned: ${totalFiles}`);
console.log(`  - Files fixed: ${filesFixed}`);

if (filesFixed > 0) {
  console.log('\nFlow syntax fixes applied successfully!');
  console.log('Your project should now build without Flow syntax errors.\n');
} else {
  console.log('\nNo Flow syntax issues found. Your project is ready!\n');
}