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
const fixHermesV1AsyncArrowNonSimpleParams = require('../fix-hermes-v1-async-arrow-non-simple-params');

test('rewrites destructured object param with default to simple identifier', () => {
  const code = `
    const fn = async ({a = 1, b} = {}) => {
      return await fetch(a + b);
    };
  `;

  expect(transform(code, [fixHermesV1AsyncArrowNonSimpleParams]))
    .toMatchInlineSnapshot(`
    "const fn = async _p => {
      var {
        a = 1,
        b
      } = _p === undefined ? {} : _p;
      return await fetch(a + b);
    };"
  `);
});

test('rewrites destructured array param to simple identifier', () => {
  const code = `
    const fn = async ([a, b]) => await Promise.resolve(a + b);
  `;

  expect(transform(code, [fixHermesV1AsyncArrowNonSimpleParams]))
    .toMatchInlineSnapshot(`
    "const fn = async _p => {
      var [a, b] = _p;
      return await Promise.resolve(a + b);
    };"
  `);
});

test('rewrites assignment-pattern param without enclosing destructure', () => {
  const code = `
    const fn = async (x = 5) => await use(x);
  `;

  expect(transform(code, [fixHermesV1AsyncArrowNonSimpleParams]))
    .toMatchInlineSnapshot(`
    "const fn = async _p => {
      var x = _p === undefined ? 5 : _p;
      return await use(x);
    };"
  `);
});

test('wraps body in inner async arrow when rest param is present', () => {
  const code = `
    const fn = async (...args) => await handle(args);
  `;

  expect(transform(code, [fixHermesV1AsyncArrowNonSimpleParams]))
    .toMatchInlineSnapshot(`
    "const fn = (...args) => (async () => {
      return await handle(args);
    })();"
  `);
});

test('leaves async arrow with only simple identifier params alone', () => {
  const code = `
    const fn = async (a, b) => await fetch(a + b);
  `;

  expect(
    transform(code, [fixHermesV1AsyncArrowNonSimpleParams]),
  ).toMatchInlineSnapshot(`"const fn = async (a, b) => await fetch(a + b);"`);
});

test('leaves non-async arrow alone', () => {
  const code = `
    const fn = ({a = 1, b} = {}) => a + b;
  `;

  expect(transform(code, [fixHermesV1AsyncArrowNonSimpleParams]))
    .toMatchInlineSnapshot(`
    "const fn = ({
      a = 1,
      b
    } = {}) => a + b;"
  `);
});

test('handles multiple params mixing simple and complex', () => {
  const code = `
    const fn = async (a, {b}, c = 1) => await all(a, b, c);
  `;

  expect(transform(code, [fixHermesV1AsyncArrowNonSimpleParams]))
    .toMatchInlineSnapshot(`
    "const fn = async (a, _p, _p2) => {
      var {
        b
      } = _p;
      var c = _p2 === undefined ? 1 : _p2;
      return await all(a, b, c);
    };"
  `);
});
