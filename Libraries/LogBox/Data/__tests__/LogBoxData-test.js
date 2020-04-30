/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 * @flow
 */

'use strict';
jest.mock('../../../Core/Devtools/parseErrorStack', () => {
  return {__esModule: true, default: jest.fn(() => [])};
});

jest.mock('../../../Core/ExceptionsManager');

const LogBoxData = require('../LogBoxData');
const ExceptionsManager: any = require('../../../Core/ExceptionsManager');

const registry = () => {
  const observer = jest.fn();
  LogBoxData.observe(observer).unsubscribe();
  return Array.from(observer.mock.calls[0][0].logs);
};

const filteredRegistry = () => {
  const observer = jest.fn();
  LogBoxData.observe(observer).unsubscribe();
  return Array.from(observer.mock.calls[0][0].logs);
};

const disabledState = () => {
  const observer = jest.fn();
  LogBoxData.observe(observer).unsubscribe();
  return observer.mock.calls[0][0].isDisabled;
};

const selectedLogIndex = () => {
  const observer = jest.fn();
  LogBoxData.observe(observer).unsubscribe();
  return observer.mock.calls[0][0].selectedLogIndex;
};

const observe = () => {
  const observer = jest.fn();
  return {
    observer,
    subscription: LogBoxData.observe(observer),
  };
};

const addLogs = logs => {
  logs.forEach(message => {
    LogBoxData.addLog({
      level: 'warn',
      message: {
        content: message,
        substitutions: [],
      },
      category: message,
      componentStack: [],
    });
  });
};

const addSoftErrors = errors => {
  errors.forEach(error => {
    LogBoxData.addException(
      Object.assign(
        {},
        {
          message: '',
          isComponentError: false,
          originalMessage: '',
          name: 'console.error',
          componentStack: '',
          stack: [],
          id: 0,
          isFatal: false,
        },
        typeof error === 'string'
          ? {message: error, originalMessage: error}
          : error,
      ),
    );
  });
};

const addFatalErrors = errors => {
  errors.forEach(error => {
    LogBoxData.addException(
      Object.assign(
        {},
        {
          message: '',
          isComponentError: false,
          originalMessage: '',
          name: 'console.error',
          componentStack: '',
          stack: [],
          id: 0,
          isFatal: true,
        },
        typeof error === 'string'
          ? {message: error, originalMessage: error}
          : error,
      ),
    );
  });
};

const addSyntaxError = () => {
  addFatalErrors([
    {
      message: `

  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
      originalMessage: `TransformError SyntaxError: /path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js: 'import' and 'export' may only appear at the top level (199:0)

  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
    },
  ]);
};

beforeEach(() => {
  jest.resetModules();
});

const flushLogs = () => {
  jest.runAllImmediates();
  jest.runAllTimers();
};

