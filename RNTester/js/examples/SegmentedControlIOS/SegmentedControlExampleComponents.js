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

import * as React from 'react';
import {SegmentedControlIOS, Text, View, StyleSheet} from 'react-native';

export function BasicSegmentedControlExample(): React.Node {
  return (
    <View>
      <View style={{marginBottom: 10}}>
        <SegmentedControlIOS values={['One', 'Two']} />
      </View>
      <View>
        <SegmentedControlIOS values={['One', 'Two', 'Three', 'Four', 'Five']} />
      </View>
    </View>
  );
}

export function PreSelectedSegmentedControlExample(): React.Node {
  return (
    <View>
      <View>
        <SegmentedControlIOS values={['One', 'Two']} selectedIndex={0} />
      </View>
    </View>
  );
}

export function MomentarySegmentedControlExample(): React.Node {
  return (
    <View>
      <View>
        <SegmentedControlIOS values={['One', 'Two']} momentary={true} />
      </View>
    </View>
  );
}

export function DisabledSegmentedControlExample(): React.Node {
  return (
    <View>
      <View>
        <SegmentedControlIOS
          enabled={false}
          values={['One', 'Two']}
          selectedIndex={1}
        />
      </View>
    </View>
  );
}

export function ColorSegmentedControlExample(): React.Node {
  return (
    <View>
      <View style={{marginBottom: 10}}>
        <SegmentedControlIOS
          tintColor="#ff0000"
          values={['One', 'Two', 'Three', 'Four']}
          selectedIndex={0}
        />
      </View>
      <View>
        <SegmentedControlIOS
          tintColor="#00ff00"
          values={['One', 'Two', 'Three']}
          selectedIndex={1}
        />
      </View>
    </View>
  );
}

export function EventSegmentedControlExample(): React.Node {
  const [selectedIndex, setSelectedIndex] = React.useState(undefined);
  const [value, setValue] = React.useState('Not selected');
  const values = ['One', 'Two', 'Three'];

  return (
    <View>
      <Text style={styles.text}>Value: {value}</Text>
      <Text style={styles.text}>Index: {selectedIndex}</Text>
      <SegmentedControlIOS
        values={values}
        selectedIndex={selectedIndex}
        onChange={event => {
          setSelectedIndex(event.nativeEvent.selectedSegmentIndex);
        }}
        onValueChange={changedValue => {
          setValue(changedValue);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    margin: 10,
  },
});
