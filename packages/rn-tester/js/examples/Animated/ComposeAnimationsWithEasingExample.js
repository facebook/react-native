/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import * as React from 'react';
import RNTesterButton from '../../components/RNTesterButton';
import {Text, Easing, StyleSheet, View, Animated} from 'react-native';

const styles = StyleSheet.create({
  content: {
    backgroundColor: 'deepskyblue',
    borderWidth: 1,
    borderColor: 'dodgerblue',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default ({
  title: 'Composite Animations with Easing',
  description: ('Sequence, parallel, delay, and ' +
    'stagger with different easing functions.': string),
  render: function(): React.Node {
    // $FlowFixMe[incompatible-use]
    // $FlowFixMe[incompatible-type]
    this.anims = this.anims || [1, 2, 3].map(() => new Animated.Value(0));
    return (
      <View>
        <RNTesterButton
          onPress={() => {
            const timing = Animated.timing;
            Animated.sequence([
              // One after the other
              // $FlowFixMe[incompatible-use]
              timing(this.anims[0], {
                toValue: 200,
                // $FlowFixMe[method-unbinding]
                easing: Easing.linear,
                useNativeDriver: false,
              }),
              Animated.delay(400), // Use with sequence
              // $FlowFixMe[incompatible-use]
              timing(this.anims[0], {
                toValue: 0,

                // Springy
                easing: Easing.elastic(2),

                useNativeDriver: false,
              }),
              Animated.delay(400),
              Animated.stagger(
                200,
                // $FlowFixMe[incompatible-use]
                this.anims
                  .map(anim =>
                    timing(anim, {
                      toValue: 200,
                      useNativeDriver: false,
                    }),
                  )
                  .concat(
                    // $FlowFixMe[incompatible-use]
                    this.anims.map(anim =>
                      timing(anim, {
                        toValue: 0,
                        useNativeDriver: false,
                      }),
                    ),
                  ),
              ),
              Animated.delay(400),
              Animated.parallel(
                [
                  // $FlowFixMe[method-unbinding]
                  Easing.inOut(Easing.quad), // Symmetric
                  Easing.back(1.5), // Goes backwards first
                  Easing.ease, // Default bezier
                ].map((easing, ii) =>
                  // $FlowFixMe[incompatible-use]
                  timing(this.anims[ii], {
                    toValue: 320,
                    // $FlowFixMe[method-unbinding]
                    easing,
                    duration: 3000,
                    useNativeDriver: false,
                  }),
                ),
              ),
              Animated.delay(400),
              Animated.stagger(
                200,
                // $FlowFixMe[incompatible-use]
                this.anims.map(anim =>
                  timing(anim, {
                    toValue: 0,

                    // Like a ball
                    // $FlowFixMe[method-unbinding]
                    easing: Easing.bounce,

                    duration: 2000,
                    useNativeDriver: false,
                  }),
                ),
              ),
            ]).start();
          }}>
          Press to Animate
        </RNTesterButton>
        {['Composite', 'Easing', 'Animations!'].map((text, ii) => (
          <Animated.View
            key={text}
            style={[
              styles.content,
              {
                // $FlowFixMe[incompatible-use]
                left: this.anims[ii],
              },
            ]}>
            <Text>{text}</Text>
          </Animated.View>
        ))}
      </View>
    );
  },
}: RNTesterModuleExample);
