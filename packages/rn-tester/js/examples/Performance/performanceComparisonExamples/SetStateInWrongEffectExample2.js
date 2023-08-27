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
import ItemList from '../components/ItemList';
import {LIST_1000_ITEMS} from '../components/itemData';

const {useState, useEffect} = React;
const ItemListMemo = React.memo(ItemList);

function BadExample(props: {listData: ItemDataType[], filteredText: string}) {
  const {listData, filteredText} = props;
  const [visibleListData, setVisibleListData] =
    useState<ItemDataType[]>(listData);

  useEffect(() => {
    setVisibleListData(
      listData.filter(item =>
        item.name.toUpperCase().includes(filteredText.toUpperCase()),
      ),
    );
  }, [listData, filteredText]);

  return <ItemListMemo data={visibleListData} />;
}

function GoodExample(props: {listData: ItemDataType[], filteredText: string}) {
  const {listData, filteredText} = props;
  const visibleListData = listData.filter(item =>
    item.name.toUpperCase().includes(filteredText.toUpperCase()),
  );

  return <ItemListMemo data={visibleListData} />;
}

function SetStateInWrongEffectBadExample(): React.Node {
  return <BadExample listData={LIST_1000_ITEMS} filteredText="f8" />;
}

function SetStateInWrongEffectGoodExample(): React.Node {
  return <GoodExample listData={LIST_1000_ITEMS} filteredText="f8" />;
}

export default {
  title: 'Re-render with unnecessary effect and state changes',
  description:
    'You may not need an effect in your component. State updates in unnecessary effects will trigger re-render that can be avoided.',
  Bad: SetStateInWrongEffectBadExample,
  Good: SetStateInWrongEffectGoodExample,
};
