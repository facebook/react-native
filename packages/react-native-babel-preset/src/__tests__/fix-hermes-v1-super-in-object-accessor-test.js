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
const fixHermesV1SuperInObjectAccessor = require('../fix-hermes-v1-super-in-object-accessor');

test('rewrites identifier-keyed object getter using super.x to computed string key', () => {
  const code = `
    const obj = {
      get name() {
        return super.name;
      },
    };
  `;

  expect(transform(code, [fixHermesV1SuperInObjectAccessor]))
    .toMatchInlineSnapshot(`
    "const obj = {
      get [\\"name\\"]() {
        return super.name;
      }
    };"
  `);
});

test('rewrites identifier-keyed object setter using super.x to computed string key', () => {
  const code = `
    const obj = {
      set value(v) {
        super.value = v;
      },
    };
  `;

  expect(transform(code, [fixHermesV1SuperInObjectAccessor]))
    .toMatchInlineSnapshot(`
    "const obj = {
      set [\\"value\\"](v) {
        super.value = v;
      }
    };"
  `);
});

test('leaves super inside class method alone', () => {
  const code = `
    class Child extends Parent {
      get name() {
        return super.name;
      }
    }
  `;

  expect(transform(code, [fixHermesV1SuperInObjectAccessor]))
    .toMatchInlineSnapshot(`
    "class Child extends Parent {
      get name() {
        return super.name;
      }
    }"
  `);
});

test('leaves super inside regular object method alone', () => {
  const code = `
    const obj = {
      run() {
        return super.run();
      },
    };
  `;

  expect(transform(code, [fixHermesV1SuperInObjectAccessor]))
    .toMatchInlineSnapshot(`
    "const obj = {
      run() {
        return super.run();
      }
    };"
  `);
});

test('leaves super() call alone', () => {
  const code = `
    class Child extends Parent {
      constructor() {
        super();
      }
    }
  `;

  expect(transform(code, [fixHermesV1SuperInObjectAccessor]))
    .toMatchInlineSnapshot(`
    "class Child extends Parent {
      constructor() {
        super();
      }
    }"
  `);
});

test('skips already-computed accessor', () => {
  const code = `
    const obj = {
      get [keyName]() {
        return super.value;
      },
    };
  `;

  expect(transform(code, [fixHermesV1SuperInObjectAccessor]))
    .toMatchInlineSnapshot(`
    "const obj = {
      get [keyName]() {
        return super.value;
      }
    };"
  `);
});

test('rewrites numeric-keyed object getter using super.x to computed string key', () => {
  const code = `
    const obj = {
      get 0() {
        return super.value;
      },
    };
  `;

  expect(transform(code, [fixHermesV1SuperInObjectAccessor]))
    .toMatchInlineSnapshot(`
"const obj = {
  get [\\"0\\"]() {
    return super.value;
  }
};"
`);
});
