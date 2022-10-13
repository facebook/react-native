/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const crypto = require('node:crypto');

// @see https://github.com/flow-typed/flow-typed
const HASH_COMMENT_RE = /\/\/ flow-typed signature: (.*)$/;

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require valid flow-typed signatures',
      recommended: true,
    },
    messages: {
      invalidSignature:
        'Invalid flow-typed signature; avoid local modifications',
    },
    schema: [],
  },

  create(context) {
    return {
      Program() {
        const sourceText = context.getSourceCode().getText();

        const firstLineEndIndex = sourceText.indexOf('\n');
        const firstLine = sourceText.substr(0, firstLineEndIndex);

        const match = firstLine.match(HASH_COMMENT_RE);
        if (match == null) {
          // Not a signed flow-typed definition file.
          return;
        }

        const hash = match[1];
        const versionedCode = sourceText.substr(firstLineEndIndex + 1);
        if (md5(versionedCode) === hash) {
          return;
        }

        context.report({
          loc: {
            start: {
              line: 1,
              column: firstLine.length - hash.length,
            },
            end: {
              line: 1,
              column: firstLine.length,
            },
          },
          messageId: 'invalidSignature',
        });
      },
    };
  },
};

function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}
