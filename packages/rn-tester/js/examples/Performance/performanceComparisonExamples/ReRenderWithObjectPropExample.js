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

import * as React from 'react';
import {Text} from 'react-native';
import ItemList from '../components/ItemList';
import {LIST_100_ITEMS} from '../components/itemData';
import type {ScrollEvent} from 'react-native/Libraries/Types/CoreEventTypes';

const {useState, useCallback} = React;
const ItemListMemo = React.memo(ItemList);

function ReRenderWithObjectPropBadExample(): React.Node {
  const [scrollOffset, setScrollOffset] = useState(0);
  return (
    <>
      <Text>{`Scroll Offset X: ${scrollOffset}`}</Text>
      <ItemListMemo
        data={LIST_100_ITEMS}
        onScroll={(evt: ScrollEvent) => {
          setScrollOffset(evt.nativeEvent.contentOffset.x);
        }}
      />
    </>
  );
}

function ReRenderWithObjectPropGoodExample(): React.Node {
  const [scrollOffset, setScrollOffset] = useState(0);
  const onScroll = useCallback(
    (evt: ScrollEvent) => {
      setScrollOffset(evt.nativeEvent.contentOffset.x);
    },
    [setScrollOffset],
  );

  return (
    <>
      <Text>{`Scroll Offset X: ${scrollOffset}`}</Text>
      <ItemListMemo data={LIST_100_ITEMS} onScroll={onScroll} />
    </>
  );
}

export default {
  title: 'Re-render from new object reference in prop',
  description:
    'Get horizontal scroll offset.\nEven with pure or memoized child component, if a new object reference is passed down as prop, the child component will still re-render unnecessarily. The onScroll callback is passed without useCallback hook in the bad example and caused performance issues.',
  Bad: ReRenderWithObjectPropBadExample,
  Good: ReRenderWithObjectPropGoodExample,
};
