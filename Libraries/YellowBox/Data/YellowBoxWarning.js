/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const YellowBoxCategory = require('./YellowBoxCategory');
const YellowBoxSymbolication = require('./YellowBoxSymbolication');

const parseErrorStack = require('../../Core/Devtools/parseErrorStack');

import type {Category, Message} from './YellowBoxCategory';
import type {Stack} from './YellowBoxSymbolication';

export type SymbolicationRequest = $ReadOnly<{|
  abort: () => void,
|}>;

class YellowBoxWarning {
  static parse({
    args,
    framesToPop,
  }: $ReadOnly<{|
    args: $ReadOnlyArray<mixed>,
    framesToPop: number,
  |}>): {|
    category: Category,
    message: Message,
    stack: Stack,
  |} {
    return {
      ...YellowBoxCategory.parse(args),
      stack: createStack({framesToPop: framesToPop + 1}),
    };
  }

  message: Message;
  stack: Stack;
  symbolicated:
    | $ReadOnly<{|error: null, stack: null, status: 'NONE'|}>
    | $ReadOnly<{|error: null, stack: null, status: 'PENDING'|}>
    | $ReadOnly<{|error: null, stack: Stack, status: 'COMPLETE'|}>
    | $ReadOnly<{|error: Error, stack: null, status: 'FAILED'|}> = {
    error: null,
    stack: null,
    status: 'NONE',
  };

  constructor(message: Message, stack: Stack) {
    this.message = message;
    this.stack = stack;
  }

  getAvailableStack(): Stack {
    return this.symbolicated.status === 'COMPLETE'
      ? this.symbolicated.stack
      : this.stack;
  }

  retrySymbolicate(callback: () => void): SymbolicationRequest {
    YellowBoxSymbolication.delete(this.stack);
    return this.symbolicate(callback);
  }

  symbolicate(callback: () => void): SymbolicationRequest {
    let aborted = false;

    if (this.symbolicated.status !== 'COMPLETE') {
      const updateStatus = (error: ?Error, stack: ?Stack): void => {
        if (error != null) {
          this.symbolicated = {error, stack: null, status: 'FAILED'};
        } else if (stack != null) {
          this.symbolicated = {error: null, stack, status: 'COMPLETE'};
        } else {
          this.symbolicated = {error: null, stack: null, status: 'PENDING'};
        }
        if (!aborted) {
          callback();
        }
      };

      updateStatus(null, null);
      YellowBoxSymbolication.symbolicate(this.stack).then(
        stack => {
          updateStatus(null, stack);
        },
        error => {
          updateStatus(error, null);
        },
      );
    }

    return {
      abort(): void {
        aborted = true;
      },
    };
  }
}

function createStack({framesToPop}: $ReadOnly<{|framesToPop: number|}>): Stack {
  const error: any = new Error();
  error.framesToPop = framesToPop + 1;
  return parseErrorStack(error);
}

module.exports = YellowBoxWarning;
