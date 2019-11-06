/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 * @flow strict-local
 */

'use strict';
jest.mock('../../../Core/Devtools/parseErrorStack', () => {
  return {__esModule: true, default: jest.fn(() => [])};
});

const LogBoxData = require('../LogBoxData');

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

const addExceptions = errors => {
  errors.forEach(error => {
    LogBoxData.addException(
      Object.assign(
        {},
        {
          message: '',
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

const addSyntaxError = () => {
  addExceptions([
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

describe('LogBoxData', () => {
  it('adds and dismisses logs', () => {
    addLogs(['A']);
    addExceptions(['B']);
    jest.runAllImmediates();

    expect(registry().length).toBe(2);
    expect(registry()[0]).toBeDefined();
    expect(registry()[1]).toBeDefined();

    LogBoxData.dismiss(registry()[0]);
    expect(registry().length).toBe(1);
    LogBoxData.dismiss(registry()[0]);
    expect(registry().length).toBe(0);
    expect(registry()[0]).toBeUndefined();
  });

  it('clears all logs', () => {
    addLogs(['A', 'B']);
    addExceptions(['C', 'D']);
    jest.runAllImmediates();

    expect(registry().length).toBe(4);

    LogBoxData.clear();
    expect(registry().length).toBe(0);
  });

  it('clears only warnings', () => {
    addLogs(['A', 'B']);
    addExceptions(['C', 'D', 'E']);
    addSyntaxError();
    jest.runAllImmediates();

    expect(registry().length).toBe(6);

    LogBoxData.clearWarnings();
    expect(registry().length).toBe(4);
  });

  it('clears only errors', () => {
    addLogs(['A', 'B']);
    addExceptions(['C', 'D', 'E']);
    addSyntaxError();
    jest.runAllImmediates();

    expect(registry().length).toBe(6);

    LogBoxData.clearErrors();
    expect(registry().length).toBe(3);
  });

  it('clears only syntax errors', () => {
    addLogs(['A', 'B']);
    addExceptions(['C', 'D', 'E']);
    addSyntaxError();
    jest.runAllImmediates();

    expect(registry().length).toBe(6);

    LogBoxData.clearSyntaxErrors();
    expect(registry().length).toBe(5);
  });

  it('clears all types', () => {
    addLogs(['A', 'B']);
    addExceptions(['C', 'D', 'E']);
    addSyntaxError();
    jest.runAllImmediates();

    expect(registry().length).toBe(6);

    LogBoxData.clearErrors();
    LogBoxData.clearWarnings();
    LogBoxData.clearSyntaxErrors();
    expect(registry().length).toBe(0);
  });

  it('keeps logs in chronological order', () => {
    addLogs(['A']);
    addExceptions(['B']);
    addLogs(['C']);
    jest.runAllImmediates();

    let logs = registry();
    expect(logs.length).toBe(3);
    expect(logs[0].category).toEqual('A');
    expect(logs[1].category).toEqual('B');
    expect(logs[2].category).toEqual('C');

    addLogs(['A']);
    jest.runAllImmediates();

    // Expect `A` to be added to the end of the registry.
    logs = registry();
    expect(logs.length).toBe(4);
    expect(logs[0].category).toEqual('A');
    expect(logs[1].category).toEqual('B');
    expect(logs[2].category).toEqual('C');
    expect(logs[3].category).toEqual('A');
  });

  it('increments the count of previous log with matching category (logs)', () => {
    addLogs(['A', 'B']);
    jest.runAllImmediates();

    let logs = registry();
    expect(logs.length).toBe(2);
    expect(logs[0].category).toEqual('A');
    expect(logs[0].count).toBe(1);
    expect(logs[1].category).toEqual('B');
    expect(logs[1].count).toBe(1);

    addLogs(['B']);
    jest.runAllImmediates();

    // Expect `B` to be rolled into the last log.
    logs = registry();
    expect(logs.length).toBe(2);
    expect(logs[0].category).toEqual('A');
    expect(logs[0].count).toBe(1);
    expect(logs[1].category).toEqual('B');
    expect(logs[1].count).toBe(2);
  });

  it('increments the count of previous log with matching category (exceptions)', () => {
    addExceptions(['A', 'B']);
    jest.runAllImmediates();

    let logs = registry();
    expect(logs.length).toBe(2);
    expect(logs[0].category).toEqual('A');
    expect(logs[0].count).toBe(1);
    expect(logs[1].category).toEqual('B');
    expect(logs[1].count).toBe(1);

    addExceptions(['B']);
    jest.runAllImmediates();

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
    jest.runAllImmediates();

    let logs = registry();
    expect(logs.length).toBe(1);
    expect(logs[0].count).toBe(1);

    addSyntaxError();
    jest.runAllImmediates();

    logs = registry();
    expect(logs.length).toBe(1);
    expect(logs[0].count).toBe(2);
  });

  it('ignores logs matching patterns (logs)', () => {
    addLogs(['A!', 'B?', 'C!']);
    jest.runAllImmediates();

    expect(filteredRegistry().length).toBe(3);

    LogBoxData.addIgnorePatterns(['!']);
    expect(filteredRegistry().length).toBe(1);

    LogBoxData.addIgnorePatterns(['?']);
    expect(filteredRegistry().length).toBe(0);
  });

  it('ignores logs matching patterns (exceptions)', () => {
    addExceptions(['A!', 'B?', 'C!']);
    jest.runAllImmediates();

    expect(filteredRegistry().length).toBe(3);

    LogBoxData.addIgnorePatterns(['!']);
    expect(filteredRegistry().length).toBe(1);

    LogBoxData.addIgnorePatterns(['?']);
    expect(filteredRegistry().length).toBe(0);
  });

  it('ignores matching regexs or pattern (logs)', () => {
    addLogs(['There are 4 dogs', 'There are 3 cats', 'There are H cats']);
    jest.runAllImmediates();

    expect(filteredRegistry().length).toBe(3);

    LogBoxData.addIgnorePatterns(['dogs']);
    expect(filteredRegistry().length).toBe(2);

    LogBoxData.addIgnorePatterns([/There are \d+ cats/]);
    expect(filteredRegistry().length).toBe(1);

    LogBoxData.addIgnorePatterns(['cats']);
    expect(filteredRegistry().length).toBe(0);
  });

  it('ignores matching regexs or pattern (exceptions)', () => {
    addExceptions(['There are 4 dogs', 'There are 3 cats', 'There are H cats']);
    jest.runAllImmediates();

    expect(filteredRegistry().length).toBe(3);

    LogBoxData.addIgnorePatterns(['dogs']);
    expect(filteredRegistry().length).toBe(2);

    LogBoxData.addIgnorePatterns([/There are \d+ cats/]);
    expect(filteredRegistry().length).toBe(1);

    LogBoxData.addIgnorePatterns(['cats']);
    expect(filteredRegistry().length).toBe(0);
  });

  it('ignores all logs except fatals when disabled', () => {
    addLogs(['A!', 'B?']);
    addExceptions(['C!']);
    addSyntaxError();
    jest.runAllImmediates();

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
    jest.runAllImmediates();
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
    jest.runAllImmediates();
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
    jest.runAllImmediates();
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
    addExceptions(['B']);
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
    addExceptions(['B']);
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

  it('updates observers when syntax errors cleared', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    addLogs(['A']);
    addSyntaxError();
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(2);

    LogBoxData.clearSyntaxErrors();
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing when already empty.
    LogBoxData.clearSyntaxErrors();
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
});