describe('LogBoxData', () => {
  it('adds and dismisses logs', () => {
    addLogs(['A']);
    addSoftErrors(['B']);
    addFatalErrors(['C']);
    addSyntaxError();
    flushLogs();

    expect(registry().length).toBe(4);
    expect(registry()[0]).toBeDefined();
    expect(registry()[1]).toBeDefined();

    LogBoxData.dismiss(registry()[0]);
    expect(registry().length).toBe(3);
    LogBoxData.dismiss(registry()[0]);
    expect(registry().length).toBe(2);
    LogBoxData.dismiss(registry()[0]);
    expect(registry().length).toBe(1);
    LogBoxData.dismiss(registry()[0]);
    expect(registry().length).toBe(0);
    expect(registry()[0]).toBeUndefined();
  });

  it('clears all logs', () => {
    addLogs(['A', 'B']);
    addSoftErrors(['C', 'D']);
    addFatalErrors(['E', 'F']);
    addSyntaxError();
    flushLogs();

    expect(registry().length).toBe(7);
    expect(selectedLogIndex()).toBe(4); // Fatal index.

    LogBoxData.clear();
    expect(registry().length).toBe(0);
    expect(selectedLogIndex()).toBe(-1); // Reset selected index.
  });

  it('clears only warnings', () => {
    addLogs(['A', 'B']);
    addSoftErrors(['C', 'D', 'E']);
    addSyntaxError();
    flushLogs();

    expect(registry().length).toBe(6);
    expect(selectedLogIndex()).toBe(5); // Fatal index.

    LogBoxData.clearWarnings();
    expect(registry().length).toBe(4);
    expect(selectedLogIndex()).toBe(3); // New fatal index.
  });

  it('clears errors and fatals, but not syntax errors.', () => {
    addLogs(['A', 'B']);
    addSoftErrors(['C', 'D', 'E']);
    addFatalErrors(['F']);
    addSyntaxError();
    flushLogs();

    expect(registry().length).toBe(7);
    expect(selectedLogIndex()).toBe(5); // Fatal index.

    LogBoxData.clearErrors();
    expect(registry().length).toBe(3);
    expect(selectedLogIndex()).toBe(2); // New Fatal index.
  });

  it('clears all types except syntax errors', () => {
    addLogs(['A', 'B']);
    addSoftErrors(['C', 'D', 'E']);
    addFatalErrors(['F']);
    addSyntaxError();
    flushLogs();

    expect(registry().length).toBe(7);
    expect(selectedLogIndex()).toBe(5); // Fatal index.

    LogBoxData.clearErrors();
    LogBoxData.clearWarnings();
    expect(registry().length).toBe(1);
    expect(selectedLogIndex()).toBe(0); // New Fatal index.
  });

  it('keeps logs in chronological order', () => {
    addLogs(['A']);
    addSoftErrors(['B']);
    addFatalErrors(['C']);
    flushLogs();
    addLogs(['D']);
    flushLogs();

    let logs = registry();
    expect(logs.length).toBe(4);
    expect(logs[0].category).toEqual('A');
    expect(logs[1].category).toEqual('B');
    expect(logs[2].category).toEqual('C');
    expect(logs[3].category).toEqual('D');

    addLogs(['A']);
    jest.runAllImmediates();

    // Expect `A` to be added to the end of the registry.
    logs = registry();
    expect(logs.length).toBe(5);
    expect(logs[0].category).toEqual('A');
    expect(logs[1].category).toEqual('B');
    expect(logs[2].category).toEqual('C');
    expect(logs[3].category).toEqual('D');
    expect(logs[4].category).toEqual('A');
  });

  it('sets the selectedLogIndex', () => {
    expect(selectedLogIndex()).toBe(-1);

    LogBoxData.setSelectedLog(1);
    flushLogs();

    expect(selectedLogIndex()).toBe(1);
  });

  it('does not set the selectedLogIndex for warnings', () => {
    addLogs(['A']);
    flushLogs();

    expect(selectedLogIndex()).toBe(-1);
  });

  it('does not set the selectedLogIndex for soft errors', () => {
    addSoftErrors(['A']);
    flushLogs();

    expect(selectedLogIndex()).toBe(-1);
  });

  it('sets the selectedLogIndex to the last fatal error (after symbolication)', () => {
    addFatalErrors(['A']);

    // Order maters for symbolication before timeout.
    flushLogs();
    jest.runAllTimers();

    expect(selectedLogIndex()).toBe(0);

    addLogs(['B']);
    addFatalErrors(['C']);

    // Order maters for symbolication before timeout.
    flushLogs();
    jest.runAllTimers();

    expect(selectedLogIndex()).toBe(2);
  });

  it('sets the selectedLogIndex to the last fatal error (hitting timeout limit)', () => {
    addFatalErrors(['A']);

    // Order maters for timeout before symbolication.
    jest.runAllTimers();
    flushLogs();

    expect(selectedLogIndex()).toBe(0);

    addLogs(['B']);
    addFatalErrors(['C']);

    // Order maters for timeout before symbolication.
    jest.runAllTimers();
    flushLogs();

    expect(selectedLogIndex()).toBe(2);
  });

  it('sets the selectedLogIndex to the last syntax error', () => {
    addSyntaxError();
    flushLogs();

    expect(selectedLogIndex()).toBe(0);

    addLogs(['B']);
    addSyntaxError();
    flushLogs();

    expect(selectedLogIndex()).toBe(2);
  });

  it('keeps selectedLogIndex set to the syntax error even when a new fatal is added', () => {
    addSyntaxError();
    flushLogs();

    expect(selectedLogIndex()).toBe(0);

    addLogs(['B']);
    addFatalErrors(['C']);
    flushLogs();

    expect(selectedLogIndex()).toBe(0);
  });

  it('keeps selectedLogIndex set to the syntax error even when explicitly changed', () => {
    addSyntaxError();
    flushLogs();

    expect(selectedLogIndex()).toBe(0);

    LogBoxData.setSelectedLog(1);
    flushLogs();

    expect(selectedLogIndex()).toBe(0);
  });

  it('increments the count of previous log with matching category (logs)', () => {
    addLogs(['A', 'B']);
    flushLogs();

    let logs = registry();
    expect(logs.length).toBe(2);
    expect(logs[0].category).toEqual('A');
    expect(logs[0].count).toBe(1);
    expect(logs[1].category).toEqual('B');
    expect(logs[1].count).toBe(1);

    addLogs(['B']);
    flushLogs();

    // Expect `B` to be rolled into the last log.
    logs = registry();
    expect(logs.length).toBe(2);
    expect(logs[0].category).toEqual('A');
    expect(logs[0].count).toBe(1);
    expect(logs[1].category).toEqual('B');
    expect(logs[1].count).toBe(2);
  });

  it('increments the count of previous log with matching category (errors)', () => {
    addFatalErrors(['A', 'B']);
    flushLogs();

    let logs = registry();
    expect(logs.length).toBe(2);
    expect(logs[0].category).toEqual('A');
    expect(logs[0].count).toBe(1);
    expect(logs[1].category).toEqual('B');
    expect(logs[1].count).toBe(1);

    addSoftErrors(['B']);
    flushLogs();

    // Expect `B` to be rolled into the last log.
    logs = registry();
    expect(logs.length).toBe(2);
    expect(logs[0].category).toEqual('A');
    expect(logs[0].count).toBe(1);
    expect(logs[1].category).toEqual('B');
    expect(logs[1].count).toBe(2);
  });

  it('increments the count of previous log with matching category (syntax)', () => {
    addSyntaxError();
    flushLogs();

    let logs = registry();
    expect(logs.length).toBe(1);
    expect(logs[0].count).toBe(1);

    addSyntaxError();
    flushLogs();

    logs = registry();
    expect(logs.length).toBe(1);
    expect(logs[0].count).toBe(2);
  });

  it('ignores logs matching patterns (logs)', () => {
    addLogs(['A!', 'B?', 'C!']);
    flushLogs();

    expect(filteredRegistry().length).toBe(3);

    LogBoxData.addIgnorePatterns(['!']);
    expect(filteredRegistry().length).toBe(1);

    LogBoxData.addIgnorePatterns(['?']);
    expect(filteredRegistry().length).toBe(0);
  });

  it('ignores logs matching patterns (errors)', () => {
    addSoftErrors(['A!', 'B?']);
    addFatalErrors(['C!']);
    flushLogs();

    expect(filteredRegistry().length).toBe(3);

    LogBoxData.addIgnorePatterns(['!']);
    expect(filteredRegistry().length).toBe(1);

    LogBoxData.addIgnorePatterns(['?']);
    expect(filteredRegistry().length).toBe(0);
  });

  it('ignores matching regexs or pattern (logs)', () => {
    addLogs(['There are 4 dogs', 'There are 3 cats', 'There are H cats']);
    flushLogs();

    expect(filteredRegistry().length).toBe(3);

    LogBoxData.addIgnorePatterns(['dogs']);
    expect(filteredRegistry().length).toBe(2);

    LogBoxData.addIgnorePatterns([/There are \d+ cats/]);
    expect(filteredRegistry().length).toBe(1);

    LogBoxData.addIgnorePatterns(['cats']);
    expect(filteredRegistry().length).toBe(0);
  });

  it('ignores matching regexs or pattern (errors)', () => {
    addSoftErrors(['There are 4 dogs', 'There are 3 cats']);
    addFatalErrors(['There are H cats']);
    flushLogs();

    expect(filteredRegistry().length).toBe(3);

    LogBoxData.addIgnorePatterns(['dogs']);
    expect(filteredRegistry().length).toBe(2);

    LogBoxData.addIgnorePatterns([/There are \d+ cats/]);
    expect(filteredRegistry().length).toBe(1);

    LogBoxData.addIgnorePatterns(['cats']);
    expect(filteredRegistry().length).toBe(0);
  });

  it('ignores all logs except fatals when disabled', () => {
    addLogs(['A!']);
    addSoftErrors(['B?']);
    addFatalErrors(['C!']);
    addSyntaxError();
    flushLogs();

    expect(registry().length).toBe(4);
    expect(disabledState()).toBe(false);

    LogBoxData.setDisabled(true);
    expect(registry().length).toBe(4);
    expect(disabledState()).toBe(true);

    LogBoxData.setDisabled(false);
    expect(registry().length).toBe(4);
    expect(disabledState()).toBe(false);
  });

  it('immediately updates new observers', () => {
    const {observer: observerOne} = observe();

    expect(observerOne.mock.calls.length).toBe(1);

    const observerTwo = jest.fn();
    LogBoxData.observe(observerTwo).unsubscribe();
    expect(observerTwo.mock.calls.length).toBe(1);
    expect(observerOne.mock.calls[0][0]).toEqual(observerTwo.mock.calls[0][0]);
  });

  it('sends batched updates asynchronously', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    addLogs(['A']);
    flushLogs();
    expect(observer.mock.calls.length).toBe(2);

    // We expect observers to recieve the same Set object in sequential updates
    // so that it doesn't break memoization for components observing state.
    expect(observer.mock.calls[0][0].logs).toBe(observer.mock.calls[1][0].logs);
  });

  it('stops sending updates to unsubscribed observers', () => {
    const {observer: observerOne, subscription} = observe();
    subscription.unsubscribe();

    expect(observerOne.mock.calls.length).toBe(1);

    const observerTwo = jest.fn();
    LogBoxData.observe(observerTwo).unsubscribe();
    expect(observerTwo.mock.calls.length).toBe(1);
    expect(observerOne.mock.calls[0][0]).toEqual(observerTwo.mock.calls[0][0]);
  });

  it('updates observers when a log is added or dismissed', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    addLogs(['A']);
    flushLogs();
    expect(observer.mock.calls.length).toBe(2);

    const lastLog = Array.from(observer.mock.calls[1][0].logs)[0];
    LogBoxData.dismiss(lastLog);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing when category does not exist.
    LogBoxData.dismiss(lastLog);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);
  });

  it('updates observers when cleared', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    addLogs(['A']);
    flushLogs();
    expect(observer.mock.calls.length).toBe(2);

    LogBoxData.clear();
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing when already empty.
    LogBoxData.clear();
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);
  });

  it('updates observers when warnings cleared', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    addLogs(['A']);
    addSoftErrors(['B']);
    addFatalErrors(['C']);
    addSyntaxError();
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(2);

    LogBoxData.clearWarnings();
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing when already empty.
    LogBoxData.clearWarnings();
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);
  });

  it('updates observers when errors cleared', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    addLogs(['A']);
    addSoftErrors(['B']);
    addFatalErrors(['C']);
    addSyntaxError();
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(2);

    LogBoxData.clearErrors();
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing when already empty.
    LogBoxData.clearErrors();
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);
  });

  it('updates observers when an ignore pattern is added', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    LogBoxData.addIgnorePatterns(['?']);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(2);

    LogBoxData.addIgnorePatterns(['!']);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing for an existing ignore pattern.
    LogBoxData.addIgnorePatterns(['!']);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);
  });

  it('updates observers when disabled or enabled', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    LogBoxData.setDisabled(true);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(2);

    // Does nothing when already disabled.
    LogBoxData.setDisabled(true);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(2);

    LogBoxData.setDisabled(false);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing when already enabled.
    LogBoxData.setDisabled(false);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);
  });

  it('reportLogBoxError creates a native redbox with a componentStack', () => {
    LogBoxData.reportLogBoxError(
      new Error('Simulated Error'),
      '    in Component (file.js:1)',
    );

    const receivedError = ExceptionsManager.handleException.mock.calls[0][0];
    expect(receivedError.componentStack).toBe('    in Component (file.js:1)');
    expect(receivedError.forceRedbox).toBe(true);
    expect(receivedError.message).toBe(
      'An error was thrown when attempting to render log messages via LogBox.\n\nSimulated Error',
    );
  });

  it('reportLogBoxError creates a native redbox without a componentStack', () => {
    LogBoxData.reportLogBoxError(new Error('Simulated Error'));

    const receivedError = ExceptionsManager.handleException.mock.calls[0][0];
    expect(receivedError.componentStack).toBeUndefined();
    expect(receivedError.forceRedbox).toBe(true);
    expect(receivedError.message).toBe(
      'An error was thrown when attempting to render log messages via LogBox.\n\nSimulated Error',
    );
  });

  it('reportLogBoxError creates an error message that is also ignored', () => {
    LogBoxData.reportLogBoxError(new Error('Simulated Error'));

    const receivedErrorMessage =
      ExceptionsManager.handleException.mock.calls[0][0].message;

    expect(LogBoxData.isLogBoxErrorMessage(receivedErrorMessage)).toBe(true);
    expect(LogBoxData.isLogBoxErrorMessage('Some other error')).toBe(false);
  });

  it('getAppInfo returns null without any function registered', () => {
    expect(LogBoxData.getAppInfo()).toBe(null);
  });

  it('getAppInfo returns the registered app info', () => {
    const info = {
      appVersion: 'App Version',
      engine: 'Hermes',
    };

    LogBoxData.setAppInfo(() => info);
    expect(LogBoxData.getAppInfo()).toBe(info);
  });
});
