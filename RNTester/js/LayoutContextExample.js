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
  Text,
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
        {ctx => {
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
                    width: ctx.layout.width,
                    height: ctx.layout.height,
                    paddingTop: ctx.safeAreaInsets.top - BORDER_WIDTH,
                    paddingRight: ctx.safeAreaInsets.right - BORDER_WIDTH,
                    paddingBottom: ctx.safeAreaInsets.bottom - BORDER_WIDTH,
                    paddingLeft: ctx.safeAreaInsets.left - BORDER_WIDTH,
                  },
                ]}>
                <View style={styles.content}>
                  <Text
                    style={{
                      marginBottom: 32,
                      backgroundColor: '#eee',
                      padding: 16,
                    }}>
                    {JSON.stringify(ctx, null, 2)}
                  </Text>
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
    borderWidth: BORDER_WIDTH,
    borderColor: 'blue',
    padding: 32,
  },
});

module.exports = LayoutContextExample;
