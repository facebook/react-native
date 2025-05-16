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

import type {ViewToken} from 'react-native/Libraries/Lists/ViewabilityHelper';

import BaseFlatListExample from './BaseFlatListExample';
import * as React from 'react';
import {useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';

type FlatListProps = React.ElementProps<typeof FlatList>;
type ViewabilityConfig = FlatListProps['viewabilityConfig'];

const BASE_VIEWABILITY_CONFIG = {
  minimumViewTime: 1000,
  viewAreaCoveragePercentThreshold: 100,
};

export function FlatList_BaseOnViewableItemsChanged(props: {
  offScreen?: ?boolean,
  horizontal?: ?boolean,
  useScrollRefScroll?: ?boolean,
  waitForInteraction?: ?boolean,
}): React.Node {
  const {offScreen, horizontal, useScrollRefScroll, waitForInteraction} = props;
  const [output, setOutput] = useState('');
  const onViewableItemsChanged = React.useCallback(
    (info: {changed: Array<ViewToken>, viewableItems: Array<ViewToken>, ...}) =>
      setOutput(
        info.viewableItems
          .filter(viewToken => viewToken.index != null && viewToken.isViewable)
          .map(viewToken => viewToken.item)
          .join(', '),
      ),
    [setOutput],
  );
  const viewabilityConfig: ViewabilityConfig = {
    ...BASE_VIEWABILITY_CONFIG,
    waitForInteraction: waitForInteraction ?? false,
  };
  const exampleProps = {
    onViewableItemsChanged,
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
