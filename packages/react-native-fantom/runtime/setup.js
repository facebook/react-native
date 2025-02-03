/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {SnapshotConfig, TestSnapshotResults} from './snapshotContext';

import expect from './expect';
import {createMockFunction} from './mocks';
import {setupSnapshotConfig, snapshotContext} from './snapshotContext';
import NativeFantom from 'react-native/src/private/specs_DEPRECATED/modules/NativeFantom';

export type TestCaseResult = {
  ancestorTitles: Array<string>,
  title: string,
  fullName: string,
  status: 'passed' | 'failed' | 'pending',
  duration: number,
  failureMessages: Array<string>,
  numPassingAsserts: number,
  snapshotResults: TestSnapshotResults,
  // location: string,
};

export type TestSuiteResult =
  | {
      testResults: Array<TestCaseResult>,
    }
  | {
      error: {
        message: string,
        stack: string,
      },
    };

type FocusState = {
  focused: boolean,
  skipped: boolean,
};

type Spec = {
  ...FocusState,
  title: string,
  parentContext: Context,
  implementation: () => mixed,
};

type Suite = Spec | Context;

type Hook = () => void;

type Context = {
  ...FocusState,
  title?: string,
  afterAllHooks: Hook[],
  afterEachHooks: Hook[],
  beforeAllHooks: Hook[],
  beforeEachHooks: Hook[],
  parentContext?: Context,
  children: Array<Suite>,
};

const rootContext: Context = {
  beforeAllHooks: [],
  beforeEachHooks: [],
  afterAllHooks: [],
  afterEachHooks: [validateEmptyMessageQueue],
  children: [],
  focused: false,
  skipped: false,
};
let currentContext: Context = rootContext;

const globalModifiers: Array<'focused' | 'skipped'> = [];

const globalDescribe = (global.describe = (
  title: string,
  implementation: () => mixed,
) => {
  const parentContext = currentContext;
  const {focused, skipped} = getFocusState();
  const childContext: Context = {
    title,
    parentContext,
    afterAllHooks: [],
    afterEachHooks: [],
    beforeAllHooks: [],
    beforeEachHooks: [],
    children: [],
    focused,
    skipped,
  };
  currentContext.children.push(childContext);
  currentContext = childContext;
  implementation();
  currentContext = parentContext;
});

global.afterAll = (implementation: () => void) => {
  currentContext.afterAllHooks.push(implementation);
};

global.afterEach = (implementation: () => void) => {
  currentContext.afterEachHooks.push(implementation);
};

global.beforeAll = (implementation: () => void) => {
  currentContext.beforeAllHooks.push(implementation);
};

global.beforeEach = (implementation: () => void) => {
  currentContext.beforeEachHooks.push(implementation);
};

function getFocusState(): {focused: boolean, skipped: boolean} {
  const focused =
    globalModifiers.length > 0 &&
    globalModifiers[globalModifiers.length - 1] === 'focused';
  const skipped =
    globalModifiers.length > 0 &&
    globalModifiers[globalModifiers.length - 1] === 'skipped';
  return {focused, skipped};
}

const globalIt =
  (global.it =
  global.test =
    (title: string, implementation: () => mixed) => {
      const {focused, skipped} = getFocusState();
      currentContext.children.push({
        title,
        parentContext: currentContext,
        implementation,
        focused,
        skipped,
      });
    });

// $FlowExpectedError[prop-missing]
global.fdescribe = global.describe.only = (
  title: string,
  implementation: () => mixed,
) => {
  globalModifiers.push('focused');
  globalDescribe(title, implementation);
  globalModifiers.pop();
};

// $FlowExpectedError[prop-missing]
global.it.only =
  global.fit =
  // $FlowExpectedError[prop-missing]
  global.test.only =
    (title: string, implementation: () => mixed) => {
      globalModifiers.push('focused');
      globalIt(title, implementation);
      globalModifiers.pop();
    };

// $FlowExpectedError[prop-missing]
global.xdescribe = global.describe.skip = (
  title: string,
  implementation: () => mixed,
) => {
  globalModifiers.push('skipped');
  globalDescribe(title, implementation);
  globalModifiers.pop();
};

// $FlowExpectedError[prop-missing]
global.it.skip =
  global.xit =
  // $FlowExpectedError[prop-missing]
  global.test.skip =
  global.xtest =
    (title: string, implementation: () => mixed) => {
      globalModifiers.push('skipped');
      globalIt(title, implementation);
      globalModifiers.pop();
    };

global.jest = {
  fn: createMockFunction,
};

global.expect = expect;

function runWithGuard(fn: () => void) {
  try {
    fn();
  } catch (error) {
    let reportedError =
      error instanceof Error ? error : new Error(String(error));
    reportTestSuiteResult({
      error: {
        message: reportedError.message,
        stack: reportedError.stack,
      },
    });
  }
}

