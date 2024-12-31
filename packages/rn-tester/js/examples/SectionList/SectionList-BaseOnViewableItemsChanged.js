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

type SectionListProps = React.ElementProps<typeof SectionList>;
type ViewabilityConfig = $PropertyType<SectionListProps, 'viewabilityConfig'>;

const BASE_VIEWABILITY_CONFIG = {
  minimumViewTime: 1000,
  viewAreaCoveragePercentThreshold: 100,
};

export function SectionList_BaseOnViewableItemsChanged(props: {
  offScreen?: ?boolean,
  horizontal?: ?boolean,
  useScrollRefScroll?: ?boolean,
  waitForInteraction?: ?boolean,
}): React.Node {
  const {offScreen, horizontal, useScrollRefScroll, waitForInteraction} = props;
  const [output, setOutput] = React.useState('');
  const viewabilityConfig: ViewabilityConfig = {
    ...BASE_VIEWABILITY_CONFIG,
    waitForInteraction: waitForInteraction ?? false,
  };
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
