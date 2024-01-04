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

import {LIST_100_ITEMS} from '../components/itemData';
import ItemList from '../components/ItemList';
import * as React from 'react';

const ItemListMemo = React.memo(ItemList);

function RenderOffscreenContentBadExample(): React.Node {
  return <ItemListMemo data={LIST_100_ITEMS} />;
}

function RenderOffscreenContentGoodExample(): React.Node {
  return (
    <ItemListMemo useFlatList data={LIST_100_ITEMS} initialNumToRender={2} />
  );
}

export default {
  title: 'Do not render offscreen content',
  description:
    'Render long list with ScrollView vs FlatList + initialNumToRender prop.\nNever render offscreen content when not needed.',
  Bad: RenderOffscreenContentBadExample,
  Good: RenderOffscreenContentGoodExample,
};
