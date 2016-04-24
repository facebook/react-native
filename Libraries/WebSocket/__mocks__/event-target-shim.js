// Jest fatals for the following statement (minimal repro case)
//
//   exports.something = Symbol;
//
// Until it is fixed, mocking the entire node module makes the
// problem go away.

'use strict';

function EventTarget() {
  // Support both EventTarget and EventTarget([list, of, events])
  // as a super class, just like the original module does.
  if (arguments.length === 1 && Array.isArray(arguments[0])) {
    return EventTarget;
  }
}

module.exports = EventTarget;
