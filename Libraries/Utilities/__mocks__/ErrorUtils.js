// This mock only provides short-circuited methods of applyWithGuard and guard.
// A lot of modules rely on these two functions. This mock relieves their tests
// from depending on the real ErrorUtils module. If you need real error handling
// don't use this mock.
'use strict';

function execute(fun, context, args) {
  return fun.apply(context, args);
}

function reportError(error) {
  throw error;
}

var ErrorUtils = {
  apply: jest.genMockFunction().mockImplementation(execute),
  applyWithGuard: jest.genMockFunction().mockImplementation(execute),
  guard: jest.genMockFunction().mockImplementation(callback => callback),
  inGuard: jest.genMockFunction().mockReturnValue(true),
  reportError: jest.genMockFunction().mockImplementation(reportError),
  setGlobalHandler: jest.genMockFunction(),
};

module.exports = ErrorUtils;
