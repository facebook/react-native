/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {ViewToken} from 'react-native/Libraries/Lists/ViewabilityHelper';

import SectionListBaseExample from './SectionListBaseExample';
import * as React from 'react';
import {SectionList, StyleSheet, View} from 'react-native';

const VIEWABILITY_CONFIG = {
  minimumViewTime: 1000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

type SectionListProps = React.ElementProps<typeof SectionList>;
type ViewabilityConfig = $PropertyType<SectionListProps, 'viewabilityConfig'>;

export function SectionList_onViewableItemsChanged(props: {
  viewabilityConfig: ViewabilityConfig,
  offScreen?: ?boolean,
  horizontal?: ?boolean,
  useScrollRefScroll?: ?boolean,
}): React.Node {
  const {viewabilityConfig, offScreen, horizontal, useScrollRefScroll} = props;
  const [output, setOutput] = React.useState('');
  const exampleProps = {
    onViewableItemsChanged: (info: {
      changed: Array<ViewToken>,
      viewableItems: Array<ViewToken>,
      ...
    }) =>
      setOutput(
        info.viewableItems
          .filter(viewToken => viewToken.index != null && viewToken.isViewable)
          .map(viewToken => viewToken.item)
          .join(', '),
      ),
    viewabilityConfig,
    horizontal,
  };
  const ref = React.useRef<any>(null);
  const onTest =
    useScrollRefScroll === true
      ? () => {
          ref?.current?.getScrollResponder()?.scrollToEnd();
        }
      : null;

  return (
    <SectionListBaseExample
      ref={ref}
      exampleProps={exampleProps}
      onTest={onTest}
      testOutput={output}>
      {offScreen === true ? <View style={styles.offScreen} /> : null}
    </SectionListBaseExample>
  );
}
const styles = StyleSheet.create({
  offScreen: {
    height: 1000,
  },
});

export default {
  title: 'SectionList On Viewable Items Changed',
  name: 'SectionList_onViewableItemsChanged',
  render: function (): React.Element<
    typeof SectionList_onViewableItemsChanged,
  > {
    return (
      <SectionList_onViewableItemsChanged
        viewabilityConfig={VIEWABILITY_CONFIG}
      />
    );
  },
};
