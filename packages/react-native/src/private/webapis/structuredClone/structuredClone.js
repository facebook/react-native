/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */

import DOMException from '../errors/DOMException';

const VALID_ERROR_NAMES = new Set([
  'Error',
  'EvalError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'TypeError',
  'URIError',
]);

function structuredCloneInternal<T>(value: T, memory: Map<mixed, mixed>): T {
  // Handles `null` and `undefined`.
  if (value == null) {
    return value;
  }

  // Handles remaining primitive values.
  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'string':
    case 'bigint':
      return value;
  }

  // Handles unsupported types (symbols and functions).
  if (typeof value !== 'object') {
    // value is symbol or function
    throw new DOMException(
      `Failed to execute 'structuredClone' on 'Window': ${String(value)} could not be cloned.`,
      'DataCloneError',
    );
  }

  // Handles circular references.
  if (memory.has(value)) {
    // $FlowExpectedError[incompatible-return] we know memory.get(value) is T
    return memory.get(value);
  }

  // Known non-serializable objects
  // TODO: Handle this more holistically.
  if (
    value instanceof WeakMap ||
    value instanceof WeakSet ||
    value instanceof Promise
  ) {
    throw new DOMException(
      `Failed to execute 'structuredClone' on 'Window': ${String(value)} could not be cloned.`,
      'DataCloneError',
    );
  }

  // Handles primitive wrappers.

  if (value instanceof Number) {
    // eslint-disable-next-line no-new-wrappers
    const result = new Number(value);
    memory.set(value, result);

    // $FlowExpectedError[incompatible-return] we know result is T
    return result;
  }

  if (value instanceof Boolean) {
    // eslint-disable-next-line no-new-wrappers
    const result = new Boolean(value);
    memory.set(value, result);

    // $FlowExpectedError[incompatible-return] we know result is T
    return result;
  }

  if (value instanceof String) {
    // eslint-disable-next-line no-new-wrappers
    const result = new String(value);
    memory.set(value, result);

    // $FlowExpectedError[incompatible-return] we know result is T
    return result;
  }

  // Handles remaining known objects.

  if (value instanceof Date) {
    const result = new Date(value);
    memory.set(value, result);

    // $FlowExpectedError[incompatible-return] we know result is T
    return result;
  }

  if (value instanceof Error) {
    const result = value.cause
      ? new Error(value.message, {cause: value.cause})
      : new Error(value.message);
    memory.set(value, result);

    if (VALID_ERROR_NAMES.has(value.name)) {
      result.name = value.name;
    } else {
      result.name = 'Error';
    }

    result.stack = value.stack;

    // $FlowExpectedError[incompatible-return] we know result is T
    return result;
  }

  if (value instanceof Map) {
    const result = new Map<mixed, mixed>();
    memory.set(value, result);

    for (const [innerKey, innerValue] of value) {
      result.set(
        structuredCloneInternal(innerKey, memory),
        structuredCloneInternal(innerValue, memory),
      );
    }

    // $FlowExpectedError[incompatible-return] we know result is T
    return result;
  }

  if (value instanceof Set) {
    const result = new Set<mixed>();
    memory.set(value, result);

    for (const innerValue of value) {
      result.add(structuredCloneInternal(innerValue, memory));
    }

    // $FlowExpectedError[incompatible-return] we know result is T
    return result;
  }

  if (value instanceof RegExp) {
    const result = new RegExp(value.source, value.flags);
    memory.set(value, result);

    // $FlowExpectedError[incompatible-return] we know result is T
    return result;
  }

  // $FlowExpectedError[incompatible-type] result will be T
  const result: T = Array.isArray(value) ? [] : {};
  memory.set(value, result);

  // We need to use Object.keys instead of iterating by indices because we
  // also need to copy arbitrary fields set in the array.
  for (const key of Object.keys(value)) {
    // $FlowExpectedError[incompatible-use]
    result[key] = structuredCloneInternal(value[key], memory);
  }

  return result;
}

/**
 * Basic implementation of `structuredClone`.
 * See:
 * - https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone.
 * - https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
 * - https://html.spec.whatwg.org/multipage/structured-data.html#structured-cloning
 *
 * Supports cloning all built-in types supported by the spec, circular
 * references and referential equality of the same objects found in the
 * structure.
 *
 * Shortcuts:
 * - This implementation does NOT serialize and deserialize the value
 *   but implements the cloning in a single step.
 *
 * Known limitations:
 * - It does not support transfering values.
 * - it does not support cloning platform objects like `DOMRect` and `DOMException`.
 */
export default function structuredClone<T>(value: T): T {
  return structuredCloneInternal(value, new Map());
}
