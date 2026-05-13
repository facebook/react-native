/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const {transform} = require('../__mocks__/test-helpers');
const fixHermesV1ClassInFinally = require('../fix-hermes-v1-class-in-finally');

test('wraps class declaration in finally block in IIFE', () => {
  const code = `
    function run() {
      try {
        risky();
      } finally {
        class Logger {
          log() { console.log('done'); }
        }
        new Logger().log();
      }
    }
  `;

  expect(transform(code, [fixHermesV1ClassInFinally])).toMatchInlineSnapshot(`
    "function run() {
      try {
        risky();
      } finally {
        var Logger = (() => {
          class Logger {
            log() {
              console.log('done');
            }
          }
          return Logger;
        })();
        new Logger().log();
      }
    }"
  `);
});

test('wraps class expression in finally block in IIFE', () => {
  const code = `
    function run() {
      try {
        risky();
      } finally {
        const Logger = class {
          log() {}
        };
        new Logger().log();
      }
    }
  `;

  expect(transform(code, [fixHermesV1ClassInFinally])).toMatchInlineSnapshot(`
"function run() {
  try {
    risky();
  } finally {
    const Logger = (() => class Logger {
      log() {}
    })();
    new Logger().log();
  }
}"
`);
});

test('leaves class outside finally block alone', () => {
  const code = `
    function run() {
      try {
        class Inside {}
        return new Inside();
      } catch (e) {
        class Caught {}
        return new Caught();
      }
    }
  `;

  expect(transform(code, [fixHermesV1ClassInFinally])).toMatchInlineSnapshot(`
    "function run() {
      try {
        class Inside {}
        return new Inside();
      } catch (e) {
        class Caught {}
        return new Caught();
      }
    }"
  `);
});

test('leaves class declared at module scope alone', () => {
  const code = `
    class Module {}
    new Module();
  `;

  expect(transform(code, [fixHermesV1ClassInFinally])).toMatchInlineSnapshot(`
    "class Module {}
    new Module();"
  `);
});

test('does not enter nested function scope', () => {
  const code = `
    try {} finally {
      function inner() {
        class NestedFn {}
        return new NestedFn();
      }
      inner();
    }
  `;

  expect(transform(code, [fixHermesV1ClassInFinally])).toMatchInlineSnapshot(`
    "try {} finally {
      function inner() {
        class NestedFn {}
        return new NestedFn();
      }
      inner();
    }"
  `);
});

test('preserves inferred name when wrapping a named-binding class expression', () => {
  const code = `
    function run() {
      try {} finally {
        const Service = class {
          ping() {}
        };
        return new Service();
      }
    }
  `;

  expect(transform(code, [fixHermesV1ClassInFinally])).toMatchInlineSnapshot(`
"function run() {
  try {} finally {
    const Service = (() => class Service {
      ping() {}
    })();
    return new Service();
  }
}"
`);
});

test('leaves an unbound class expression in finally anonymous', () => {
  const code = `
    function run() {
      try {} finally {
        return register(class {
          run() {}
        });
      }
    }
  `;

  expect(transform(code, [fixHermesV1ClassInFinally])).toMatchInlineSnapshot(`
"function run() {
  try {} finally {
    return register((() => class {
      run() {}
    })());
  }
}"
`);
});
