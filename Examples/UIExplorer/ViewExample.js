/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ViewExample
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  Text,
  View,
} = React;

var UIExplorerBlock = require('./UIExplorerBlock');
var UIExplorerPage = require('./UIExplorerPage');

var ViewExample = React.createClass({
  statics: {
    title: '<View>',
    description: 'Basic building block of all UI.'
  },
  getInitialState: function() {
    return {
      textBorderExampleHeight: 20,
    };
  },

  render: function() {
    return (
      <UIExplorerPage title={this.props.navigator ? null : '<View>'}>
        <UIExplorerBlock title="Background Color">
          <View style={{backgroundColor: '#527FE4', padding: 5}}>
            <Text style={{fontSize: 11}}>
              Blue background
            </Text>
          </View>
        </UIExplorerBlock>
        <UIExplorerBlock title="Border">
          <View style={{borderColor: '#527FE4', borderWidth: 5, padding: 10}}>
            <Text style={{fontSize: 11}}>5px blue border</Text>
          </View>
        </UIExplorerBlock>
        <UIExplorerBlock title="Padding/Margin">
          <View style={{borderColor: '#bb0000', borderWidth: 0.5}}>
            <View style={[styles.box, {padding: 5}]}>
              <Text style={{fontSize: 11}}>5px padding</Text>
            </View>
            <View style={[styles.box, {margin: 5}]}>
              <Text style={{fontSize: 11}}>5px margin</Text>
            </View>
            <View style={[styles.box, {margin: 5, padding: 5, alignSelf: 'flex-start'}]}>
              <Text style={{fontSize: 11}}>
                5px margin and padding,
              </Text>
              <Text style={{fontSize: 11}}>
                widthAutonomous=true
              </Text>
            </View>
          </View>
        </UIExplorerBlock>
        <UIExplorerBlock title="Border Radius">
          <View style={{borderWidth: 0.5, borderRadius: 5, padding: 5}}>
            <Text style={{fontSize: 11}}>
              Too much use of `borderRadius` (especially large radii) on
              anything which is scrolling may result in dropped frames.
              Use sparingly.
            </Text>
          </View>
        </UIExplorerBlock>
        <UIExplorerBlock title="Circle with Border Radius">
          <View style={{borderRadius: 10, borderWidth: 1, width: 20, height: 20}} />
        </UIExplorerBlock>
        <UIExplorerBlock title="Overflow">
          <View style={{flexDirection: 'row'}}>
            <View
              style={{
                width: 95,
                height: 10,
                marginRight: 10,
                marginBottom: 5,
                overflow: 'hidden',
                borderWidth: 0.5,
              }}>
              <View style={{width: 200, height: 20}}>
                <Text>Overflow hidden</Text>
              </View>
            </View>
            <View style={{width: 95, height: 10, marginBottom: 5, borderWidth: 0.5}}>
              <View style={{width: 200, height: 20}}>
                <Text>Overflow visible</Text>
              </View>
            </View>
          </View>
        </UIExplorerBlock>
        <UIExplorerBlock title="Opacity">
          <View style={{opacity: 0}}><Text>Opacity 0</Text></View>
          <View style={{opacity: 0.1}}><Text>Opacity 0.1</Text></View>
          <View style={{opacity: 0.3}}><Text>Opacity 0.3</Text></View>
          <View style={{opacity: 0.5}}><Text>Opacity 0.5</Text></View>
          <View style={{opacity: 0.7}}><Text>Opacity 0.7</Text></View>
          <View style={{opacity: 0.9}}><Text>Opacity 0.9</Text></View>
          <View style={{opacity: 1}}><Text>Opacity 1</Text></View>
        </UIExplorerBlock>
      </UIExplorerPage>
    );
  },

  updateHeight: function() {
    var height = this.state.textBorderExampleHeight === 50 ? 20 : 50;
    this.setState({textBorderExampleHeight: height});
  },
});

var styles = StyleSheet.create({
  box: {
    backgroundColor: '#527FE4',
    borderColor: '#000033',
    borderWidth: 1,
  }
});

module.exports = ViewExample;
