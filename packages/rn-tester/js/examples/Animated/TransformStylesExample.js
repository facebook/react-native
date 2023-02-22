/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import RNTOption from '../../components/RNTOption';
import * as React from 'react';
import {Animated, Text, View, StyleSheet} from 'react-native';
import RNTConfigurationBlock from '../../components/RNTConfigurationBlock';
import RNTesterButton from '../../components/RNTesterButton';
import ToggleNativeDriver from './utils/ToggleNativeDriver';

const transformProperties = {
  rotate: {outputRange: ['0deg', '360deg'], selected: false},
  rotateX: {outputRange: ['0deg', '360deg'], selected: false},
  rotateY: {outputRange: ['0deg', '360deg'], selected: false},
  rotateZ: {outputRange: ['0deg', '360deg'], selected: false},
  skewX: {outputRange: ['0deg', '45deg'], selected: false},
  skewY: {outputRange: ['0deg', '45deg'], selected: false},
  perspective: {outputRange: [1, 2], selected: false},
  scale: {outputRange: [1, 3], selected: false},
  scaleX: {outputRange: [1, 3], selected: false},
  scaleY: {outputRange: [1, 3], selected: false},
  translateX: {outputRange: [0, 100], selected: false},
  translateY: {outputRange: [0, 100], selected: false},
};

function AnimatedView({
  properties,
  useNativeDriver,
}: {
  properties: Array<string>,
  useNativeDriver: boolean,
}) {
  const animatedValue = new Animated.Value(0);
  const transformStyles = properties.map(property => ({
    [property]: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: transformProperties[property].outputRange,
    }),
  }));
  const animation = Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 500,
      useNativeDriver,
    }),
  ]);
  return (
    <>
      <RNTesterButton
        onPress={() => {
          animation.reset();
          animation.start();
        }}>
        Apply Selected Transforms
      </RNTesterButton>
      <Animated.View
        style={[styles.animatedView, {transform: transformStyles}]}
      />
    </>
  );
}

function notSupportedByNativeDriver(property: string) {
  return property === 'skewX' || property === 'skewY';
}

function AnimatedTransformStyleExample(): React.Node {
  const [properties, setProperties] = React.useState(transformProperties);
  const [useNativeDriver, setUseNativeDriver] = React.useState(false);
  const onToggle = (property: string) =>
    setProperties({
      ...properties,
      [property]: {
        ...properties[property],
        selected: !properties[property].selected,
      },
    });
  const theme = React.useContext(RNTesterThemeContext);

  return (
    <View>
      <RNTConfigurationBlock>
        <ToggleNativeDriver
          value={useNativeDriver}
          onValueChange={setUseNativeDriver}
          style={StyleSheet.compose(styles.bottomSeparation, {
            borderBottomColor: theme.SeparatorColor,
          })}
        />
        <Text style={styles.optionsTitle}>Selected Styles</Text>
        <View style={styles.options}>
          {Object.keys(properties).map(property => {
            return (
              <RNTOption
                key={property}
                label={property}
                multiSelect
                disabled={
                  notSupportedByNativeDriver(property) && useNativeDriver
                }
                selected={properties[property].selected}
                onPress={() => {
                  onToggle(property);
                }}
                style={styles.option}
              />
            );
          })}
        </View>
      </RNTConfigurationBlock>
      <AnimatedView
        key={`animated-view-use-${useNativeDriver ? 'native' : 'js'}-driver`}
        useNativeDriver={useNativeDriver}
        // $FlowFixMe[incompatible-call]
        properties={Object.keys(properties).filter(
          property =>
            properties[property].selected &&
            !(useNativeDriver && notSupportedByNativeDriver(property)),
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  optionsTitle: {
    marginTop: 4,
    marginBottom: 6,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    margin: 2,
  },
  animatedView: {
    height: 100,
    width: 100,
    backgroundColor: 'blue',
  },
  bottomSeparation: {
    paddingBottom: 6,
    marginBottom: 6,
    borderBottomWidth: 1,
  },
});

export default ({
  title: 'Transform Styles',
  name: 'transformStyles',
  description:
    'Variations of transform styles. `skewX` and `skewY` are not supported on native driver.',
  render: () => <AnimatedTransformStyleExample />,
}: RNTesterModuleExample);
