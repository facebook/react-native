/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import * as React from 'react';
import {useState, useEffect} from 'react';
import {Text} from 'react-native';
import {add} from '../../../library/src/NativeCalculator';

const MyCalc = () => {
  const [result, setResult] = useState<number | null>(null);
  useEffect(() => {
    async function compute() {
      const res = await add(2, 5);
      setResult(res);
    }
    compute();
  }, []);

  return <Text>2+5={result ?? 'computing'}</Text>;
};

exports.title = 'Calculator';
exports.category = 'Basic';
exports.description = 'Example Library with a simple Calculator';
exports.examples = [
  {
    title: 'Calculator',
    render(): React.Element<any> {
      return <MyCalc />;
    },
  },
];
