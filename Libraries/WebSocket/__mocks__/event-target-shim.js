// Jest fatals for the following statement (minimal repro case)
//
//   exports.something = Symbol;
//
// Until it is fixed, mocking the entire node module makes the
// problem go away.

'use strict';
module.exports = function() {};
