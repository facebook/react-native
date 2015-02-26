/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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

  function setupConsole(global) {

    if (!global.nativeLoggingHook) {
      return;
    }

    function doNativeLog() {
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
      global.nativeLoggingHook(str);
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
        global.nativeLoggingHook('');
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
      global.nativeLoggingHook('\n' + table.join('\n'));
    }

    global.console = {
      error: doNativeLog,
      info: doNativeLog,
      log: doNativeLog,
      warn: doNativeLog,
      table: consoleTablePolyfill
    };

  }

  if (typeof module !== 'undefined') {
    module.exports = setupConsole;
  } else {
    setupConsole(global);
  }

})(this);
