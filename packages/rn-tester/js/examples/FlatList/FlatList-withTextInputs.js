/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
import {View, TextInput, FlatList} from 'react-native';
import type {RenderItemProps} from '@react-native/virtualized-lists';
import * as React from 'react';

const textInputsItemHeight = 50;

const foodItems = [
  'Pizza',
  'Burger',
  'Risotto',
  'French Fries',
  'Onion Rings',
  'Fried Shrimps',
  'Water',
  'Coke',
  'Beer',
  'Cheesecake',
  'Ice Cream',
];

export function FlatList_withTextInputs(): React.Node {
  const renderItem = React.useCallback(
    ({item, index}: RenderItemProps<string>) => {
      return (
        // Make each item have slightly incorrect height
        <View style={{height: textInputsItemHeight + 3}}>
          <TextInput defaultValue={item} />
        </View>
      );
    },
    [],
  );

  const getItemLayout = React.useCallback(
    (data: ?(string[]), index: number) => {
      return {
        index,
        offset: index * textInputsItemHeight,
        length: textInputsItemHeight + index,
      };
    },
    [],
  );

  const data = React.useMemo(() => {
    const allData: string[] = [];
    for (let i = 0; i < 10; i++) {
      allData.push(...foodItems);
    }
    return allData;
  }, []);

  const exampleProps = {
    renderItem,
    getItemLayout,
    windowSize: 5,
    data,
  };

  const ref = React.useRef<FlatList<string> | null>(null);
  return <BaseFlatListExample ref={ref} exampleProps={exampleProps} />;
}

export default ({
  title: 'withTextInputs',
  name: 'withTextInputs',
  description:
    "Test TextInputs and ensure they don't shift on keyboard open on Android when the estimated heights are incorrect.",
  render: () => <FlatList_withTextInputs />,
}: RNTesterModuleExample);
