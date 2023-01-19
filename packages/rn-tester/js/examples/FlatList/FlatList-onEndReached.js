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
import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import BaseFlatListExample from './BaseFlatListExample';
import * as React from 'react';

export function FlatList_onEndReached(): React.Node {
  const [output, setOutput] = React.useState('');
  const exampleProps = {
    onEndReached: (info: {distanceFromEnd: number, ...}) =>
      setOutput('onEndReached'),
    onEndReachedThreshold: 0,
  };
  const ref = React.useRef<any>(null);

  const onTest = () => {
    const scrollResponder = ref?.current?.getScrollResponder();
    if (scrollResponder != null) {
      scrollResponder.scrollToEnd();
    }
  };

  return (
    <BaseFlatListExample
      ref={ref}
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
    />
  );
}

export default ({
  title: 'onEndReached',
  name: 'onEndReached',
  description:
    'Scroll to end of list or tap Test button to see `onEndReached` triggered.',
  render: function (): React.Element<typeof FlatList_onEndReached> {
    return <FlatList_onEndReached />;
  },
}: RNTesterModuleExample);
