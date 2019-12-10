/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import UTFSequence from '../../UTFSequence';
import stringifySafe from '../../Utilities/stringifySafe';
import type {ExceptionData} from '../../Core/NativeExceptionsManager';
import type {LogBoxLogData} from './LogBoxLog';

const BABEL_TRANSFORM_ERROR_FORMAT = /^(?:TransformError )?(?:SyntaxError: |ReferenceError: )(.*): (.*) \((\d+):(\d+)\)\n\n([\s\S]+)/;
const BABEL_CODE_FRAME_ERROR_FORMAT = /^(?:TransformError )?(?:.*): (.*): ([\s\S]+?)\n([ >]{2}[\d\s]+ \|[\s\S]+|\u{001b}[\s\S]+)/u;

export type ExtendedExceptionData = ExceptionData & {
  isComponentError: boolean,
  ...
};
export type Category = string;
export type CodeFrame = $ReadOnly<{|
  content: string,
  location: ?{
    row: number,
    column: number,
    ...
  },
  fileName: string,
|}>;
export type Message = $ReadOnly<{|
  content: string,
  substitutions: $ReadOnlyArray<
    $ReadOnly<{|
      length: number,
      offset: number,
    |}>,
  >,
|}>;

export type ComponentStack = $ReadOnlyArray<CodeFrame>;

const SUBSTITUTION = UTFSequence.BOM + '%s';

export function parseCategory(
  args: $ReadOnlyArray<mixed>,
): $ReadOnly<{|
  category: Category,
  message: Message,
|}> {
  const categoryParts = [];
  const contentParts = [];
  const substitutionOffsets = [];

  const remaining = [...args];
  if (typeof remaining[0] === 'string') {
    const formatString = String(remaining.shift());
    const formatStringParts = formatString.split('%s');
    const substitutionCount = formatStringParts.length - 1;
    const substitutions = remaining.splice(0, substitutionCount);

    let categoryString = '';
    let contentString = '';

    let substitutionIndex = 0;
    for (const formatStringPart of formatStringParts) {
      categoryString += formatStringPart;
      contentString += formatStringPart;

      if (substitutionIndex < substitutionCount) {
        if (substitutionIndex < substitutions.length) {
          // Don't stringify a string type.
          // It adds quotation mark wrappers around the string,
          // which causes the LogBox to look odd.
          const substitution =
            typeof substitutions[substitutionIndex] === 'string'
              ? substitutions[substitutionIndex]
              : stringifySafe(substitutions[substitutionIndex]);
          substitutionOffsets.push({
            length: substitution.length,
            offset: contentString.length,
          });

          categoryString += SUBSTITUTION;
          contentString += substitution;
        } else {
          substitutionOffsets.push({
            length: 2,
            offset: contentString.length,
          });

          categoryString += '%s';
          contentString += '%s';
        }

        substitutionIndex++;
      }
    }

    categoryParts.push(categoryString);
    contentParts.push(contentString);
  }

  const remainingArgs = remaining.map(arg => {
    // Don't stringify a string type.
    // It adds quotation mark wrappers around the string,
    // which causes the LogBox to look odd.
    return typeof arg === 'string' ? arg : stringifySafe(arg);
  });
  categoryParts.push(...remainingArgs);
  contentParts.push(...remainingArgs);

  return {
    category: categoryParts.join(' '),
    message: {
      content: contentParts.join(' '),
      substitutions: substitutionOffsets,
    },
  };
}

export function parseComponentStack(message: string): ComponentStack {
  return message
    .split(/\n {4}in /g)
    .map(s => {
      if (!s) {
        return null;
      }
      const match = s.match(/(.*) \(at (.*\.js):([\d]+)\)/);
      if (!match) {
        return null;
      }

      let [content, fileName, row] = match.slice(1);
      return {
        content,
        fileName,
        location: {column: -1, row: parseInt(row, 10)},
      };
    })
    .filter(Boolean);
}

export function parseLogBoxException(
  error: ExtendedExceptionData,
): LogBoxLogData {
  const message =
    error.originalMessage != null ? error.originalMessage : 'Unknown';

  const babelTransformError = message.match(BABEL_TRANSFORM_ERROR_FORMAT);
  if (babelTransformError) {
    // Transform errors are thrown from inside the Babel transformer.
    const [
      fileName,
      content,
      row,
      column,
      codeFrame,
    ] = babelTransformError.slice(1);

    return {
      level: 'syntax',
      stack: [],
      isComponentError: false,
      componentStack: [],
      codeFrame: {
        fileName,
        location: {
          row: parseInt(row, 10),
          column: parseInt(column, 10),
        },
        content: codeFrame,
      },
      message: {
        content,
        substitutions: [],
      },
      category: `${fileName}-${row}-${column}`,
    };
  }

  const babelCodeFrameError = message.match(BABEL_CODE_FRAME_ERROR_FORMAT);

  if (babelCodeFrameError) {
    // Codeframe errors are thrown from any use of buildCodeFrameError.
    const [fileName, content, codeFrame] = babelCodeFrameError.slice(1);
    return {
      level: 'syntax',
      stack: [],
      isComponentError: false,
      componentStack: [],
      codeFrame: {
        fileName,
        location: null, // We are not given the location.
        content: codeFrame,
      },
      message: {
        content,
        substitutions: [],
      },
      category: `${fileName}-${1}-${1}`,
    };
  }

  const level = message.match(/^TransformError /)
    ? 'syntax'
    : error.isFatal || error.isComponentError
    ? 'fatal'
    : 'error';

  return {
    level: level,
    stack: error.stack,
    isComponentError: error.isComponentError,
    componentStack:
      error.componentStack != null
        ? parseComponentStack(error.componentStack)
        : [],
    ...parseCategory([message]),
  };
}

export function parseLogBoxLog(
  args: $ReadOnlyArray<mixed>,
): {|
  componentStack: ComponentStack,
  category: Category,
  message: Message,
|} {
  const message = args[0];
  let argsWithoutComponentStack = [];
  let componentStack = [];

  // Extract component stack from warnings like "Some warning%s".
  if (
    typeof message === 'string' &&
    message.slice(-2) === '%s' &&
    args.length > 0
  ) {
    const lastArg = args[args.length - 1];
    // Does it look like React component stack? "   in ..."
    if (typeof lastArg === 'string' && /\s{4}in/.test(lastArg)) {
      argsWithoutComponentStack = args.slice(0, -1);
      argsWithoutComponentStack[0] = message.slice(0, -2);
      componentStack = parseComponentStack(lastArg);
    }
  }

  if (componentStack.length === 0) {
    // Try finding the component stack elsewhere.
    for (const arg of args) {
      if (typeof arg === 'string' && /^\n {4}in/.exec(arg)) {
        componentStack = parseComponentStack(arg);
      } else {
        argsWithoutComponentStack.push(arg);
      }
    }
  }

  return {
    ...parseCategory(argsWithoutComponentStack),
    componentStack,
  };
}