const focusCache = new Map<Suite, boolean>();

function isFocusedSuite(suite: Suite): boolean {
  const cached = focusCache.get(suite);
  if (cached != null) {
    return cached;
  }

  if (isSkipped(suite)) {
    focusCache.set(suite, false);
    return false;
  }

  if ('children' in suite) {
    const hasFocused = suite.children.some(isFocusedSuite);
    focusCache.set(suite, hasFocused);
    return hasFocused;
  }

  focusCache.set(suite, suite.focused);
  return suite.focused;
}

const skippedCache = new Map<Suite, boolean>();
function isSkipped(suite: Suite): boolean {
  const cached = skippedCache.get(suite);
  if (cached != null) {
    return cached;
  }

  if (suite.skipped) {
    skippedCache.set(suite, true);
    return true;
  }

  if (suite.parentContext != null) {
    const skipped = isSkipped(suite.parentContext);
    skippedCache.set(suite, skipped);
    return skipped;
  }

  skippedCache.set(suite, false);
  return false;
}

function getContextTitle(context: Context): string[] {
  if (context.parentContext == null) {
    return [];
  }

  const titles = context.title != null ? [context.title] : [];
  if (context.parentContext) {
    titles.push(...getContextTitle(context.parentContext));
  }
  return titles.reverse();
}

function invokeHooks(
  context: Context,
  hookType: 'beforeEachHooks' | 'afterEachHooks',
) {
  const contextStack = [];
  let current: ?Context = context;
  while (current != null) {
    if (hookType === 'beforeEachHooks') {
      contextStack.unshift(current);
    } else {
      contextStack.push(current);
    }
    current = current.parentContext;
  }

  for (const c of contextStack) {
    for (const hook of c[hookType]) {
      hook();
    }
  }
}

function shouldRunSuite(suite: Suite): boolean {
  if (isSkipped(suite)) {
    return false;
  }

  if (isFocusedSuite(suite)) {
    return true;
  }

  // there is a focused suite in the root at some point
  // but not in this suite hence we should not run it
  if (isFocusedSuite(rootContext)) {
    return false;
  }

  return true;
}

function runSpec(spec: Spec): TestCaseResult {
  const ancestorTitles = getContextTitle(spec.parentContext);
  const result: TestCaseResult = {
    title: spec.title,
    ancestorTitles,
    fullName: [...ancestorTitles, spec.title].join(' '),
    status: 'pending',
    duration: 0,
    failureMessages: [],
    numPassingAsserts: 0,
    snapshotResults: {},
  };

  if (!shouldRunSuite(spec)) {
    return result;
  }

  let status;
  let error;

  const start = Date.now();
  snapshotContext.setTargetTest(result.fullName);

  try {
    invokeHooks(spec.parentContext, 'beforeEachHooks');
    spec.implementation();
    invokeHooks(spec.parentContext, 'afterEachHooks');

    status = 'passed';
  } catch (e) {
    error = e;
    status = 'failed';
  }

  result.status = status;
  result.duration = Date.now() - start;
  result.failureMessages =
    status === 'failed' && error
      ? [error.stack ?? error.message ?? String(error)]
      : [];

  result.snapshotResults = snapshotContext.getSnapshotResults();
  return result;
}

function runContext(context: Context): TestCaseResult[] {
  const shouldRunHooks = shouldRunSuite(context);

  if (shouldRunHooks) {
    for (const beforeAllHook of context.beforeAllHooks) {
      beforeAllHook();
    }
  }

  const testResults: TestCaseResult[] = [];
  for (const child of context.children) {
    testResults.push(...runSuite(child));
  }

  if (shouldRunHooks) {
    for (const afterAllHook of context.afterAllHooks) {
      afterAllHook();
    }
  }

  return testResults;
}

function runSuite(suite: Suite): TestCaseResult[] {
  if ('children' in suite) {
    return runContext(suite);
  } else {
    return [runSpec(suite)];
  }
}

function reportTestSuiteResult(testSuiteResult: TestSuiteResult): void {
  NativeFantom.reportTestSuiteResultsJSON(
    JSON.stringify({
      type: 'test-result',
      ...testSuiteResult,
    }),
  );
}

function validateEmptyMessageQueue(): void {
  NativeFantom.validateEmptyMessageQueue();
}

global.$$RunTests$$ = () => {
  reportTestSuiteResult({
    testResults: runSuite(currentContext),
  });
};

export function registerTest(
  setUpTest: () => void,
  snapshotConfig: SnapshotConfig,
) {
  setupSnapshotConfig(snapshotConfig);

  runWithGuard(() => {
    setUpTest();
  });
}
