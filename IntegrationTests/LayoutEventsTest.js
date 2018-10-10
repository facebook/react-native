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

const React = require('react');
const ReactNative = require('react-native');
const {Image, LayoutAnimation, StyleSheet, Text, View} = ReactNative;
const {TestModule} = ReactNative.NativeModules;

import type {ViewStyleProp} from 'StyleSheet';

const deepDiffer = require('deepDiffer');

function debug(...args) {
  // console.log.apply(null, arguments);
}

import type {Layout, LayoutEvent} from 'CoreEventTypes';

type State = {
  didAnimation: boolean,
  extraText?: string,
  imageLayout?: Layout,
  textLayout?: Layout,
  viewLayout?: Layout,
  viewStyle?: ViewStyleProp,
  containerStyle?: ViewStyleProp,
};

class LayoutEventsTest extends React.Component<$FlowFixMeProps, State> {
  _view: ?View;
  _img: ?Image;
  _txt: ?Text;
  _isMounted: boolean = true;

  state: State = {
    didAnimation: false,
  };

  componentWillUnmount() {
    this._isMounted = false;
  }

  animateViewLayout = () => {
    debug('animateViewLayout invoked');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring, () => {
      debug('animateViewLayout done');
      this.checkLayout(this.addWrapText);
    });
    this.setState({viewStyle: {margin: 60}});
  };

  addWrapText = () => {
    debug('addWrapText invoked');
    this.setState(
      {extraText: '  And a bunch more text to wrap around a few lines.'},
      () => this.checkLayout(this.changeContainer),
    );
  };

  changeContainer = () => {
    debug('changeContainer invoked');
    this.setState({containerStyle: {width: 280}}, () =>
      this.checkLayout(TestModule.markTestCompleted),
    );
  };

  checkLayout = (next?: ?Function) => {
    if (!this._isMounted) {
      return;
    }

    if (this._view) {
      this._view.measure((x, y, width, height) => {
        this.compare(
          'view',
          {x, y, width, height},
          this.state.viewLayout || null,
        );
        if (typeof next === 'function') {
          next();
        } else if (!this.state.didAnimation) {
          // Trigger first state change after onLayout fires
          this.animateViewLayout();
          this.state.didAnimation = true;
        }
      });
    }

    if (this._txt) {
      this._txt.measure((x, y, width, height) => {
        this.compare('txt', {x, y, width, height}, this.state.textLayout);
      });
    }

    if (this._img) {
      this._img.measure((x, y, width, height) => {
        this.compare('img', {x, y, width, height}, this.state.imageLayout);
      });
    }
  };

  compare(node: string, measured: any, onLayout: any): void {
    if (deepDiffer(measured, onLayout)) {
      const data = {measured, onLayout};
      throw new Error(
        node +
          ' onLayout mismatch with measure ' +
          JSON.stringify(data, null, '  '),
      );
    }
  }

  onViewLayout = (e: LayoutEvent) => {
    debug('received view layout event\n', e.nativeEvent);
    this.setState({viewLayout: e.nativeEvent.layout}, this.checkLayout);
  };

  onTextLayout = (e: LayoutEvent) => {
    debug('received text layout event\n', e.nativeEvent);
    this.setState({textLayout: e.nativeEvent.layout}, this.checkLayout);
  };

  onImageLayout = (e: LayoutEvent) => {
    debug('received image layout event\n', e.nativeEvent);
    this.setState({imageLayout: e.nativeEvent.layout}, this.checkLayout);
  };

  render() {
    const viewStyle = [styles.view, this.state.viewStyle];
    const textLayout = this.state.textLayout || {width: '?', height: '?'};
    const imageLayout = this.state.imageLayout || {x: '?', y: '?'};
    debug('viewLayout', this.state.viewLayout);
    return (
      <View style={[styles.container, this.state.containerStyle]}>
        <View
          ref={ref => {
            this._view = ref;
          }}
          onLayout={this.onViewLayout}
          style={viewStyle}>
          <Image
            ref={ref => {
              this._img = ref;
            }}
            onLayout={this.onImageLayout}
            style={styles.image}
            source={{uri: 'uie_thumb_big.png'}}
          />
          <Text
            ref={ref => {
              this._txt = ref;
            }}
            onLayout={this.onTextLayout}
            style={styles.text}>
            A simple piece of text.{this.state.extraText}
          </Text>
          <Text>
            {'\n'}
            Text w/h: {textLayout.width}/{textLayout.height + '\n'}
            Image x/y: {imageLayout.x}/{imageLayout.y}
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    margin: 40,
  },
  view: {
    margin: 20,
    padding: 12,
    borderColor: 'black',
    borderWidth: 0.5,
    backgroundColor: 'transparent',
  },
  text: {
    alignSelf: 'flex-start',
    borderColor: 'rgba(0, 0, 255, 0.2)',
    borderWidth: 0.5,
  },
  image: {
    width: 50,
    height: 50,
    marginBottom: 10,
    alignSelf: 'center',
  },
});

module.exports = LayoutEventsTest;
