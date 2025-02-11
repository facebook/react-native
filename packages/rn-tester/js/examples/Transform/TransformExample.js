/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import React, {useEffect, useState} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';

function AnimateTransformSingleProp() {
  const [theta] = useState(new Animated.Value(45));
  const animate = () => {
    theta.setValue(0);
    Animated.timing(theta, {
      toValue: 100,
      duration: 3000,
      useNativeDriver: false,
    }).start(animate);
  };

  useEffect(() => {
    animate();
  });

  return (
    <View style={styles.flipCardContainer}>
      <Animated.View
        style={[
          styles.box6,
          {
            transform: [
              {
                rotate: theta.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}>
        <Text style={styles.flipText}>This text is flipping great.</Text>
      </Animated.View>
    </View>
  );
}

function TransformOriginExample() {
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.transformOriginWrapper}>
      <Animated.View
        style={[
          styles.transformOriginView,
          {
            transform: [{rotate: spin}],
          },
        ]}
      />
    </View>
  );
}

function Flip() {
  const [theta] = useState(new Animated.Value(45));
  const animate = () => {
    theta.setValue(0);
    Animated.timing(theta, {
      toValue: 360,
      duration: 5000,
      useNativeDriver: false,
    }).start(animate);
  };

  useEffect(() => {
    animate();
  });

  return (
    <View style={styles.flipCardContainer}>
      <Animated.View
        style={[
          styles.flipCard,
          {
            transform: [
              {perspective: 850},
              {
                rotateX: theta.interpolate({
                  inputRange: [0, 180],
                  outputRange: ['0deg', '180deg'],
                }),
              },
            ],
          },
        ]}>
        <Text style={styles.flipText}>This text is flipping great.</Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.flipCard,
          styles.flipCard1,
          {
            transform: [
              {perspective: 850},
              {
                rotateX: theta.interpolate({
                  inputRange: [0, 180],
                  outputRange: ['180deg', '360deg'],
                }),
              },
            ],
          },
        ]}>
        <Text style={styles.flipText}>On the flip side...</Text>
      </Animated.View>
    </View>
  );
}

function TranslatePercentage() {
  return <View style={styles.translatePercentageView} />;
}

const styles = StyleSheet.create({
  container: {
    height: 500,
  },
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
    backgroundColor: 'lightpink',
    height: 50,
    position: 'absolute',
    top: 0,
    transform: [{rotate: '30deg'}],
    width: 50,
  },
  box3step2: {
    left: 0,
    backgroundColor: 'hotpink',
    height: 50,
    opacity: 0.5,
    position: 'absolute',
    top: 0,
    transform: [{rotate: '30deg'}, {scaleX: 2}, {scaleY: 2}],
    width: 50,
  },
  box3step3: {
    left: 0,
    backgroundColor: 'deeppink',
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
    backgroundColor: 'darkorange',
    height: 50,
    position: 'absolute',
    top: 0,
    transform: [{translate: [200, 350]}, {scale: 2.5}, {rotate: '-0.2rad'}],
    width: 100,
  },
  box5: {
    backgroundColor: 'maroon',
    height: 50,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 50,
  },
  box5Transform: {
    transform: [{translate: [-50, 35]}, {rotate: '50deg'}, {scale: 2}],
  },
  box6: {
    backgroundColor: 'salmon',
    alignSelf: 'center',
  },
  box7: {
    backgroundColor: 'lightseagreen',
    height: 50,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 50,
  },
  box7Transform: {
    transform: 'translate(-50px, 35px) rotate(50deg) scale(2)',
  },
  flipCardContainer: {
    marginVertical: 40,
    flex: 1,
    alignSelf: 'center',
    zIndex: 0,
  },
  flipCard: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'blue',
    backfaceVisibility: 'hidden',
  },
  flipCard1: {
    position: 'absolute',
    top: 0,
    backgroundColor: 'red',
  },
  flipText: {
    width: 90,
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  transformOriginWrapper: {
    alignItems: 'center',
  },
  transformOriginView: {
    backgroundColor: 'pink',
    width: 100,
    height: 100,
    transformOrigin: 'top left',
  },
  translatePercentageView: {
    transform: 'translate(50%)',
    padding: 50,
    alignSelf: 'flex-start',
    backgroundColor: 'lightblue',
  },
});

exports.title = 'Transforms';
exports.category = 'UI';
exports.documentationURL = 'https://reactnative.dev/docs/transforms';
exports.description = 'View transforms';
exports.examples = [
  {
    title: 'Perspective, Rotate, Animation',
    description: 'perspective: 850, rotateX: Animated.timing(0 -> 360)',
    render(): React.Node {
      return <Flip />;
    },
  },
  {
    title: 'Translate, Rotate, Scale',
    description:
      "translateX: 100, translateY: 50, rotate: '30deg', scaleX: 2, scaleY: 2",
    render(): React.Node {
      return (
        <View style={styles.container}>
          <View style={styles.box1} />
        </View>
      );
    },
  },
  {
    title: 'Scale, Translate, Rotate, ',
    description:
      "scaleX: 2, scaleY: 2, translateX: 100, translateY: 50, rotate: '30deg'",
    render(): React.Node {
      return (
        <View style={styles.container}>
          <View style={styles.box2} />
        </View>
      );
    },
  },
  {
    title: 'Rotate',
    description: "rotate: '30deg'",
    render(): React.Node {
      return (
        <View style={styles.container}>
          <View style={styles.box3step1} />
        </View>
      );
    },
  },
  {
    title: 'Rotate, Scale',
    description: "rotate: '30deg', scaleX: 2, scaleY: 2",
    render(): React.Node {
      return (
        <View style={styles.container}>
          <View style={styles.box3step2} />
        </View>
      );
    },
  },
  {
    title: 'Rotate, Scale, Translate ',
    description:
      "rotate: '30deg', scaleX: 2, scaleY: 2, translateX: 100, translateY: 50",
    render(): React.Node {
      return (
        <View style={styles.container}>
          <View style={styles.box3step3} />
        </View>
      );
    },
  },
  {
    title: 'Translate, Scale, Rotate',
    description: "translate: [200, 350], scale: 2.5, rotate: '-0.2rad'",
    render(): React.Node {
      return (
        <View style={styles.container}>
          <View style={styles.box4} />
        </View>
      );
    },
  },
  {
    title: 'Translate, Rotate, Scale',
    description: "translate: [-50, 35], rotate: '50deg', scale: 2",
    render(): React.Node {
      return (
        <View style={styles.container}>
          <View style={[styles.box5, styles.box5Transform]} />
        </View>
      );
    },
  },
  {
    title: 'Animate Translate single prop',
    description: "rotate: '360deg'",
    render(): React.Node {
      return <AnimateTransformSingleProp />;
    },
  },
  {
    title: 'Transform using a string',
    description: "transform: 'translate(-50px, 35px) rotate(50deg) scale(2)'",
    render(): React.Node {
      return (
        <View style={styles.container}>
          <View style={[styles.box7, styles.box7Transform]} />
        </View>
      );
    },
  },
  {
    title: 'Transform origin',
    description: "transformOrigin: 'top left'",
    render(): React.Node {
      return <TransformOriginExample />;
    },
  },
  {
    title: 'Translate Percentage',
    description: "transform: 'translate(50%)'",
    render(): React.Node {
      return <TranslatePercentage />;
    },
  },
];
