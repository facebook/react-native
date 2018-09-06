/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const {
  LayoutContext,
  StyleSheet,
  View,
  StatusBar,
  Button,
  Platform,
} = require('react-native');

const BORDER_WIDTH = 2;

type Props = {
  onExampleExit: () => void,
};

type State = {
  hidden: boolean,
  translucent: boolean,
};

class LayoutContextExample extends React.Component<Props, State> {
  static title = '<LayoutContext>';
  static description =
    'LayoutContext allows getting layout metrics for the current root view.';
  static external = true;

  state = {
    hidden: false,
    translucent: false,
  };

  render() {
    return (
      <LayoutContext>
        {({layout, safeAreaInsets}) => {
          return (
            <>
              <StatusBar
                hidden={this.state.hidden}
                translucent={this.state.translucent}
                backgroundColor="rgba(0, 0, 0, 0.3)"
              />
              <View
                style={[
                  styles.container,
                  {
                    width: layout.width,
                    height: layout.height,
                    paddingTop: safeAreaInsets.top - BORDER_WIDTH,
                    paddingRight: safeAreaInsets.right - BORDER_WIDTH,
                    paddingBottom: safeAreaInsets.bottom - BORDER_WIDTH,
                    paddingLeft: safeAreaInsets.left - BORDER_WIDTH,
                  },
                ]}>
                <View style={styles.content}>
                  <Button
                    title="Toggle status bar hidden"
                    onPress={() =>
                      this.setState(state => ({hidden: !state.hidden}))
                    }
                  />
                  {Platform.OS === 'android' && (
                    <Button
                      title="Toggle status bar translucent"
                      onPress={() =>
                        this.setState(state => ({
                          translucent: !state.translucent,
                        }))
                      }
                    />
                  )}
                  <Button title="Close" onPress={this.props.onExampleExit} />
                </View>
              </View>
            </>
          );
        }}
      </LayoutContext>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    borderWidth: BORDER_WIDTH,
    borderColor: 'red',
    backgroundColor: '#589c90',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BORDER_WIDTH,
    borderColor: 'blue',
  },
});

module.exports = LayoutContextExample;
