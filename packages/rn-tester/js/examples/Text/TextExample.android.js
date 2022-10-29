/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';
import TextAdjustsDynamicLayoutExample from './TextAdjustsDynamicLayoutExample';

const RNTesterBlock = require('../../components/RNTesterBlock');
const RNTesterPage = require('../../components/RNTesterPage');
const React = require('react');
const TextInlineView = require('../../components/TextInlineView');
import TextLegend from '../../components/TextLegend';
import {useLayoutEffect, useState} from 'react';

const {LayoutAnimation, StyleSheet, Text, View} = require('react-native');

class Entity extends React.Component<{|children: React.Node|}> {
  render(): React.Node {
    return (
      <Text style={{fontWeight: 'bold', color: '#527fe4'}}>
        {this.props.children}
      </Text>
    );
  }
}
class AttributeToggler extends React.Component<{...}, $FlowFixMeState> {
  state: {fontSize: number, fontWeight: 'bold' | 'normal'} = {
    fontWeight: 'bold',
    fontSize: 15,
  };

  toggleWeight = () => {
    this.setState({
      fontWeight: this.state.fontWeight === 'bold' ? 'normal' : 'bold',
    });
  };

  increaseSize = () => {
    this.setState({
      fontSize: this.state.fontSize + 1,
    });
  };

  render(): React.Node {
    const curStyle = {
      fontWeight: this.state.fontWeight,
      fontSize: this.state.fontSize,
    };
    return (
      <View>
        <Text style={curStyle}>
          Tap the controls below to change attributes.
        </Text>
        <Text>
          <Text>
            See how it will even work on{' '}
            <Text style={curStyle}>this nested text</Text>
          </Text>
        </Text>
        <Text>
          <Text onPress={this.toggleWeight}>Toggle Weight</Text>
          {' (with highlight onPress)'}
        </Text>
        <Text onPress={this.increaseSize} suppressHighlighting={true}>
          Increase Size (suppressHighlighting true)
        </Text>
      </View>
    );
  }
}

type AdjustingFontSizeProps = $ReadOnly<{||}>;

type AdjustingFontSizeState = {|
  dynamicText: string,
  shouldRender: boolean,
|};

class AdjustingFontSize extends React.Component<
  AdjustingFontSizeProps,
  AdjustingFontSizeState,
> {
  state: AdjustingFontSizeState = {
    dynamicText: '',
    shouldRender: true,
  };

  reset = () => {
    LayoutAnimation.easeInEaseOut();
    this.setState({
      shouldRender: false,
    });
    setTimeout(() => {
      LayoutAnimation.easeInEaseOut();
      this.setState({
        dynamicText: '',
        shouldRender: true,
      });
    }, 300);
  };

  addText = () => {
    this.setState({
      dynamicText:
        this.state.dynamicText +
        (Math.floor((Math.random() * 10) % 2) ? ' foo' : ' bar'),
    });
  };

  removeText = () => {
    this.setState({
      dynamicText: this.state.dynamicText.slice(
        0,
        this.state.dynamicText.length - 4,
      ),
    });
  };

  render(): React.Node {
    if (!this.state.shouldRender) {
      return <View />;
    }
    return (
      <View>
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          style={{fontSize: 36, marginVertical: 6}}>
          Truncated text is baaaaad.
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          style={{fontSize: 40, marginVertical: 6}}>
          Shrinking to fit available space is much better!
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          numberOfLines={1}
          style={{fontSize: 30, marginVertical: 6}}>
          {'Add text to me to watch me shrink!' + ' ' + this.state.dynamicText}
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          numberOfLines={4}
          android_hyphenationFrequency="normal"
          style={{fontSize: 20, marginVertical: 6}}>
          {'Multiline text component shrinking is supported, watch as this reeeeaaaally loooooong teeeeeeext grooooows and then shriiiinks as you add text to me! ioahsdia soady auydoa aoisyd aosdy ' +
            ' ' +
            this.state.dynamicText}
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          style={{fontSize: 20, marginVertical: 6, maxHeight: 50}}>
          {'Text limited by height, watch as this reeeeaaaally loooooong teeeeeeext grooooows and then shriiiinks as you add text to me! ioahsdia soady auydoa aoisyd aosdy ' +
            ' ' +
            this.state.dynamicText}
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          numberOfLines={1}
          style={{marginVertical: 6}}>
          <Text style={{fontSize: 14}}>
            {'Differently sized nested elements will shrink together. '}
          </Text>
          <Text style={{fontSize: 20}}>
            {'LARGE TEXT! ' + this.state.dynamicText}
          </Text>
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: 5,
            marginVertical: 6,
          }}>
          <Text style={{backgroundColor: '#ffaaaa'}} onPress={this.reset}>
            Reset
          </Text>
          <Text style={{backgroundColor: '#aaaaff'}} onPress={this.removeText}>
            Remove Text
          </Text>
          <Text style={{backgroundColor: '#aaffaa'}} onPress={this.addText}>
            Add Text
          </Text>
        </View>
      </View>
    );
  }
}

class TextExample extends React.Component<{...}> {
  render(): React.Node {
    return (
      <RNTesterPage title="<Text>">
        <RNTesterBlock title="Font Size Adjustment with Dynamic Layout">
          <TextAdjustsDynamicLayoutExample />
        </RNTesterBlock>
      </RNTesterPage>
    );
  }
}
const styles = StyleSheet.create({
  backgroundColorText: {
    left: 5,
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
  },
  includeFontPaddingText: {
    fontSize: 120,
    fontFamily: 'sans-serif',
    backgroundColor: '#EEEEEE',
    color: '#000000',
    textAlignVertical: 'center',
    alignSelf: 'center',
  },
});

function TextBaseLineLayoutExample(props: {}): React.Node {
  const texts = [];
  for (let i = 9; i >= 0; i--) {
    texts.push(
      <Text
        key={i}
        style={{fontSize: 8 + i * 5, maxWidth: 20, backgroundColor: '#eee'}}>
        {i}
      </Text>,
    );
  }

  const marker = (
    <View style={{width: 20, height: 20, backgroundColor: 'gray'}} />
  );
  const subtitleStyle = {fontSize: 16, marginTop: 8, fontWeight: 'bold'};

  return (
    <View>
      <Text style={subtitleStyle}>{'Nested <Text/>s:'}</Text>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        {marker}
        <Text>{texts}</Text>
        {marker}
      </View>

      <Text style={subtitleStyle}>{'Array of <Text/>s in <View>:'}</Text>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        {marker}
        {texts}
        {marker}
      </View>

      <Text style={subtitleStyle}>{'Interleaving <View> and <Text>:'}</Text>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        {marker}
        <Text selectable={true}>
          Some text.
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              backgroundColor: '#eee',
            }}>
            {marker}
            <Text>Text inside View.</Text>
            {marker}
          </View>
        </Text>
        {marker}
      </View>
    </View>
  );
}

exports.title = 'Text';
exports.documentationURL = 'https://reactnative.dev/docs/text';
exports.category = 'Basic';
exports.description = 'Base component for rendering styled text.';
exports.examples = [
  {
    title: 'Basic text',
    render: function (): React.Element<typeof TextExample> {
      return <TextExample />;
    },
  },
];
