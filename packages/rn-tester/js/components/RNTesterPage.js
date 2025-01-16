/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import {RNTesterThemeContext} from './RNTesterTheme';
import RNTesterTitle from './RNTesterTitle';
import {useContext} from 'react';

const React = require('react');
const {SafeAreaView, ScrollView, StyleSheet, View} = require('react-native');

type Props = $ReadOnly<{
  children?: React.Node,
  title?: ?string,
  noScroll?: ?boolean,
}>;

function RNTesterPage({children, title, noScroll}: Props): React.Node {
  const theme = useContext(RNTesterThemeContext);

  return (
    <SafeAreaView
      style={[
        styles.background,
        {backgroundColor: theme.SecondarySystemBackgroundColor},
      ]}>
      {title && <RNTesterTitle title={title} />}
      {noScroll ? (
        <View style={styles.noscrollWrapper}>{children}</View>
      ) : (
        <ScrollView
          automaticallyAdjustContentInsets={!title}
          contentContainerStyle={styles.scrollWrapperContentContainer}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          style={styles.scrollWrapper}>
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  noscrollWrapper: {
    flex: 1,
    rowGap: 30,
  },
  scrollWrapper: {
    flex: 1,
  },
  scrollWrapperContentContainer: {
    paddingVertical: 10,
    rowGap: 30,
  },
});

module.exports = RNTesterPage;
