// Jest fatals for the following statement (minimal repro case)
//
//   exports.something = Symbol;
//
// Until it is fixed, mocking the entire node module makes the
// problem go away.

'use strict';

function EventTarget() {
  // Support both EventTarget and EventTarget(...)
  // as a super class, just like the original module does.
  if (arguments.length > 0) {
    return EventTarget;
  }
}

module.exports = EventTarget;
