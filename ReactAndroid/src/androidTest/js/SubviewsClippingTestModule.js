/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const {
  ScrollView,
  StyleSheet,
  View,
  requireNativeComponent,
} = require('react-native');
const BatchedBridge = require('react-native/Libraries/BatchedBridge/BatchedBridge');

const ClippableView = requireNativeComponent('ClippableView');

class ClippingSample1 extends React.Component {
  render() {
    return (
      <View>
        <ClippableView
          clippableViewID="outer"
          style={sample1Styles.outer}
          removeClippedSubviews={true}>
          <ClippableView
            clippableViewID="inner1"
            style={[sample1Styles.inner, sample1Styles.inner1]}
          />
          <ClippableView
            clippableViewID="inner2"
            style={[sample1Styles.inner, sample1Styles.inner2]}
          />
          <ClippableView
            clippableViewID="inner3"
            style={[sample1Styles.inner, sample1Styles.inner3]}
          />
          <ClippableView
            clippableViewID="inner4"
            style={[sample1Styles.inner, sample1Styles.inner4]}
          />
          <ClippableView
            clippableViewID="inner5"
            style={[sample1Styles.inner, sample1Styles.inner5]}
          />
        </ClippableView>
      </View>
    );
  }
}

const sample1Styles = StyleSheet.create({
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
    return (
      <View>
        <ClippableView
          clippableViewID="outer"
          style={sample2Styles.outer}
          removeClippedSubviews={true}>
          <ClippableView
            clippableViewID="complexInner"
            style={sample2Styles.complexInner}
            removeClippedSubviews={true}>
            <ClippableView
              clippableViewID="inner1"
              style={[sample2Styles.inner, sample2Styles.inner1]}
            />
            <ClippableView
              clippableViewID="inner2"
              style={[sample2Styles.inner, sample2Styles.inner2]}
            />
            <ClippableView
              clippableViewID="inner3"
              style={[sample2Styles.inner, sample2Styles.inner3]}
            />
            <ClippableView
              clippableViewID="inner4"
              style={[sample2Styles.inner, sample2Styles.inner4]}
            />
          </ClippableView>
        </ClippableView>
      </View>
    );
  }
}

const sample2Styles = StyleSheet.create({
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
    const inner1Styles = [
      updating1Styles.inner1,
      {height: this.props.update1 ? 200 : 100},
    ];

    const inner2Styles = [
      updating1Styles.inner2,
      {top: this.props.update2 ? 200 : 50},
    ];

    return (
      <View>
        <ClippableView
          clippableViewID="outer"
          style={updating1Styles.outer}
          removeClippedSubviews={true}>
          <ClippableView clippableViewID="inner1" style={inner1Styles} />
          <ClippableView clippableViewID="inner2" style={inner2Styles} />
        </ClippableView>
      </View>
    );
  }
}

const updating1Styles = StyleSheet.create({
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
  },
});

class UpdatingSample2 extends React.Component {
  render() {
    const outerStyles = [
      updating2Styles.outer,
      {height: this.props.update ? 200 : 100},
    ];

    return (
      <View>
        <ClippableView
          clippableViewID="outer"
          style={outerStyles}
          removeClippedSubviews={true}>
          <ClippableView
            clippableViewID="inner"
            style={updating2Styles.inner}
          />
        </ClippableView>
      </View>
    );
  }
}

const updating2Styles = StyleSheet.create({
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
    const children = [];
    for (let i = 0; i < 4; i++) {
      children[i] = (
        <ClippableView
          key={i}
          style={scrollTestStyles.row}
          clippableViewID={'' + i}
        />
      );
    }
    for (let i = 4; i < 6; i++) {
      const viewID = 'C' + (i - 4);
      children[i] = (
        <ClippableView
          key={i}
          style={scrollTestStyles.complex}
          clippableViewID={viewID}
          removeClippedSubviews={true}>
          <ClippableView
            style={scrollTestStyles.inner}
            clippableViewID={viewID + '.1'}
          />
          <ClippableView
            style={scrollTestStyles.inner}
            clippableViewID={viewID + '.2'}
          />
        </ClippableView>
      );
    }

    return (
      <ScrollView
        removeClippedSubviews={true}
        style={scrollTestStyles.scrollView}
        testID="scroll_view">
        {children}
      </ScrollView>
    );
  }
}

const scrollTestStyles = StyleSheet.create({
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

let appInstance = null;

class SubviewsClippingTestApp extends React.Component {
  state = {};

  UNSAFE_componentWillMount() {
    appInstance = this;
  }

  setComponent = component => {
    this.setState({component: component});
  };

  render() {
    const component = this.state.component;
    return <View>{component}</View>;
  }
}

const SubviewsClippingTestModule = {
  App: SubviewsClippingTestApp,
  renderClippingSample1: function() {
    appInstance.setComponent(<ClippingSample1 />);
  },
  renderClippingSample2: function() {
    appInstance.setComponent(<ClippingSample2 />);
  },
  renderUpdatingSample1: function(update1, update2) {
    appInstance.setComponent(
      <UpdatingSample1 update1={update1} update2={update2} />,
    );
  },
  renderUpdatingSample2: function(update) {
    appInstance.setComponent(<UpdatingSample2 update={update} />);
  },
  renderScrollViewTest: function() {
    appInstance.setComponent(<ScrollViewTest />);
  },
};

BatchedBridge.registerCallableModule(
  'SubviewsClippingTestModule',
  SubviewsClippingTestModule,
);

module.exports = SubviewsClippingTestModule;
