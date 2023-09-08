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

import type {ItemDataType} from '../components/itemData';

import * as React from 'react';
import {useState, useEffect, useCallback, StrictMode} from 'react';
import {Text} from 'react-native';
import {generateRandomItems} from '../components/itemData';
import ItemList from '../components/ItemList';

const TIMEOUT = 500;
const FETCH_COUNT = 250;
const ItemListMemo = React.memo(ItemList);

function ItemFetcherBadExample(props: {
  onFetched: (items: ItemDataType[]) => void,
  count: number,
}): React.Node {
  const {onFetched, count} = props;
  const fetchMoreItems = async (
    itemsCount: number,
  ): Promise<ItemDataType[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(generateRandomItems(itemsCount));
      }, TIMEOUT);
    });
  };

  fetchMoreItems(count).then((items: ItemDataType[]) => {
    onFetched(items);
  }, console.error);
}

function ItemFetcherGoodExample(props: {
  onFetched: (items: ItemDataType[]) => void,
  count: number,
}): React.Node {
  const {onFetched, count} = props;
  useEffect(() => {
    const fetchMoreItems = async (
      itemsCount: number,
    ): Promise<ItemDataType[]> => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(generateRandomItems(itemsCount));
        }, TIMEOUT);
      });
    };

    fetchMoreItems(count).then((items: ItemDataType[]) => {
      onFetched(items);
    }, console.error);
  }, [onFetched, count]);
}

const ItemFetcherBadExampleMemo = React.memo(ItemFetcherBadExample);
const ItemFetcherGoodExampleMemo = React.memo(ItemFetcherGoodExample);
function EffectInRenderBadExample(): React.Node {
  const [visibleItems, setVisibleItems] = useState<ItemDataType[]>([]);
  const [fetchedItems, setFetchedItems] = useState<ItemDataType[]>([]);
  const onMoreItemFetched = useCallback(
    (items: ItemDataType[]) => {
      setFetchedItems(items);
    },
    [setFetchedItems],
  );

  if (fetchedItems.length > 0) {
    setVisibleItems(visibleItems.concat(fetchedItems));
    setFetchedItems([]);
  }

  return (
    <StrictMode>
      <Text>{`Items count in list: ${visibleItems.length}`}</Text>
      <ItemFetcherBadExampleMemo
        onFetched={onMoreItemFetched}
        count={FETCH_COUNT}
      />
      <ItemListMemo data={visibleItems} />
    </StrictMode>
  );
}

function EffectInRenderGoodExample(): React.Node {
  const [visibleItems, setVisibleItems] = useState<ItemDataType[]>([]);
  const [fetchedItems, setFetchedItems] = useState<ItemDataType[]>([]);
  const onMoreItemFetched = useCallback(
    (items: ItemDataType[]) => {
      setFetchedItems(items);
    },
    [setFetchedItems],
  );

  if (fetchedItems.length > 0) {
    setVisibleItems(visibleItems.concat(fetchedItems));
    setFetchedItems([]);
  }

  return (
    <StrictMode>
      <Text>{`Items count in list: ${visibleItems.length}`}</Text>
      <ItemFetcherGoodExampleMemo
        onFetched={onMoreItemFetched}
        count={FETCH_COUNT}
      />
      <ItemListMemo data={visibleItems} />
    </StrictMode>
  );
}

export default {
  title:
    'Directly trigger side effect in render may run multiple times and cause error state or re-renders',
  description:
    'Trigger a side effect in render method without using effect hook in <StrictMode>. This will force render component two times, and the side effect in bad example caused append items to the list two times unexpectedly.',
  Bad: EffectInRenderBadExample,
  Good: EffectInRenderGoodExample,
};
