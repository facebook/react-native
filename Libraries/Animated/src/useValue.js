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

import * as React from 'react';

const AnimatedValue = require('./nodes/AnimatedValue');

function useValue(initialValue: number): AnimatedValue {
  const ref = React.useRef(null);
  if (ref.current === null) {
    ref.current = new AnimatedValue(initialValue);
  }
  return ref.current;
}

module.exports = useValue;
