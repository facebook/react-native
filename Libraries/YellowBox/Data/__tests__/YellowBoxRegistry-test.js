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

const YellowBoxWarning = require('../YellowBoxWarning');
const YellowBoxCategory = require('../YellowBoxCategory');
const YellowBoxRegistry = require('../YellowBoxRegistry');

const registry = () => {
  const observer = jest.fn();
  YellowBoxRegistry.observe(observer).unsubscribe();
  return observer.mock.calls[0][0];
};

const observe = () => {
  const observer = jest.fn();
  return {
    observer,
    subscription: YellowBoxRegistry.observe(observer),
  };
};

describe('YellowBoxRegistry', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('adds and deletes warnings', () => {
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A']}));
    const {category: categoryA} = YellowBoxCategory.parse(['A']);

    expect(registry().size).toBe(1);
    expect(registry().get(categoryA)).not.toBe(undefined);

    YellowBoxRegistry.delete(categoryA);
    expect(registry().size).toBe(0);
    expect(registry().get(categoryA)).toBe(undefined);
  });

  it('clears all warnings', () => {
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A']}));
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['B']}));
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['C']}));

    expect(registry().size).toBe(3);

    YellowBoxRegistry.clear();
    expect(registry().size).toBe(0);
  });

  it('sorts warnings in chronological order', () => {
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A']}));
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['B']}));
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['C']}));

    const {category: categoryA} = YellowBoxCategory.parse(['A']);
    const {category: categoryB} = YellowBoxCategory.parse(['B']);
    const {category: categoryC} = YellowBoxCategory.parse(['C']);

    expect(Array.from(registry().keys())).toEqual([
      categoryA,
      categoryB,
      categoryC,
    ]);

    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A']}));

    // Expect `A` to be hoisted to the end of the registry.
    expect(Array.from(registry().keys())).toEqual([
      categoryB,
      categoryC,
      categoryA,
    ]);
  });

  it('ignores warnings matching patterns', () => {
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A!']}));
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['B?']}));
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['C!']}));
    expect(registry().size).toBe(3);

    YellowBoxRegistry.addIgnorePatterns(['!']);
    expect(registry().size).toBe(1);

    YellowBoxRegistry.addIgnorePatterns(['?']);
    expect(registry().size).toBe(0);
  });

  it('ignores warnings matching regexs or pattern', () => {
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['There are 4 dogs']}));
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['There are 3 cats']}));
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['There are H cats']}));
    expect(registry().size).toBe(3);

    YellowBoxRegistry.addIgnorePatterns(['dogs']);
    expect(registry().size).toBe(2);

    YellowBoxRegistry.addIgnorePatterns([/There are \d+ cats/]);
    expect(registry().size).toBe(1);

    YellowBoxRegistry.addIgnorePatterns(['cats']);
    expect(registry().size).toBe(0);
  });

  it('ignores all warnings when disabled', () => {
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A!']}));
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['B?']}));
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['C!']}));
    expect(registry().size).toBe(3);

    YellowBoxRegistry.setDisabled(true);
    expect(registry().size).toBe(0);

    YellowBoxRegistry.setDisabled(false);
    expect(registry().size).toBe(3);
  });

  it('groups warnings by simple categories', () => {
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A']}));
    expect(registry().size).toBe(1);

    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A']}));
    expect(registry().size).toBe(1);

    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['B']}));
    expect(registry().size).toBe(2);
  });

  it('groups warnings by format string categories', () => {
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['%s', 'A']}));
    expect(registry().size).toBe(1);

    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['%s', 'B']}));
    expect(registry().size).toBe(1);

    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A']}));
    expect(registry().size).toBe(2);

    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['B']}));
    expect(registry().size).toBe(3);
  });

  it('groups warnings with consideration for arguments', () => {
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A', 'B']}));
    expect(registry().size).toBe(1);

    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A', 'B']}));
    expect(registry().size).toBe(1);

    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A', 'C']}));
    expect(registry().size).toBe(2);

    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['%s', 'A', 'A']}));
    expect(registry().size).toBe(3);

    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['%s', 'B', 'A']}));
    expect(registry().size).toBe(3);

    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['%s', 'B', 'B']}));
    expect(registry().size).toBe(4);
  });

  it('does not ignore warnings formatted to start with "(ADVICE)"', () => {
    YellowBoxRegistry.add(
      YellowBoxWarning.parse({args: ['%s ...', '(ADVICE)']}),
    );
    expect(registry().size).toBe(1);
  });

  it('immediately updates new observers', () => {
    const {observer} = observe();

    expect(observer.mock.calls.length).toBe(1);
    expect(observer.mock.calls[0][0]).toBe(registry());
  });

  it('sends batched updates asynchronously', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A']}));
    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['B']}));
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(2);
  });

  it('stops sending updates to unsubscribed observers', () => {
    const {observer, subscription} = observe();
    subscription.unsubscribe();

    expect(observer.mock.calls.length).toBe(1);
    expect(observer.mock.calls[0][0]).toBe(registry());
  });

  it('updates observers when a warning is added or deleted', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A']}));
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(2);

    const {category: categoryA} = YellowBoxCategory.parse(['A']);
    YellowBoxRegistry.delete(categoryA);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing when category does not exist.
    YellowBoxRegistry.delete(categoryA);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);
  });

  it('updates observers when cleared', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    YellowBoxRegistry.add(YellowBoxWarning.parse({args: ['A']}));
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(2);

    YellowBoxRegistry.clear();
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing when already empty.
    YellowBoxRegistry.clear();
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);
  });

  it('updates observers when an ignore pattern is added', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    YellowBoxRegistry.addIgnorePatterns(['?']);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(2);

    YellowBoxRegistry.addIgnorePatterns(['!']);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing for an existing ignore pattern.
    YellowBoxRegistry.addIgnorePatterns(['!']);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);
  });

  it('updates observers when disabled or enabled', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    YellowBoxRegistry.setDisabled(true);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(2);

    // Does nothing when already disabled.
    YellowBoxRegistry.setDisabled(true);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(2);

    YellowBoxRegistry.setDisabled(false);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing when already enabled.
    YellowBoxRegistry.setDisabled(false);
    jest.runAllImmediates();
    expect(observer.mock.calls.length).toBe(3);
  });
});
