/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @polyfill
 * @nolint
 * @format
 */
import inspect from './inspect';

/* eslint-disable no-shadow, eqeqeq, curly, no-unused-vars, no-void, no-control-regex  */

/**
 * This pipes all of our console logging functions to native logging so that
 * JavaScript errors in required modules show up in Xcode via NSLog.
 */
const OBJECT_COLUMN_NAME = '(index)';
const LOG_LEVELS = {
  trace: 0,
  info: 1,
  warn: 2,
  error: 3,
};
const INSPECTOR_LEVELS = [];
INSPECTOR_LEVELS[LOG_LEVELS.trace] = 'debug';
INSPECTOR_LEVELS[LOG_LEVELS.info] = 'log';
INSPECTOR_LEVELS[LOG_LEVELS.warn] = 'warning';
INSPECTOR_LEVELS[LOG_LEVELS.error] = 'error';

// Strip the inner function in getNativeLogFunction(), if in dev also
// strip method printing to originalConsole.
const INSPECTOR_FRAMES_TO_SKIP = __DEV__ ? 2 : 1;

function getNativeLogFunction(level) {
  return function() {
    let str;
    if (arguments.length === 1 && typeof arguments[0] === 'string') {
      str = arguments[0];
    } else {
      str = Array.prototype.map
        .call(arguments, function(arg) {
          return inspect(arg, {depth: 10});
        })
        .join(', ');
    }

    // TRICKY
    // If more than one argument is provided, the code above collapses them all
    // into a single formatted string. This transform wraps string arguments in
    // single quotes (e.g. "foo" -> "'foo'") which then breaks the "Warning:"
    // check below. So it's important that we look at the first argument, rather
    // than the formatted argument string.
    const firstArg = arguments[0];

    let logLevel = level;
    if (
      typeof firstArg === 'string' &&
      firstArg.slice(0, 9) === 'Warning: ' &&
      logLevel >= LOG_LEVELS.error
    ) {
      // React warnings use console.error so that a stack trace is shown,
      // but we don't (currently) want these to show a redbox
      // (Note: Logic duplicated in ExceptionsManager.js.)
      logLevel = LOG_LEVELS.warn;
    }
    if (global.__inspectorLog) {
      global.__inspectorLog(
        INSPECTOR_LEVELS[logLevel],
        str,
        [].slice.call(arguments),
        INSPECTOR_FRAMES_TO_SKIP,
      );
    }
    if (groupStack.length) {
      str = groupFormat('', str);
    }
    global.nativeLoggingHook(str, logLevel);
  };
}

function repeat(element, n) {
  return Array.apply(null, Array(n)).map(function() {
    return element;
  });
}

function consoleTablePolyfill(rows) {
  // convert object -> array
  if (!Array.isArray(rows)) {
    var data = rows;
    rows = [];
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        var row = data[key];
        row[OBJECT_COLUMN_NAME] = key;
        rows.push(row);
      }
    }
  }
  if (rows.length === 0) {
    global.nativeLoggingHook('', LOG_LEVELS.info);
    return;
  }

  var columns = Object.keys(rows[0]).sort();
  var stringRows = [];
  var columnWidths = [];

  // Convert each cell to a string. Also
  // figure out max cell width for each column
  columns.forEach(function(k, i) {
    columnWidths[i] = k.length;
    for (var j = 0; j < rows.length; j++) {
      var cellStr = (rows[j][k] || '?').toString();
      stringRows[j] = stringRows[j] || [];
      stringRows[j][i] = cellStr;
      columnWidths[i] = Math.max(columnWidths[i], cellStr.length);
    }
  });

  // Join all elements in the row into a single string with | separators
  // (appends extra spaces to each cell to make separators  | aligned)
  function joinRow(row, space) {
    var cells = row.map(function(cell, i) {
      var extraSpaces = repeat(' ', columnWidths[i] - cell.length).join('');
      return cell + extraSpaces;
    });
    space = space || ' ';
    return cells.join(space + '|' + space);
  }

  var separators = columnWidths.map(function(columnWidth) {
    return repeat('-', columnWidth).join('');
  });
  var separatorRow = joinRow(separators, '-');
  var header = joinRow(columns);
  var table = [header, separatorRow];

  for (var i = 0; i < rows.length; i++) {
    table.push(joinRow(stringRows[i]));
  }

  // Notice extra empty line at the beginning.
  // Native logging hook adds "RCTLog >" at the front of every
  // logged string, which would shift the header and screw up
  // the table
  global.nativeLoggingHook('\n' + table.join('\n'), LOG_LEVELS.info);
}

