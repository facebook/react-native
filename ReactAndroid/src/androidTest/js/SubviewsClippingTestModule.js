/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SubviewsClippingTestModule
 */

'use strict';

var BatchedBridge = require('BatchedBridge');
var React = require('React');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var ScrollView = require('ScrollView');
var StyleSheet = require('StyleSheet');
var View = require('View');

var requireNativeComponent = require('requireNativeComponent');

var ClippableView = requireNativeComponent('ClippableView', null);

class ClippingSample1 extends React.Component {
  render() {
    var styles = sample1Styles;
    return (
      <View>
        <ClippableView clippableViewID="outer" style={styles.outer} removeClippedSubviews={true}>
          <ClippableView clippableViewID="inner1" style={[styles.inner, styles.inner1]}/>
          <ClippableView clippableViewID="inner2" style={[styles.inner, styles.inner2]}/>
          <ClippableView clippableViewID="inner3" style={[styles.inner, styles.inner3]}/>
          <ClippableView clippableViewID="inner4" style={[styles.inner, styles.inner4]}/>
          <ClippableView clippableViewID="inner5" style={[styles.inner, styles.inner5]}/>
        </ClippableView>
      </View>
    );
  }
}

var sample1Styles = StyleSheet.create({
  outer: {
    width: 200,
    height: 200,
    backgroundColor: 'red',
  },
  inner: {
    position: 'absolute',
    width: 100,
    height: 100,
    backgroundColor: 'green',
  },
  inner1: {
    top: -150,
    left: 50,
  },
  inner2: {
    top: 50,
    left: 50,
  },
  inner3: {
    top: 250,
    left: 50,
  },
  inner4: {
    left: -150,
    top: 50,
  },
  inner5: {
    left: 250,
    top: 50,
  },
});

class ClippingSample2 extends React.Component {
  render() {
    var styles = sample2Styles;
    return (
      <View>
        <ClippableView clippableViewID="outer" style={styles.outer} removeClippedSubviews={true}>
          <ClippableView
              clippableViewID="complexInner"
              style={styles.complexInner}
              removeClippedSubviews={true}>
            <ClippableView clippableViewID="inner1" style={[styles.inner, styles.inner1]}/>
            <ClippableView clippableViewID="inner2" style={[styles.inner, styles.inner2]}/>
            <ClippableView clippableViewID="inner3" style={[styles.inner, styles.inner3]}/>
            <ClippableView clippableViewID="inner4" style={[styles.inner, styles.inner4]}/>
          </ClippableView>
        </ClippableView>
      </View>
    );
  }
}

var sample2Styles = StyleSheet.create({
  outer: {
    width: 200,
    height: 200,
    backgroundColor: 'red',
  },
  complexInner: {
    position: 'absolute',
    width: 200,
    height: 200,
    left: 100,
    top: 100,
    backgroundColor: 'green',
  },
  inner: {
    position: 'absolute',
    width: 80,
    height: 80,
    backgroundColor: 'blue',
  },
  inner1: {
    left: 10,
    top: 10,
  },
  inner2: {
    right: 10,
    top: 10,
  },
  inner3: {
    left: 10,
    bottom: 10,
  },
  inner4: {
    right: 10,
    bottom: 10,
  },
});

class UpdatingSample1 extends React.Component {
  render() {
    var styles = updating1Styles;
    var inner1Styles = [styles.inner1, {height: this.props.update1 ? 200 : 100}];
    var inner2Styles = [styles.inner2, {top: this.props.update2 ? 200 : 50}];
    return (
      <View>
        <ClippableView clippableViewID="outer" style={styles.outer} removeClippedSubviews={true}>
          <ClippableView clippableViewID="inner1" style={inner1Styles}/>
          <ClippableView clippableViewID="inner2" style={inner2Styles}/>
        </ClippableView>
      </View>
    );
  }
}

var updating1Styles = StyleSheet.create({
  outer: {
    width: 200,
    height: 200,
    backgroundColor: 'red',
  },
  inner1: {
    position: 'absolute',
    width: 100,
    height: 100,
    left: 50,
    top: -100,
    backgroundColor: 'green',
  },
  inner2: {
    position: 'absolute',
    width: 100,
    height: 100,
    left: 50,
    top: 50,
    backgroundColor: 'green',
  }
});

class UpdatingSample2 extends React.Component {
  render() {
    var styles = updating2Styles;
    var outerStyles = [styles.outer, {height: this.props.update ? 200 : 100}];
    return (
      <View>
        <ClippableView clippableViewID="outer" style={outerStyles} removeClippedSubviews={true}>
          <ClippableView clippableViewID="inner" style={styles.inner}/>
        </ClippableView>
      </View>
    );
  }
}

var updating2Styles = StyleSheet.create({
  outer: {
    width: 100,
    height: 100,
    backgroundColor: 'red',
  },
  inner: {
    position: 'absolute',
    width: 100,
    height: 100,
    top: 100,
    backgroundColor: 'green',
  },
});

class ScrollViewTest extends React.Component {
  render() {
    var styles = scrollTestStyles;
    var children = [];
    for (var i = 0; i < 4; i++) {
      children[i] = (
        <ClippableView key={i} style={styles.row} clippableViewID={'' + i}/>
      );
    }
    for (var i = 4; i < 6; i++) {
      var viewID = 'C' + (i - 4);
      children[i] = (
        <ClippableView
            key={i}
            style={styles.complex}
            clippableViewID={viewID}
            removeClippedSubviews={true}>
          <ClippableView style={styles.inner} clippableViewID={viewID + '.1'}/>
          <ClippableView style={styles.inner} clippableViewID={viewID + '.2'}/>
        </ClippableView>
      );
    }

    return (
      <ScrollView removeClippedSubviews={true} style={styles.scrollView} testID="scroll_view">
        {children}
      </ScrollView>
    );
  }
}

var scrollTestStyles = StyleSheet.create({
  scrollView: {
    width: 200,
    height: 300,
  },
  row: {
    flex: 1,
    height: 120,
    backgroundColor: 'red',
    borderColor: 'blue',
    borderBottomWidth: 1,
  },
  complex: {
    flex: 1,
    height: 240,
    backgroundColor: 'yellow',
    borderColor: 'blue',
    borderBottomWidth: 1,
  },
  inner: {
    flex: 1,
    margin: 10,
    height: 100,
    backgroundColor: 'gray',
    borderColor: 'green',
    borderWidth: 1,
  },
});


var appInstance = null;

class SubviewsClippingTestApp extends React.Component {
  state = {};

  componentWillMount() {
    appInstance = this;
  }

  setComponent = (component) => {
    this.setState({component: component});
  };

  render() {
    var component = this.state.component;
    return (
      <View>
        {component}
      </View>
    );
  }
}

var SubviewsClippingTestModule = {
  App: SubviewsClippingTestApp,
  renderClippingSample1: function() {
    appInstance.setComponent(<ClippingSample1/>);
  },
  renderClippingSample2: function() {
    appInstance.setComponent(<ClippingSample2/>);
  },
  renderUpdatingSample1: function(update1, update2) {
    appInstance.setComponent(<UpdatingSample1 update1={update1} update2={update2}/>);
  },
  renderUpdatingSample2: function(update) {
    appInstance.setComponent(<UpdatingSample2 update={update}/>);
  },
  renderScrollViewTest: function() {
    appInstance.setComponent(<ScrollViewTest/>);
  },
};

BatchedBridge.registerCallableModule(
  'SubviewsClippingTestModule',
  SubviewsClippingTestModule
);

module.exports = SubviewsClippingTestModule;
