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
import {StyleSheet, View, FlatList} from 'react-native';
import * as React from 'react';

type FlatListProps = React.ElementProps<typeof FlatList>;
type ViewabilityConfig = $PropertyType<FlatListProps, 'viewabilityConfig'>;

const VIEWABILITY_CONFIG = {
  minimumViewTime: 1000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

export function FlatList_onViewableItemsChanged(props: {
  viewabilityConfig: ViewabilityConfig,
  offScreen?: ?boolean,
  horizontal?: ?boolean,
  useScrollRefScroll?: ?boolean,
}): React.Node {
  const {viewabilityConfig, offScreen, horizontal, useScrollRefScroll} = props;
  const [output, setOutput] = React.useState('');
  const onViewableItemsChanged = React.useCallback(
    info =>
      setOutput(
        info.viewableItems
          .filter(viewToken => viewToken.index != null && viewToken.isViewable)
          .map(viewToken => viewToken.item)
          .join(', '),
      ),
    [setOutput],
  );
  const exampleProps = {
    onViewableItemsChanged,
    viewabilityConfig,
    horizontal,
  };

  const ref = React.useRef(null);
  const onTest =
    useScrollRefScroll === true
      ? () => {
          ref?.current?.getScrollResponder()?.scrollToEnd();
        }
      : null;

  return (
    <BaseFlatListExample
      ref={ref}
      exampleProps={exampleProps}
      onTest={onTest}
      testOutput={output}>
      {offScreen === true ? <View style={styles.offScreen} /> : null}
    </BaseFlatListExample>
  );
}

const styles = StyleSheet.create({
  offScreen: {
    height: 1000,
  },
});

export default ({
  title: 'onViewableItemsChanged',
  name: 'onViewableItemsChanged',
  description:
    'Scroll list to see what items are returned in `onViewableItemsChanged` callback.',
  render: () => (
    <FlatList_onViewableItemsChanged viewabilityConfig={VIEWABILITY_CONFIG} />
  ),
}: RNTesterModuleExample);
