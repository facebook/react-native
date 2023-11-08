/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

// $FlowFixMe[untyped-import]
const {codeFrameColumns} = require('@babel/code-frame');
// $FlowFixMe[untyped-import] there's no flowtype flow-parser
const flowParser = require('flow-parser');

class FlowParserSyntaxError extends Error {
  constructor(
    code: string,
    filename: ?string,
    errors: $ReadOnlyArray<{
      loc: $ReadOnly<{
        start: $ReadOnly<{line: number, column: number}>,
        end: $ReadOnly<{line: number, column: number}>,
      }>,
      message: string,
    }>,
  ) {
    const firstError = errors[0];
    const codeFrame = codeFrameColumns(
      code,
      {
        start: {
          line: firstError.loc.start.line,
          // flow-parser returns 0-indexed columns but Babel expects 1-indexed
          column: firstError.loc.start.column + 1,
        },
        end: {
          line: firstError.loc.end.line,
          // flow-parser returns 0-indexed columns but Babel expects 1-indexed
          column: firstError.loc.end.column + 1,
        },
      },
      {
        forceColor: false,
      },
    );
    const additionalErrorsMessage = errors.length
      ? '\n\nand ' +
        errors.length +
        ' other error' +
        (errors.length > 1 ? 's' : '') +
        ' in the same file.'
      : '';

    super(
      (filename != null ? `Syntax error in ${filename}: ` : 'Syntax error: ') +
        firstError.message +
        '\n' +
        codeFrame +
        additionalErrorsMessage,
    );
  }
}

function parseFlowAndThrowErrors(
  code: string,
  options: $ReadOnly<{filename?: ?string}> = {},
): $FlowFixMe {
  const ast = flowParser.parse(code, {
    enums: true,
  });
  if (ast.errors && ast.errors.length) {
    throw new FlowParserSyntaxError(code, options.filename, ast.errors);
  }
  return ast;
}

module.exports = {
  parseFlowAndThrowErrors,
};
