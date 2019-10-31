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
  return Array.from(observer.mock.calls[0][0]);
};

const filteredRegistry = () => {
  const observer = jest.fn();
  LogBoxData.observe(observer).unsubscribe();
  return Array.from(observer.mock.calls[0][0]);
};

const observe = () => {
  const observer = jest.fn();
  return {
    observer,
    subscription: LogBoxData.observe(observer),
  };
};

const addLogs = logs => {
  logs.forEach(log => {
    LogBoxData.addLog('warn', typeof log === 'string' ? [log] : log);
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
    addLogs(['A', 'B', 'C']);
    addExceptions(['D']);
    jest.runAllImmediates();

    expect(registry().length).toBe(4);

    LogBoxData.clear();
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

  it('ignores all logs when disabled', () => {
    addLogs(['A!', 'B?']);
    addExceptions(['C!']);
    jest.runAllImmediates();

    expect(registry().length).toBe(3);

    LogBoxData.setDisabled(true);
    expect(registry().length).toBe(0);

    LogBoxData.setDisabled(false);
    expect(registry().length).toBe(3);
  });

  it('groups consecutive logs by format string categories', () => {
    addLogs([['%s', 'A']]);
    jest.runAllImmediates();
    expect(registry().length).toBe(1);
    expect(registry()[0].count).toBe(1);

    addLogs([['%s', 'B']]);
    jest.runAllImmediates();
    expect(registry().length).toBe(1);
    expect(registry()[0].count).toBe(2);

    addLogs(['A']);
    jest.runAllImmediates();
    expect(registry().length).toBe(2);
    expect(registry()[1].count).toBe(1);

    addLogs(['B']);
    jest.runAllImmediates();
    expect(registry().length).toBe(3);
    expect(registry()[2].count).toBe(1);
  });

  it('groups warnings with consideration for arguments', () => {
    addLogs([['A', 'B']]);
    jest.runAllImmediates();
    expect(registry().length).toBe(1);
    expect(registry()[0].count).toBe(1);

    addLogs([['A', 'B']]);
    jest.runAllImmediates();
    expect(registry().length).toBe(1);
    expect(registry()[0].count).toBe(2);

    addLogs([['A', 'C']]);
    jest.runAllImmediates();
    expect(registry().length).toBe(2);
    expect(registry()[1].count).toBe(1);

    addLogs([['%s', 'A', 'A']]);
    jest.runAllImmediates();
    expect(registry().length).toBe(3);
    expect(registry()[2].count).toBe(1);

    addLogs([['%s', 'B', 'A']]);
    jest.runAllImmediates();
    expect(registry().length).toBe(3);
    expect(registry()[2].count).toBe(2);

    addLogs([['%s', 'B', 'B']]);
    jest.runAllImmediates();
    expect(registry().length).toBe(4);
    expect(registry()[3].count).toBe(1);
  });

  it('ignores logs starting with "(ADVICE)"', () => {
    addLogs(['(ADVICE) ...']);
    jest.runAllImmediates();
    expect(registry().length).toBe(0);
  });

  it('does not ignore logs formatted to start with "(ADVICE)"', () => {
    addLogs([['%s ...', '(ADVICE)']]);
    jest.runAllImmediates();
    expect(registry().length).toBe(1);
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
    expect(observer.mock.calls[0][0]).toBe(observer.mock.calls[1][0]);
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

    const lastLog = Array.from(observer.mock.calls[1][0])[0];
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
