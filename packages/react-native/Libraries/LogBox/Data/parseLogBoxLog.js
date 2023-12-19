/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {ExceptionData} from '../../Core/NativeExceptionsManager';
import type {LogBoxLogData} from './LogBoxLog';

import parseErrorStack from '../../Core/Devtools/parseErrorStack';
import UTFSequence from '../../UTFSequence';
import stringifySafe from '../../Utilities/stringifySafe';
import ansiRegex from 'ansi-regex';

const ANSI_REGEX = ansiRegex().source;

const BABEL_TRANSFORM_ERROR_FORMAT =
  /^(?:TransformError )?(?:SyntaxError: |ReferenceError: )(.*): (.*) \((\d+):(\d+)\)\n\n([\s\S]+)/;

// https://github.com/babel/babel/blob/33dbb85e9e9fe36915273080ecc42aee62ed0ade/packages/babel-code-frame/src/index.ts#L183-L184
const BABEL_CODE_FRAME_MARKER_PATTERN = new RegExp(
  [
    // Beginning of a line (per 'm' flag)
    '^',
    // Optional ANSI escapes for colors
    `(?:${ANSI_REGEX})*`,
    // Marker
    '>',
    // Optional ANSI escapes for colors
    `(?:${ANSI_REGEX})*`,
    // Left padding for line number
    ' +',
    // Line number
    '[0-9]+',
    // Gutter
    ' \\|',
  ].join(''),
  'm',
);

const BABEL_CODE_FRAME_ERROR_FORMAT =
  // eslint-disable-next-line no-control-regex
  /^(?:TransformError )?(?:.*):? (?:.*?)(\/.*): ([\s\S]+?)\n([ >]{2}[\d\s]+ \|[\s\S]+|\u{001b}[\s\S]+)/u;

const METRO_ERROR_FORMAT =
  /^(?:InternalError Metro has encountered an error:) (.*): (.*) \((\d+):(\d+)\)\n\n([\s\S]+)/u;

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

  // TODO: When React switched to using call stack frames,
  // we gained the ability to use the collapse flag, but
  // it is not integrated into the LogBox UI.
  collapse?: boolean,
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

export function parseInterpolation(args: $ReadOnlyArray<mixed>): $ReadOnly<{|
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

function isComponentStack(consoleArgument: string) {
  const isOldComponentStackFormat = / {4}in/.test(consoleArgument);
  const isNewComponentStackFormat = / {4}at/.test(consoleArgument);
  const isNewJSCComponentStackFormat = /@.*\n/.test(consoleArgument);

  return (
    isOldComponentStackFormat ||
    isNewComponentStackFormat ||
    isNewJSCComponentStackFormat
  );
}

export function parseComponentStack(message: string): ComponentStack {
  // In newer versions of React, the component stack is formatted as a call stack frame.
  // First try to parse the component stack as a call stack frame, and if that doesn't
  // work then we'll fallback to the old custom component stack format parsing.
  const stack = parseErrorStack(message);
  if (stack && stack.length > 0) {
    return stack.map(frame => ({
      content: frame.methodName,
      collapse: frame.collapse || false,
      fileName: frame.file == null ? 'unknown' : frame.file,
      location: {
        column: frame.column == null ? -1 : frame.column,
        row: frame.lineNumber == null ? -1 : frame.lineNumber,
      },
    }));
  }

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

  const metroInternalError = message.match(METRO_ERROR_FORMAT);
  if (metroInternalError) {
    const [content, fileName, row, column, codeFrame] =
      metroInternalError.slice(1);

    return {
      level: 'fatal',
      type: 'Metro Error',
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

  const babelTransformError = message.match(BABEL_TRANSFORM_ERROR_FORMAT);
  if (babelTransformError) {
    // Transform errors are thrown from inside the Babel transformer.
    const [fileName, content, row, column, codeFrame] =
      babelTransformError.slice(1);

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

  // Perform a cheap match first before trying to parse the full message, which
  // can get expensive for arbitrary input.
  if (BABEL_CODE_FRAME_MARKER_PATTERN.test(message)) {
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
  }

  if (message.match(/^TransformError /)) {
    return {
      level: 'syntax',
      stack: error.stack,
      isComponentError: error.isComponentError,
      componentStack: [],
      message: {
        content: message,
        substitutions: [],
      },
      category: message,
    };
  }

  const componentStack = error.componentStack;
  if (error.isFatal || error.isComponentError) {
    return {
      level: 'fatal',
      stack: error.stack,
      isComponentError: error.isComponentError,
      componentStack:
        componentStack != null ? parseComponentStack(componentStack) : [],
      ...parseInterpolation([message]),
    };
  }

  if (componentStack != null) {
    // It is possible that console errors have a componentStack.
    return {
      level: 'error',
      stack: error.stack,
      isComponentError: error.isComponentError,
      componentStack: parseComponentStack(componentStack),
      ...parseInterpolation([message]),
    };
  }

  // Most `console.error` calls won't have a componentStack. We parse them like
  // regular logs which have the component stack buried in the message.
  return {
    level: 'error',
    stack: error.stack,
    isComponentError: error.isComponentError,
    ...parseLogBoxLog([message]),
  };
}

export function parseLogBoxLog(args: $ReadOnlyArray<mixed>): {|
  componentStack: ComponentStack,
  category: Category,
  message: Message,
|} {
  const message = args[0];
  let argsWithoutComponentStack: Array<mixed> = [];
  let componentStack: ComponentStack = [];

  // Extract component stack from warnings like "Some warning%s".
  if (
    typeof message === 'string' &&
    message.slice(-2) === '%s' &&
    args.length > 0
  ) {
    const lastArg = args[args.length - 1];
    if (typeof lastArg === 'string' && isComponentStack(lastArg)) {
      argsWithoutComponentStack = args.slice(0, -1);
      argsWithoutComponentStack[0] = message.slice(0, -2);
      componentStack = parseComponentStack(lastArg);
    }
  }

  if (componentStack.length === 0) {
    // Try finding the component stack elsewhere.
    for (const arg of args) {
      if (typeof arg === 'string' && isComponentStack(arg)) {
        // Strip out any messages before the component stack.
        let messageEndIndex = arg.search(/\n {4}(in|at) /);
        if (messageEndIndex < 0) {
          // Handle JSC component stacks.
          messageEndIndex = arg.search(/\n/);
        }
        if (messageEndIndex > 0) {
          argsWithoutComponentStack.push(arg.slice(0, messageEndIndex));
        }

        componentStack = parseComponentStack(arg);
      } else {
        argsWithoutComponentStack.push(arg);
      }
    }
  }

  return {
    ...parseInterpolation(argsWithoutComponentStack),
    componentStack,
  };
}
