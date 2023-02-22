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
import SectionListBaseExample from './SectionListBaseExample';
import * as React from 'react';

export function SectionList_stickySectionHeadersEnabled(): React.Node {
  const [output, setOutput] = React.useState(
    'stickySectionHeadersEnabled false',
  );
  const [exampleProps, setExampleProps] = React.useState({
    stickySectionHeadersEnabled: false,
  });

  const onTest = () => {
    setExampleProps({
      stickySectionHeadersEnabled: !exampleProps.stickySectionHeadersEnabled,
    });
    setOutput(
      `stickySectionHeadersEnabled ${(!exampleProps.stickySectionHeadersEnabled).toString()}`,
    );
  };

  return (
    <SectionListBaseExample
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
      testLabel={
        exampleProps.stickySectionHeadersEnabled ? 'Sticky Off' : 'Sticky On'
      }
    />
  );
}

export default {
  title: 'SectionList Sticky Headers Enabled',
  name: 'SectionList-stickyHeadersEnabled',
  description: 'Toggle sticky headers on/off',
  render: function (): React.Element<
    typeof SectionList_stickySectionHeadersEnabled,
  > {
    return <SectionList_stickySectionHeadersEnabled />;
  },
};
