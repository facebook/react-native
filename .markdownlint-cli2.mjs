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
    default: true,
    'heading-style': 'atx',
    'line-length': false,
    'relative-links': true,
  },
  globs: ['**/__docs__/*.md'],
  ignores: ['**/node_modules'],
  customRules: [relativeLinksRule],
};

export default config;
