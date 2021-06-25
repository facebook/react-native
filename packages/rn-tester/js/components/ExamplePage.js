/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {RNTesterThemeContext} from './RNTesterTheme';

type Props = $ReadOnly<{|
  children?: React.Node,
  title: string,
  description?: ?string,
  category?: ?string,
  ios?: ?boolean,
  android?: ?boolean,
|}>;

export default function ExamplePage(props: Props): React.Node {
  const description = props.description ?? '';
  const theme = React.useContext(RNTesterThemeContext);
  return (
    <>
      <View
        style={[styles.titleView, {backgroundColor: theme.BackgroundColor}]}>
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.examplesContainer}>{props.children}</View>
    </>
  );
}

const styles = StyleSheet.create({
  titleView: {
    paddingHorizontal: 25,
    paddingTop: 4,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  title: {
    alignSelf: 'center',
    fontSize: 12,
  },
  description: {
    fontSize: 16,
    paddingTop: 4,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  examplesContainer: {
    flexGrow: 1,
    flex: 1,
  },
});
