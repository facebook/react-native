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
import {Animated, StyleSheet, Text, View} from 'react-native';

import type {Node, Element} from 'react';

function AnimateTansformSingleProp() {
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
  flipCardContainer: {
    marginVertical: 40,
    flex: 1,
    alignSelf: 'center',
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
});

exports.title = 'Transforms';
exports.category = 'UI';
exports.documentationURL = 'https://reactnative.dev/docs/transforms';
exports.description = 'View transforms';
exports.examples = [
  {
    title: 'Perspective, Rotate, Animation',
    description: 'perspective: 850, rotateX: Animated.timing(0 -> 360)',
    render(): Element<any> {
      return <Flip />;
    },
  },
  {
    title: 'Translate, Rotate, Scale',
    description:
      "translateX: 100, translateY: 50, rotate: '30deg', scaleX: 2, scaleY: 2",
    render(): Node {
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
    render(): Node {
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
    render(): Node {
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
    render(): Node {
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
    render(): Node {
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
    render(): Node {
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
    render(): Node {
      return (
        <View style={styles.container}>
          <View style={[styles.box5, styles.box5Transform]} />
        </View>
      );
    },
  },
  {
    title: 'Amimate Translate single prop',
    description: "rotate: '360deg'",
    render(): Node {
      return <AnimateTansformSingleProp />;
    },
  },
];
