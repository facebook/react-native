/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';
import SectionListBaseExample from './SectionListBaseExample';
import * as React from 'react';

export function SectionList_inverted_stickySectionHeadersEnabled(): React.Node {
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
      exampleProps={{...exampleProps, inverted: true}}
      testOutput={output}
      onTest={onTest}
      sectionFooterEnabled
      testLabel={
        exampleProps.stickySectionHeadersEnabled ? 'Sticky Off' : 'Sticky On'
      }
    />
  );
}

export default {
  title: 'SectionList Inverted Sticky Headers Enabled',
  name: 'inverted-stickyHeadersEnabled',
  description: 'Toggle sticky headers on/off',
  render: function (): React.MixedElement {
    return <SectionList_inverted_stickySectionHeadersEnabled />;
  },
};
