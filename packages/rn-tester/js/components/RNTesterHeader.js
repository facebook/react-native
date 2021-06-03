/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import {
  Text,
  View,
  SafeAreaView,
  Button,
  Platform,
  StyleSheet,
} from 'react-native';
import * as React from 'react';
import RNTesterDocumentationURL from './RNTesterDocumentationURL';
import {RNTesterThemeContext} from './RNTesterTheme';

const HeaderIOS = ({
  onBack,
  title,
  documentationURL,
}: {
  onBack?: () => mixed,
  title: string,
  documentationURL?: string,
}) => {
  const theme = React.useContext(RNTesterThemeContext);
  return (
    <SafeAreaView
      style={[
        styles.headerContainer,
        {
          borderBottomColor: theme.SeparatorColor,
          backgroundColor: theme.TertiarySystemBackgroundColor,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={{...styles.title, ...{color: theme.LabelColor}}}>
            {title}
          </Text>
          {documentationURL && (
            <RNTesterDocumentationURL documentationURL={documentationURL} />
          )}
        </View>
        {onBack && (
          <View>
            <Button
              title="Back"
              onPress={onBack}
              color={Platform.select({
                ios: theme.LinkColor,
                default: undefined,
              })}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const HeaderAndroid = ({
  title,
  documentationURL,
}: {
  title: string,
  documentationURL?: string,
}) => {
  const theme = React.useContext(RNTesterThemeContext);
  return (
    <SafeAreaView>
      <View style={[styles.toolbar, {backgroundColor: theme.BackgroundColor}]}>
        <View style={styles.toolbarCenter}>
          <Text style={[styles.title, {color: theme.LabelColor}]}>{title}</Text>
          {documentationURL && (
            <RNTesterDocumentationURL documentationURL={documentationURL} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export const Header = ({
  onBack,
  title,
  documentationURL,
}: {
  onBack?: () => mixed,
  title: string,
  documentationURL?: string,
  ...
}): React.Node =>
  Platform.OS === 'ios' ? (
    <HeaderIOS
      documentationURL={documentationURL}
      title={title}
      onBack={onBack}
    />
  ) : (
    <HeaderAndroid documentationURL={documentationURL} title={title} />
  );

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    height: 40,
    flexDirection: 'row',
  },
  headerCenter: {
    flex: 1,
    position: 'absolute',
    top: 7,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  toolbar: {
    height: 56,
  },
  toolbarCenter: {
    flex: 1,
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
