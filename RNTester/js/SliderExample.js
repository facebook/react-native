/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule SliderExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  Slider,
  Text,
  StyleSheet,
  View,
} = ReactNative;

class SliderExample extends React.Component {
  static defaultProps = {
    value: 0,
  };

  state = {
    value: this.props.value,
  };

  render() {
    return (
      <View>
        <Text style={styles.text} >
          {this.state.value && +this.state.value.toFixed(3)}
        </Text>
        <Slider
          {...this.props}
          onValueChange={(value) => this.setState({value: value})} />
      </View>
    );
  }
}

class SlidingCompleteExample extends React.Component {
  state = {
    slideCompletionValue: 0,
    slideCompletionCount: 0,
  };

  render() {
    return (
      <View>
        <SliderExample
          {...this.props}
          onSlidingComplete={(value) => this.setState({
              slideCompletionValue: value,
              slideCompletionCount: this.state.slideCompletionCount + 1})} />
        <Text>
          Completions: {this.state.slideCompletionCount} Value: {this.state.slideCompletionValue}
        </Text>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  slider: {
    height: 10,
    margin: 10,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    margin: 10,
  },
});

exports.title = '<Slider>';
exports.displayName = 'SliderExample';
exports.description = 'Slider input for numeric values';
exports.examples = [
  {
    title: 'Default settings',
    render(): React.Element<any> {
      return <SliderExample />;
    }
  },
  {
    title: 'Initial value: 0.5',
    render(): React.Element<any> {
      return <SliderExample value={0.5} />;
    }
  },
  {
    title: 'minimumValue: -1, maximumValue: 2',
    render(): React.Element<any> {
      return (
        <SliderExample
          minimumValue={-1}
          maximumValue={2}
        />
      );
    }
  },
  {
    title: 'step: 0.25',
    render(): React.Element<any> {
      return <SliderExample step={0.25} />;
    }
  },
  {
    title: 'onSlidingComplete',
    render(): React.Element<any> {
      return (
        <SlidingCompleteExample />
      );
    }
  },
  {
    title: 'Custom min/max track tint color',
    render(): React.Element<any> {
      return (
        <SliderExample
          minimumTrackTintColor={'blue'}
          maximumTrackTintColor={'red'}
          value={0.5}
        />
      );
    }
  },
  {
    title: 'Custom thumb color',
    platform: 'android',
    render(): React.Element<any> {
      return <SliderExample thumbTintColor={'blue'} />;
    }
  },
  {
    title: 'Custom thumb image',
    platform: 'ios',
    render(): React.Element<any> {
      return <SliderExample thumbImage={require('./uie_thumb_big.png')} />;
    }
  },
  {
    title: 'Custom track image',
    platform: 'ios',
    render(): React.Element<any> {
      return <SliderExample trackImage={require('./slider.png')} />;
    }
  },
  {
    title: 'Custom min/max track image',
    platform: 'ios',
    render(): React.Element<any> {
      return (
        <SliderExample
          minimumTrackImage={require('./slider-left.png')}
          maximumTrackImage={require('./slider-right.png')}
        />
      );
    }
  },
];