const GROUP_PAD = '\u2502'; // Box light vertical
const GROUP_OPEN = '\u2510'; // Box light down+left
const GROUP_CLOSE = '\u2518'; // Box light up+left

const groupStack = [];

function groupFormat(prefix, msg) {
  // Insert group formatting before the console message
  return groupStack.join('') + prefix + ' ' + (msg || '');
}

function consoleGroupPolyfill(label) {
  global.nativeLoggingHook(groupFormat(GROUP_OPEN, label), LOG_LEVELS.info);
  groupStack.push(GROUP_PAD);
}

function consoleGroupCollapsedPolyfill(label) {
  global.nativeLoggingHook(groupFormat(GROUP_CLOSE, label), LOG_LEVELS.info);
  groupStack.push(GROUP_PAD);
}

function consoleGroupEndPolyfill() {
  groupStack.pop();
  global.nativeLoggingHook(groupFormat(GROUP_CLOSE), LOG_LEVELS.info);
}

function consoleAssertPolyfill(expression, label) {
  if (!expression) {
    global.nativeLoggingHook('Assertion failed: ' + label, LOG_LEVELS.error);
  }
}

if (global.nativeLoggingHook) {
  const originalConsole = global.console;
  // Preserve the original `console` as `originalConsole`
  if (__DEV__ && originalConsole) {
    const descriptor = Object.getOwnPropertyDescriptor(global, 'console');
    if (descriptor) {
      Object.defineProperty(global, 'originalConsole', descriptor);
    }
  }

  global.console = {
    error: getNativeLogFunction(LOG_LEVELS.error),
    info: getNativeLogFunction(LOG_LEVELS.info),
    log: getNativeLogFunction(LOG_LEVELS.info),
    warn: getNativeLogFunction(LOG_LEVELS.warn),
    trace: getNativeLogFunction(LOG_LEVELS.trace),
    debug: getNativeLogFunction(LOG_LEVELS.trace),
    table: consoleTablePolyfill,
    group: consoleGroupPolyfill,
    groupEnd: consoleGroupEndPolyfill,
    groupCollapsed: consoleGroupCollapsedPolyfill,
    assert: consoleAssertPolyfill,
  };

  Object.defineProperty(console, '_isPolyfilled', {
    value: true,
    enumerable: false,
  });

  // If available, also call the original `console` method since that is
  // sometimes useful. Ex: on OS X, this will let you see rich output in
  // the Safari Web Inspector console.
  if (__DEV__ && originalConsole) {
    Object.keys(console).forEach(methodName => {
      const reactNativeMethod = console[methodName];
      if (originalConsole[methodName]) {
        console[methodName] = function() {
          originalConsole[methodName](...arguments);
          reactNativeMethod.apply(console, arguments);
        };
      }
    });

    // The following methods are not supported by this polyfill but
    // we still should pass them to original console if they are
    // supported by it.
    ['clear', 'dir', 'dirxml', 'profile', 'profileEnd'].forEach(methodName => {
      if (typeof originalConsole[methodName] === 'function') {
        console[methodName] = function() {
          originalConsole[methodName](...arguments);
        };
      }
    });
  }
} else if (!global.console) {
  function stub() {}
  const log = global.print || stub;

  global.console = {
    debug: log,
    error: log,
    info: log,
    log: log,
    trace: log,
    warn: log,
    assert(expression, label) {
      if (!expression) {
        log('Assertion failed: ' + label);
      }
    },
    clear: stub,
    dir: stub,
    dirxml: stub,
    group: stub,
    groupCollapsed: stub,
    groupEnd: stub,
    profile: stub,
    profileEnd: stub,
    table: stub,
  };

  Object.defineProperty(console, '_isPolyfilled', {
    value: true,
    enumerable: false,
  });
}
