/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Links from './Links';
import {ThemedText, useTheme} from './Theme';
import * as React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import openURLInBrowser from 'react-native/Libraries/Core/Devtools/openURLInBrowser';
import {version as ReactNativeVersion} from 'react-native/Libraries/Core/ReactNativeVersion';

export type NewAppScreenProps = $ReadOnly<{
  templateFileName?: string,
}>;

export default function NewAppScreen({
  templateFileName = 'App.tsx',
}: NewAppScreenProps): React.Node {
  const {colors} = useTheme();
  const isDarkMode = useColorScheme() === 'dark';
  const isLargeScreen = useWindowDimensions().width > 600;

  return (
    <SafeAreaView style={{backgroundColor: colors.background}}>
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.header}>
            <Image
              style={styles.logo}
              source={
                isDarkMode
                  ? require('./assets/react-dark.png')
                  : require('./assets/react-light.png')
              }
            />
            <ThemedText style={styles.title}>
              Welcome to React Native
            </ThemedText>
            {getVersionLabel()}
            {getHermesLabel()}
            <ThemedText
              style={[
                styles.callout,
                {backgroundColor: colors.backgroundHighlight},
              ]}>
              💡&ensp;Open{' '}
              <Text style={styles.calloutEmphasis}>{templateFileName}</Text> to
              get started
            </ThemedText>
          </View>
          <View style={styles.linksContainer}>
            <ThemedText style={styles.linksTitle}>Learn & Explore</ThemedText>
            {Links.map(({title, description, url}, i) => (
              <TouchableHighlight
                key={i}
                activeOpacity={0.6}
                underlayColor={colors.background}
                onPress={() => openURLInBrowser(url)}
                style={[
                  styles.link,
                  // eslint-disable-next-line react-native/no-inline-styles
                  {
                    maxWidth: isLargeScreen ? 240 : 360,
                    borderColor: colors.cardOutline,
                    backgroundColor: colors.cardBackground,
                  },
                ]}>
                <View>
                  <ThemedText style={styles.linkText}>{title}</ThemedText>
                  <ThemedText style={{color: colors.textSecondary}}>
                    {description}
                  </ThemedText>
                </View>
              </TouchableHighlight>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getVersionLabel(): React.Node {
  const version =
    [
      ReactNativeVersion.major,
      ReactNativeVersion.minor,
      ReactNativeVersion.patch,
    ].join('.') +
    (ReactNativeVersion.prerelease != null
      ? '-' + ReactNativeVersion.prerelease
      : '');

  return (
    <ThemedText color="secondary" style={styles.label}>
      Version: {version}
    </ThemedText>
  );
}

function getHermesLabel(): React.Node {
  if (global.HermesInternal == null) {
    return null;
  }

  return (
    <ThemedText color="secondary" style={styles.label}>
      JS Engine: Hermes
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginTop: 64,
    marginBottom: 48,
  },
  logo: {
    height: 80,
    aspectRatio: 1,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  callout: {
    width: '100%',
    maxWidth: 320,
    marginTop: 36,
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingLeft: 16,
    borderRadius: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  calloutEmphasis: {
    fontWeight: 'bold',
  },
  linksContainer: {
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 12,
    rowGap: 12,
    maxWidth: 800,
    marginBottom: 48,
  },
  linksTitle: {
    width: '100%',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  link: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    boxShadow: '0 4px 8px rgba(0, 0, 0, .03)',
  },
  linkText: {
    marginBottom: 4,
    fontSize: 16,
    fontWeight: '600',
  },
});
