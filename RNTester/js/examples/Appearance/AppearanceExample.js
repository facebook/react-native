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

import * as React from 'react';
import {Appearance, Text, useColorScheme, View} from 'react-native';
import type {AppearancePreferences} from '../../../../Libraries/Utilities/NativeAppearance';
import {RNTesterThemeContext, themes} from '../../components/RNTesterTheme';

class ColorSchemeSubscription extends React.Component<
  {...},
  {colorScheme: ?string, ...},
> {
  state = {
    colorScheme: Appearance.getColorScheme(),
  };

  componentDidMount() {
    Appearance.addChangeListener(this._handleAppearanceChange);
  }

  componentWillUnmount() {
    Appearance.removeChangeListener(this._handleAppearanceChange);
  }

  _handleAppearanceChange = (preferences: AppearancePreferences) => {
    const {colorScheme} = preferences;
    this.setState({colorScheme});
  };

  render() {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => {
          return (
            <ThemedContainer>
              <ThemedText>{this.state.colorScheme}</ThemedText>
            </ThemedContainer>
          );
        }}
      </RNTesterThemeContext.Consumer>
    );
  }
}

const ThemedContainer = props => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 16,
            backgroundColor: theme.SystemBackgroundColor,
          }}>
          {props.children}
        </View>
      );
    }}
  </RNTesterThemeContext.Consumer>
);

const ThemedText = props => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return <Text style={{color: theme.LabelColor}}>{props.children}</Text>;
    }}
  </RNTesterThemeContext.Consumer>
);

exports.title = 'Appearance';
exports.description = 'Light and dark user interface examples.';
exports.examples = [
  {
    title: 'useColorScheme hook',
    render(): React.Node {
      const AppearanceViaHook = () => {
        const colorScheme = useColorScheme();
        return (
          <RNTesterThemeContext.Provider
            value={colorScheme === 'dark' ? themes.dark : themes.light}>
            <ThemedContainer>
              <ThemedText>useColorScheme(): {colorScheme}</ThemedText>
            </ThemedContainer>
          </RNTesterThemeContext.Provider>
        );
      };
      return <AppearanceViaHook />;
    },
  },
  {
    title: 'Non-component `getColorScheme` API',
    render(): React.Element<any> {
      return <ColorSchemeSubscription />;
    },
  },
  {
    title: 'Consuming Context',
    render(): React.Element<any> {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <ThemedContainer>
                <ThemedText>
                  This block of text inherits its theme via Context.
                </ThemedText>
              </ThemedContainer>
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Context forced to light theme',
    render(): React.Element<any> {
      return (
        <RNTesterThemeContext.Provider value={themes.light}>
          <ThemedContainer>
            <ThemedText>
              This block of text will always render with a light theme.
            </ThemedText>
          </ThemedContainer>
        </RNTesterThemeContext.Provider>
      );
    },
  },
  {
    title: 'Context forced to dark theme',
    render(): React.Element<any> {
      return (
        <RNTesterThemeContext.Provider value={themes.dark}>
          <ThemedContainer>
            <ThemedText>
              This block of text will always render with a dark theme.
            </ThemedText>
          </ThemedContainer>
        </RNTesterThemeContext.Provider>
      );
    },
  },
  {
    title: 'RNTester App Colors',
    description: 'A light and a dark theme based on standard iOS 13 colors.',
    render(): React.Element<any> {
      const ColorShowcase = props => (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <View
                style={{
                  marginVertical: 20,
                  backgroundColor: theme.SystemBackgroundColor,
                }}>
                <Text style={{fontWeight: '700', color: theme.LabelColor}}>
                  {props.themeName}
                </Text>
                {Object.keys(theme).map(key => (
                  <View style={{flexDirection: 'row'}} key={key}>
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        backgroundColor: theme[key],
                      }}
                    />
                    <View>
                      <Text
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 2,
                          color: theme.LabelColor,
                          fontWeight: '600',
                        }}>
                        {key}
                      </Text>
                      <Text
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 2,
                          color: theme.LabelColor,
                        }}>
                        {theme[key]}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          }}
        </RNTesterThemeContext.Consumer>
      );

      return (
        <View>
          <RNTesterThemeContext.Provider value={themes.light}>
            <ColorShowcase themeName="Light Mode" />
          </RNTesterThemeContext.Provider>
          <RNTesterThemeContext.Provider value={themes.dark}>
            <ColorShowcase themeName="Dark Mode" />
          </RNTesterThemeContext.Provider>
        </View>
      );
    },
  },
];
