/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import relativeLinksRule from 'markdownlint-rule-relative-links';

const config = {
  config: {
    default: false,
    'heading-increment': true,
    'no-reversed-links': true,
    'no-missing-space-atx': true,
    'no-duplicate-heading': {
      siblings_only: true,
    },
    'single-title': true,
    'no-trailing-punctuation': true,
    'no-space-in-emphasis': true,
    'no-space-in-code': true,
    'no-space-in-links': true,
    'fenced-code-language': true,
    'first-line-heading': true,
    'no-empty-links': true,
    'no-alt-text': true,
    'link-fragments': true,
    'table-column-count': true,

    // The rest of default rules are already handled by prettier

    // Custom rules
    'relative-links': true,
  },
  globs: ['**/__docs__/*.md'],
  ignores: ['**/node_modules', '__docs__/README-template.md'],
  customRules: [relativeLinksRule],
};

export default config;
