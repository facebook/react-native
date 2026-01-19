/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import SectionListBaseExample from './SectionListBaseExample';
import * as React from 'react';
import {useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

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
        <Text style={styles.separatorText}>{text}</Text>
      </View>
    );
  };

export function SectionList_withSeparators(): React.Node {
  const [isInverted, setInverted] = useState(false);

  const exampleProps = {
    inverted: isInverted,
    ItemSeparatorComponent: Separator('lightgreen', 'green', false),
    SectionSeparatorComponent: Separator('lightblue', 'blue', true),
  };
  const ref = useRef<any>(null);

  function onTest() {
    setInverted(!isInverted);
  }

  return (
    <SectionListBaseExample
      ref={ref}
      exampleProps={exampleProps}
      itemStyle={styles.item}
      onTest={onTest}
      testOutput={`Inverted: ${isInverted.toString()}`}
      testLabel={isInverted ? 'Toggle false' : 'Toggle true'}
    />
  );
}

const styles = StyleSheet.create({
  separator: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorText: {
    fontSize: 10,
  },
  item: {
    marginVertical: 0,
  },
});

export default {
  title: 'SectionList With Separators',
  name: 'withSeparators',
  render: function (): React.MixedElement {
    return <SectionList_withSeparators />;
  },
};
