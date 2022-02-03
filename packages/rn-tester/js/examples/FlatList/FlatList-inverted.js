/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import BaseFlatListExample from './BaseFlatListExample';
import * as React from 'react';

export function FlatList_inverted(): React.Node {
  const [output, setOutput] = React.useState('inverted false');
  const [exampleProps, setExampleProps] = React.useState({
    inverted: false,
  });

  const onTest = () => {
    setExampleProps({
      inverted: !exampleProps.inverted,
    });
    setOutput(`Is inverted: ${(!exampleProps.inverted).toString()}`);
  };

  return (
    <BaseFlatListExample
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
      testLabel={exampleProps.inverted ? 'Toggle false' : 'Toggle true'}
    />
  );
}

export default ({
  title: 'Inverted',
  name: 'inverted',
  description: 'Test inverted prop on FlatList',
  render: () => <FlatList_inverted />,
}: RNTesterModuleExample);
