/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule TransformExample
 */
'use strict';

var React = require('React');

var StyleSheet = require('StyleSheet');
var TimerMixin = require('react-timer-mixin');
var UIExplorerBlock = require('UIExplorerBlock');
var UIExplorerPage = require('UIExplorerPage');
var View = require('View');

var TransformExample = React.createClass({

  mixins: [TimerMixin],

  getInitialState() {
    return {
      interval: this.setInterval(this._update, 800),
      pulse: false,
    };
  },

  render() {
    return (
      <UIExplorerPage title="Transforms">
        <UIExplorerBlock title="foo bar">
          <View style={{height: 500}}>
            <View style={styles.box1} />
            <View style={styles.box2} />
            <View style={styles.box3step1} />
            <View style={styles.box3step2} />
            <View style={styles.box3step3} />
            <View style={styles.box4} />
            <View style={[
              styles.box5,
              this.state.pulse ? styles.box5Transform : null
            ]} />
          </View>
        </UIExplorerBlock>
      </UIExplorerPage>
    );
  },

  _update() {
    this.setState({
      pulse: !this.state.pulse,
    });
  },

});

var styles = StyleSheet.create({
  box1: {
    left: 0,
    backgroundColor: 'green',
    height: 50,
    position: 'absolute',
    top: 0,
    transform: [
      {translateX: 100},
      {translateY: 50},
      {rotate: '30deg'},
      {scaleX: 2},
      {scaleY: 2},
    ],
    width: 50,
  },
  box2: {
    left: 0,
    backgroundColor: 'purple',
    height: 50,
    position: 'absolute',
    top: 0,
    transform: [
      {scaleX: 2},
      {scaleY: 2},
      {translateX: 100},
      {translateY: 50},
      {rotate: '30deg'},
    ],
    width: 50,
  },
  box3step1: {
    left: 0,
    backgroundColor: '#ffb6c1', // lightpink
    height: 50,
    position: 'absolute',
    top: 0,
    transform: [
      {rotate: '30deg'},
    ],
    width: 50,
  },
  box3step2: {
    left: 0,
    backgroundColor: '#ff69b4', //hotpink
    height: 50,
    opacity: 0.5,
    position: 'absolute',
    top: 0,
    transform: [
      {rotate: '30deg'},
      {scaleX: 2},
      {scaleY: 2},
    ],
    width: 50,
  },
  box3step3: {
    left: 0,
    backgroundColor: '#ff1493', // deeppink
    height: 50,
    opacity: 0.5,
    position: 'absolute',
    top: 0,
    transform: [
      {rotate: '30deg'},
      {scaleX: 2},
      {scaleY: 2},
      {translateX: 100},
      {translateY: 50},
    ],
    width: 50,
  },
  box4: {
    left: 0,
    backgroundColor: '#ff8c00', // darkorange
    height: 50,
    position: 'absolute',
    top: 0,
    transform: [
      {translate: [200, 350]},
      {scale: 2.5},
      {rotate: '-0.2rad'},
    ],
    width: 100,
  },
  box5: {
    backgroundColor: '#800000', // maroon
    height: 50,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 50,
  },
  box5Transform: {
    transform: [
      {translate: [-50, 35]},
      {rotate: '50deg'},
      {scale: 2},
    ],
  },
});


module.exports = TransformExample;
