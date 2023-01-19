/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import SectionListBaseExample from './SectionListBaseExample';
import * as React from 'react';

export function SectionList_onEndReached(): React.Node {
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
    <SectionListBaseExample
      ref={ref}
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
    />
  );
}

export default {
  title: 'SectionList onEndReached',
  name: 'SectionList-onEndReached',
  description: 'Test onEndReached behavior',
  render: function (): React.Element<typeof SectionList_onEndReached> {
    return <SectionList_onEndReached />;
  },
};
