/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';
import {useRef, useState} from 'react';
import {View, Button, Text} from 'react-native';
import RNTMyNativeView, {
  Commands as RNTMyNativeViewCommands,
} from './MyNativeViewNativeComponent';
import RNTMyLegacyNativeView from './MyLegacyViewNativeComponent';
import type {MyNativeViewType} from './MyNativeViewNativeComponent';
import {UIManager} from 'react-native';

const colors = [
  '#0000FF',
  '#FF0000',
  '#00FF00',
  '#003300',
  '#330000',
  '#000033',
];

class HSBA {
  hue: number;
  saturation: number;
  brightness: number;
  alpha: number;

  constructor(
    hue: number = 0.0,
    saturation: number = 0.0,
    brightness: number = 0.0,
    alpha: number = 0.0,
  ) {
    this.hue = hue;
    this.saturation = saturation;
    this.brightness = brightness;
    this.alpha = alpha;
  }

  toString(): string {
    return `h: ${this.hue}, s: ${this.saturation}, b: ${this.brightness}, a: ${this.alpha}`;
  }
}

// This is an example component that migrates to use the new architecture.
export default function MyNativeView(props: {}): React.Node {
  const ref = useRef<React.ElementRef<MyNativeViewType> | null>(null);
  const [opacity, setOpacity] = useState(1.0);
  const [color, setColor] = useState('#FF0000');
  const [hsba, setHsba] = useState<HSBA>(new HSBA());
  return (
    <View style={{flex: 1}}>
      <Text style={{color: 'red'}}>Fabric View</Text>
      <RNTMyNativeView ref={ref} style={{flex: 1}} opacity={opacity} />
      <Text style={{color: 'red'}}>Legacy View</Text>
      <RNTMyLegacyNativeView
        style={{flex: 1}}
        opacity={opacity}
        color={color}
        onColorChanged={event =>
          setHsba(
            new HSBA(
              event.nativeEvent.backgroundColor.hue,
              event.nativeEvent.backgroundColor.saturation,
              event.nativeEvent.backgroundColor.brightness,
              event.nativeEvent.backgroundColor.alpha,
            ),
          )
        }
      />
      <Text>HSBA: {hsba.toString()}</Text>
      <Text>
        Constants From Interop Layer:{' '}
        {UIManager.RNTMyLegacyNativeView.Constants.PI}
      </Text>
      <Button
        title="Change Background"
        onPress={() => {
          let newColor = colors[Math.floor(Math.random() * 5)];
          setColor(newColor);
          RNTMyNativeViewCommands.callNativeMethodToChangeBackgroundColor(
            // $FlowFixMe[incompatible-call]
            ref.current,
            newColor,
          );
        }}
      />
      <Button
        title="Set Opacity"
        onPress={() => {
          setOpacity(Math.random());
        }}
      />
      <Button
        title="Console.log Measure"
        onPress={() => {
          ref.current?.measure((x, y, width, height) => {
            console.log(x, y, width, height);
          });
        }}
      />
    </View>
  );
}
