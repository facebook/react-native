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

describe('LogBoxData', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('adds and dismisses logs', () => {
    LogBoxData.add(['A']);

    expect(registry().length).toBe(1);
    expect(registry()[0]).toBeDefined();

    LogBoxData.dismiss(registry()[0]);
    expect(registry().length).toBe(0);
    expect(registry()[0]).toBeUndefined();
  });

  it('clears all logs', () => {
    LogBoxData.add(['A']);
    LogBoxData.add(['B']);
    LogBoxData.add(['C']);

    expect(registry().length).toBe(3);

    LogBoxData.clear();
    expect(registry().length).toBe(0);
  });

  it('keeps logs in chronological order', () => {
    LogBoxData.add(['A']);
    LogBoxData.add(['B']);
    LogBoxData.add(['C']);

    let logs = registry();
    expect(logs.length).toBe(3);
    expect(logs[0].category).toEqual('A');
    expect(logs[1].category).toEqual('B');
    expect(logs[2].category).toEqual('C');

    LogBoxData.add(['A']);

    // Expect `A` to be added to the end of the registry.
    logs = registry();
    expect(logs.length).toBe(4);
    expect(logs[0].category).toEqual('A');
    expect(logs[1].category).toEqual('B');
    expect(logs[2].category).toEqual('C');
    expect(logs[3].category).toEqual('A');
  });

  it('increments the count of previous log with matching category', () => {
    LogBoxData.add(['A']);
    LogBoxData.add(['B']);

    let logs = registry();
    expect(logs.length).toBe(2);
    expect(logs[0].category).toEqual('A');
    expect(logs[0].count).toBe(1);
    expect(logs[1].category).toEqual('B');
    expect(logs[1].count).toBe(1);

    LogBoxData.add(['B']);

    // Expect `B` to be rolled into the last log.
    logs = registry();
    expect(logs.length).toBe(2);
    expect(logs[0].category).toEqual('A');
    expect(logs[0].count).toBe(1);
    expect(logs[1].category).toEqual('B');
    expect(logs[1].count).toBe(2);
  });

  it('ignores logs matching patterns', () => {
    LogBoxData.add(['A!']);
    LogBoxData.add(['B?']);
    LogBoxData.add(['C!']);
    expect(filteredRegistry().length).toBe(3);

    LogBoxData.addIgnorePatterns(['!']);
    expect(filteredRegistry().length).toBe(1);

    LogBoxData.addIgnorePatterns(['?']);
    expect(filteredRegistry().length).toBe(0);
  });

  it('ignores logs matching regexs or pattern', () => {
    LogBoxData.add(['There are 4 dogs']);
    LogBoxData.add(['There are 3 cats']);
    LogBoxData.add(['There are H cats']);
    expect(filteredRegistry().length).toBe(3);

    LogBoxData.addIgnorePatterns(['dogs']);
    expect(filteredRegistry().length).toBe(2);

    LogBoxData.addIgnorePatterns([/There are \d+ cats/]);
    expect(filteredRegistry().length).toBe(1);

    LogBoxData.addIgnorePatterns(['cats']);
    expect(filteredRegistry().length).toBe(0);
  });

  it('ignores all logs when disabled', () => {
    LogBoxData.add(['A!']);
    LogBoxData.add(['B?']);
    LogBoxData.add(['C!']);
    expect(registry().length).toBe(3);

    LogBoxData.setDisabled(true);
    expect(registry().length).toBe(0);

    LogBoxData.setDisabled(false);
    expect(registry().length).toBe(3);
  });

  it('groups consecutive logs by format string categories', () => {
    LogBoxData.add(['%s', 'A']);
    expect(registry().length).toBe(1);
    expect(registry()[0].count).toBe(1);

    LogBoxData.add(['%s', 'B']);
    expect(registry().length).toBe(1);
    expect(registry()[0].count).toBe(2);

    LogBoxData.add(['A']);
    expect(registry().length).toBe(2);
    expect(registry()[1].count).toBe(1);

    LogBoxData.add(['B']);
    expect(registry().length).toBe(3);
    expect(registry()[2].count).toBe(1);
  });

  it('groups warnings with consideration for arguments', () => {
    LogBoxData.add(['A', 'B']);
    expect(registry().length).toBe(1);
    expect(registry()[0].count).toBe(1);

    LogBoxData.add(['A', 'B']);
    expect(registry().length).toBe(1);
    expect(registry()[0].count).toBe(2);

    LogBoxData.add(['A', 'C']);
    expect(registry().length).toBe(2);
    expect(registry()[1].count).toBe(1);

    LogBoxData.add(['%s', 'A', 'A']);
    expect(registry().length).toBe(3);
    expect(registry()[2].count).toBe(1);

    LogBoxData.add(['%s', 'B', 'A']);
    expect(registry().length).toBe(3);
    expect(registry()[2].count).toBe(2);

    LogBoxData.add(['%s', 'B', 'B']);
    expect(registry().length).toBe(4);
    expect(registry()[3].count).toBe(1);
  });

  it('ignores logs starting with "(ADVICE)"', () => {
    LogBoxData.add(['(ADVICE) ...']);
    expect(registry().length).toBe(0);
  });

  it('does not ignore logs formatted to start with "(ADVICE)"', () => {
    LogBoxData.add(['%s ...', '(ADVICE)']);
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

    LogBoxData.add(['A']);
    LogBoxData.add(['B']);
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

    LogBoxData.add(['A']);
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

    LogBoxData.add(['A']);
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
