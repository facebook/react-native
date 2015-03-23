/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * This pipes all of our console logging functions to native logging so that
 * JavaScript errors in required modules show up in Xcode via NSLog.
 *
 * @provides console
 * @polyfill
 */

/*eslint global-strict:0*/
(function(global) {
  'use strict';

  var OBJECT_COLUMN_NAME = '(index)';
  var LOG_LEVELS = {
    trace: 0,
    log: 1,
    info: 2,
    warn: 3,
    error: 4
  };

  function setupConsole(global) {

    if (!global.nativeLoggingHook) {
      return;
    }

    function getNativeLogFunction(level) {
      return function() {
        var str = Array.prototype.map.call(arguments, function(arg) {
          if (arg == null) {
            return arg === null ? 'null' : 'undefined';
          } else if (typeof arg === 'string') {
            return '"' + arg + '"';
          } else {
            // Perform a try catch, just in case the object has a circular
            // reference or stringify throws for some other reason.
            try {
              return JSON.stringify(arg);
            } catch (e) {
              if (typeof arg.toString === 'function') {
                try {
                  return arg.toString();
                } catch (E) {
                  return 'unknown';
                }
              }
            }
          }
        }).join(', ');
        global.nativeLoggingHook(str, level);
      };
    }

    var repeat = function(element, n) {
      return Array.apply(null, Array(n)).map(function() { return element; });
    };

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
        global.nativeLoggingHook('', LOG_LEVELS.log);
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
          var cellStr = rows[j][k].toString();
          stringRows[j] = stringRows[j] || [];
          stringRows[j][i] = cellStr;
          columnWidths[i] = Math.max(columnWidths[i], cellStr.length);
        }
      });

      // Join all elements in the row into a single string with | separators
      // (appends extra spaces to each cell to make separators  | alligned)
      var joinRow = function(row, space) {
        var cells = row.map(function(cell, i) {
          var extraSpaces = repeat(' ', columnWidths[i] - cell.length).join('');
          return cell + extraSpaces;
        });
        space = space || ' ';
        return cells.join(space + '|' + space);
      };

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
      global.nativeLoggingHook('\n' + table.join('\n'), LOG_LEVELS.log);
    }

    global.console = {
      error: getNativeLogFunction(LOG_LEVELS.error),
      info: getNativeLogFunction(LOG_LEVELS.info),
      log: getNativeLogFunction(LOG_LEVELS.log),
      warn: getNativeLogFunction(LOG_LEVELS.warn),
      trace: getNativeLogFunction(LOG_LEVELS.trace),
      table: consoleTablePolyfill
    };

  }

  if (typeof module !== 'undefined') {
    module.exports = setupConsole;
  } else {
    setupConsole(global);
  }

})(this);
