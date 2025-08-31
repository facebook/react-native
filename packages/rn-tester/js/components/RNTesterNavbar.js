/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ScreenTypes} from '../types/RNTesterTypes';

import {RNTesterThemeContext} from './RNTesterTheme';
import * as React from 'react';
import {useContext, useState} from 'react';
import {Image, Platform, Pressable, StyleSheet, Text, View} from 'react-native';

type NavBarOnPressHandler = ({screen: ScreenTypes}) => void;

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
const NavbarButton = ({
  testID,
  isActive,
  icon,
  label,
  handlePress,
  iconStyle,
}): React.Node => {
  const theme = useContext(RNTesterThemeContext);
  const [isPressed, setPressed] = useState(false);

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.navButton, {backgroundColor: theme.BackgroundColor}]}>
      <View
        style={[
          styles.pressableContent,
          isPressed && {transform: 'scale(1.025)'},
        ]}
        collapsable={false}>
        <Image
          style={[styles.icon, iconStyle]}
          tintColor={isActive ? theme.BrandColor : theme.TertiaryLabelColor}
          source={icon}
        />
        <Text
          style={{
            color: isActive ? theme.LabelColor : theme.SecondaryLabelColor,
          }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

type Props = $ReadOnly<{
  handleNavBarPress: NavBarOnPressHandler,
  screen: string,
  isExamplePageOpen: boolean,
}>;

const RNTesterNavbar = ({
  handleNavBarPress,
  screen,
  isExamplePageOpen,
}: Props): React.Node => {
  const theme = useContext(RNTesterThemeContext);

  const isAPIActive = screen === 'apis' && !isExamplePageOpen;
  const isComponentActive = screen === 'components' && !isExamplePageOpen;
  const isPlaygroundActive = screen === 'playgrounds';

  return (
    <View
      style={[
        styles.buttonContainer,
        {borderTopColor: theme.QuaternaryLabelColor},
      ]}>
      <NavbarButton
        testID="components-tab"
        label="Components"
        handlePress={() => handleNavBarPress({screen: 'components'})}
        icon={require('../assets/bottom-nav-components-icon.png')}
        isActive={isComponentActive}
      />
      <NavbarButton
        testID="apis-tab"
        label="APIs"
        handlePress={() => handleNavBarPress({screen: 'apis'})}
        icon={require('../assets/bottom-nav-apis-icon.png')}
        isActive={isAPIActive}
        iconStyle={styles.apiIcon}
      />
      <NavbarButton
        testID="playground-tab"
        label="Playground"
        handlePress={() => handleNavBarPress({screen: 'playgrounds'})}
        icon={require('../assets/bottom-nav-playgrounds-icon.png')}
        isActive={isPlaygroundActive}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 20,
    height: 20,
    alignSelf: 'center',
  },
  apiIcon: {
    width: 30,
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Platform.select({
      android: 0,
      ios: 12,
    }),
  },
  pressableContent: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: 4,
  },
});

export default RNTesterNavbar;
