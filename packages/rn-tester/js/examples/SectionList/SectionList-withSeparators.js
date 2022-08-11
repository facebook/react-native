/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import SectionListBaseExample from './SectionListBaseExample';
import {View, Text, StyleSheet} from 'react-native';
import * as React from 'react';

const Separator =
  (defaultColor: string, highlightColor: string, isSectionSeparator: boolean) =>
  ({leadingItem, trailingItem, highlighted, hasBeenHighlighted}: any) => {
    const text = `${
      isSectionSeparator ? 'Section ' : ''
    }separator for leading ${leadingItem} and trailing ${trailingItem} has ${
      !hasBeenHighlighted ? 'not ' : ''
    }been pressed`;

    return (
      <View
        style={[
          styles.separator,
          {backgroundColor: highlighted ? highlightColor : defaultColor},
        ]}>
        <Text style={styles.separtorText}>{text}</Text>
      </View>
    );
  };

export function SectionList_withSeparators(): React.Node {
  const exampleProps = {
    ItemSeparatorComponent: Separator('lightgreen', 'green', false),
    SectionSeparatorComponent: Separator('lightblue', 'blue', true),
  };
  const ref = React.useRef(null);

  return <SectionListBaseExample ref={ref} exampleProps={exampleProps} />;
}

const styles = StyleSheet.create({
  separator: {
    height: 12,
  },
  separtorText: {
    fontSize: 10,
  },
});

export default {
  title: 'SectionList With Separators',
  name: 'SectionList-withSeparators',
  render: function (): React.Element<typeof SectionList_withSeparators> {
    return <SectionList_withSeparators />;
  },
};
