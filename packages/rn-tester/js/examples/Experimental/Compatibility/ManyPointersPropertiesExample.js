/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {RNTesterModuleExample} from '../../../types/RNTesterTypes';
import type {PointerEvent} from 'react-native/Libraries/Types/CoreEventTypes';

const styles = StyleSheet.create({
  container: {height: '30%', width: '100%', backgroundColor: 'black'},
  properties: {},
  property: {borderWidth: 1, margin: 10},
});

function ManyPointersPropertiesExample(): React.Node {
  const [data, setData] = React.useState<{}>({});
  const onPointerMove = (event: PointerEvent) => {
    const pointerId = event.nativeEvent.pointerId;
    setData({...data, [pointerId]: event.nativeEvent});
  };

  return (
    <>
      <View style={styles.container} onPointerMove={onPointerMove} />
      <View style={styles.properties}>
        {Object.entries(data).map(
          //$FlowFixMe can't supply generic for Object.entries
          ([key, evt]: [string, PointerEvent['nativeEvent']]) => (
            <View style={styles.property} key={key}>
              <Text>PointerID: {evt.pointerId}</Text>
              <Text>
                Offset: [{evt.offsetX.toPrecision(3)},{' '}
                {evt.offsetY.toPrecision(3)}]
              </Text>
              <Text>
                Coordinates: [{evt.clientX.toPrecision(3)},{' '}
                {evt.clientY.toPrecision(3)}]
              </Text>
              <Text>Button: {evt.button}</Text>
              <Text>Pressure: {evt.pressure}</Text>
            </View>
          ),
        )}
      </View>
    </>
  );
}

export default ({
  name: 'many_pointers_properties_example',
  description: 'Display of properties for multiple pointers',
  title: 'Display Properties of many pointers',
  render(): React.Node {
    return <ManyPointersPropertiesExample />;
  },
}: RNTesterModuleExample);
