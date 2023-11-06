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

'use strict';

import RNTesterButton from '../../../components/RNTesterButton';
import * as React from 'react';
import {Text} from 'react-native';

const {useState, useMemo} = React;

function NotMemoizeExpensiveTaskExampleBadExample(): React.Node {
  const [count, setCount] = useState(0);

  let expensiveResult = 0;
  for (let i = 0; i < 50000000; i++) {
    expensiveResult += i;
  }

  return (
    <>
      <Text>{`Expensive Result: ${expensiveResult}`}</Text>
      <RNTesterButton onPress={() => setCount(count + 1)}>
        {`Click me to count: ${count}`}
      </RNTesterButton>
    </>
  );
}

function NotMemoizeExpensiveTaskExampleGoodExample(): React.Node {
  const [count, setCount] = useState(0);

  const expensiveResult = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < 50000000; i++) {
      sum += i;
    }
    return sum;
  }, []);

  return (
    <>
      <Text>{`Expensive Result: ${expensiveResult}`}</Text>
      <RNTesterButton onPress={() => setCount(count + 1)}>
        {`Click me to count: ${count}`}
      </RNTesterButton>
    </>
  );
}

export default {
  title:
    'Expensive tasks should be memoized to avoid unnecessary long JS tasks',
  description:
    'Each re-render will run expensive job to get a result. The result should be memoized to avoid unnecessary re-computation',
  Bad: NotMemoizeExpensiveTaskExampleBadExample,
  Good: NotMemoizeExpensiveTaskExampleGoodExample,
};
