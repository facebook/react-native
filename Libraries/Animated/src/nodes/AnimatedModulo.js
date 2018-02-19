/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule AnimatedModulo
 * @flow
 * @format
 */
'use strict';

const AnimatedNode = require('./AnimatedNode');
const AnimatedWithChildren = require('./AnimatedWithChildren');

class AnimatedModulo extends AnimatedWithChildren {
  _a: AnimatedNode;
  _modulus: number;

  constructor(a: AnimatedNode, modulus: number) {
    super();
    this._a = a;
    this._modulus = modulus;
  }

  __makeNative() {
    this._a.__makeNative();
    super.__makeNative();
  }

  __getValue(): number {
    return (
      (this._a.__getValue() % this._modulus + this._modulus) % this._modulus
    );
  }

  __attach(): void {
    this._a.__addChild(this);
  }

  __detach(): void {
    this._a.__removeChild(this);
    super.__detach();
  }

  __getNativeConfig(): any {
    return {
      type: 'modulus',
      input: this._a.__getNativeTag(),
      modulus: this._modulus,
    };
  }
}

module.exports = AnimatedModulo;
