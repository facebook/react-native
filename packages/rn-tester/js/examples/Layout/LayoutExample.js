/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const RNTesterBlock = require('../../components/RNTesterBlock');
const RNTesterPage = require('../../components/RNTesterPage');
const React = require('react');

const {StyleSheet, Text, View} = require('react-native');

class Circle extends React.Component<$FlowFixMeProps> {
  render() {
    const size = this.props.size || 20;
    const backgroundColor = this.props.bgColor || '#527fe4';
    return (
      <View
        style={{
          borderRadius: size / 2,
          backgroundColor: backgroundColor,
          width: size,
          height: size,
          margin: 1,
        }}
      />
    );
  }
}

class CircleBlock extends React.Component<$FlowFixMeProps> {
  render() {
    const circleStyle = {
      flexDirection: 'row',
      backgroundColor: '#f6f7f8',
      borderWidth: 0.5,
      borderColor: '#d6d7da',
      marginBottom: 2,
    };
    return (
      <View style={[circleStyle, this.props.style]}>{this.props.children}</View>
    );
  }
}

class LayoutExample extends React.Component<$FlowFixMeProps> {
  render(): React.Node {
    const fiveColoredCircles = [
      <Circle bgColor="#527fe4" key="blue" />,
      <Circle bgColor="#D443E3" key="violet" />,
      <Circle bgColor="#FF9049" key="orange" />,
      <Circle bgColor="#FFE649" key="yellow" />,
      <Circle bgColor="#7FE040" key="green" />,
    ];

    return (
      <RNTesterPage title={this.props.navigator ? null : 'Layout'}>
        <RNTesterBlock title="Flex Direction">
          <Text>row</Text>
          <CircleBlock style={{flexDirection: 'row'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <Text>row-reverse</Text>
          <CircleBlock style={{flexDirection: 'row-reverse'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <Text>column</Text>
          <CircleBlock style={{flexDirection: 'column'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <Text>column-reverse</Text>
          <CircleBlock style={{flexDirection: 'column-reverse'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <View
            style={[
              styles.overlay,
              {position: 'absolute', top: 15, left: 160},
            ]}>
            <Text>{'top: 15, left: 160'}</Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Justify Content - Main Direction">
          <Text>flex-start</Text>
          <CircleBlock style={{justifyContent: 'flex-start'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <Text>center</Text>
          <CircleBlock style={{justifyContent: 'center'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <Text>flex-end</Text>
          <CircleBlock style={{justifyContent: 'flex-end'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <Text>space-between</Text>
          <CircleBlock style={{justifyContent: 'space-between'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <Text>space-around</Text>
          <CircleBlock style={{justifyContent: 'space-around'}}>
            {fiveColoredCircles}
          </CircleBlock>
        </RNTesterBlock>
        <RNTesterBlock title="Align Items - Other Direction">
          <Text>flex-start</Text>
          <CircleBlock style={{alignItems: 'flex-start', height: 30}}>
            <Circle size={15} />
            <Circle size={10} />
            <Circle size={20} />
            <Circle size={17} />
            <Circle size={12} />
            <Circle size={15} />
            <Circle size={10} />
            <Circle size={20} />
            <Circle size={17} />
            <Circle size={12} />
            <Circle size={15} />
            <Circle size={10} />
            <Circle size={20} />
            <Circle size={17} />
            <Circle size={12} />
            <Circle size={15} />
            <Circle size={8} />
          </CircleBlock>
          <Text>center</Text>
          <CircleBlock style={{alignItems: 'center', height: 30}}>
            <Circle size={15} />
            <Circle size={10} />
            <Circle size={20} />
            <Circle size={17} />
            <Circle size={12} />
            <Circle size={15} />
            <Circle size={10} />
            <Circle size={20} />
            <Circle size={17} />
            <Circle size={12} />
            <Circle size={15} />
            <Circle size={10} />
            <Circle size={20} />
            <Circle size={17} />
            <Circle size={12} />
            <Circle size={15} />
            <Circle size={8} />
          </CircleBlock>
          <Text>flex-end</Text>
          <CircleBlock style={{alignItems: 'flex-end', height: 30}}>
            <Circle size={15} />
            <Circle size={10} />
            <Circle size={20} />
            <Circle size={17} />
            <Circle size={12} />
            <Circle size={15} />
            <Circle size={10} />
            <Circle size={20} />
            <Circle size={17} />
            <Circle size={12} />
            <Circle size={15} />
            <Circle size={10} />
            <Circle size={20} />
            <Circle size={17} />
            <Circle size={12} />
            <Circle size={15} />
            <Circle size={8} />
          </CircleBlock>
        </RNTesterBlock>
        <RNTesterBlock title="Flex Wrap">
          <CircleBlock style={{flexWrap: 'wrap'}}>
            {'oooooooooooooooo'.split('').map((char, i) => (
              <Circle key={i} />
            ))}
          </CircleBlock>
        </RNTesterBlock>
      </RNTesterPage>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#aaccff',
    borderRadius: 10,
    borderWidth: 0.5,
    opacity: 0.5,
    padding: 5,
  },
});

exports.title = 'Layout - Flexbox';
exports.category = 'UI';
exports.description = 'Examples of using the flexbox API to layout views.';
exports.displayName = 'LayoutExample';
exports.examples = [
  {
    title: 'Simple layout using flexbox',
    render: function(): React.Element<typeof LayoutExample> {
      return <LayoutExample />;
    },
  },
];
