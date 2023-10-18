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
import {View, Button, Text, UIManager} from 'react-native';
import RNTMyNativeView, {
  Commands as RNTMyNativeViewCommands,
} from './MyNativeViewNativeComponent';
import RNTMyLegacyNativeView from './MyLegacyViewNativeComponent';
import type {MyLegacyViewType} from './MyLegacyViewNativeComponent';
import type {MyNativeViewType} from './MyNativeViewNativeComponent';
import {callNativeMethodToChangeBackgroundColor} from './MyLegacyViewNativeComponent';
const colors = [
  '#0000FF',
  '#FF0000',
  '#00FF00',
  '#003300',
  '#330000',
  '#000033',
];

const cornerRadiuses = [0, 20, 40, 60, 80, 100, 120];

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

function beautify(number: number): string {
  if (number % 1 === 0) {
    return number.toFixed();
  }
  return number.toFixed(2);
}

type MeasureStruct = {
  x: number,
  y: number,
  width: number,
  height: number,
};

const MeasureStructZero: MeasureStruct = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

function getTextFor(measureStruct: MeasureStruct): string {
  return `x: ${beautify(measureStruct.x)}, y: ${beautify(
    measureStruct.y,
  )}, width: ${beautify(measureStruct.width)}, height: ${beautify(
    measureStruct.height,
  )}`;
}

// This is an example component that migrates to use the new architecture.
export default function MyNativeView(props: {}): React.Node {
  const containerRef = useRef<typeof View | null>(null);
  const ref = useRef<React.ElementRef<MyNativeViewType> | null>(null);
  const legacyRef = useRef<React.ElementRef<MyLegacyViewType> | null>(null);
  const [opacity, setOpacity] = useState(1.0);
  const [arrayValues, setArrayValues] = useState([1, 2, 3]);
  const [hsba, setHsba] = useState<HSBA>(new HSBA());
  const [cornerRadiusIndex, setCornerRadiusIndex] = useState<number>(0);
  const [legacyMeasure, setLegacyMeasure] =
    useState<MeasureStruct>(MeasureStructZero);
  const [legacyMeasureInWindow, setLegacyMeasureInWindow] =
    useState<MeasureStruct>(MeasureStructZero);
  const [legacyMeasureLayout, setLegacyMeasureLayout] =
    useState<MeasureStruct>(MeasureStructZero);
  return (
    <View ref={containerRef} style={{flex: 1}}>
      <Text style={{color: 'red'}}>Fabric View</Text>
      <RNTMyNativeView
        ref={ref}
        style={{flex: 1}}
        opacity={opacity}
        values={arrayValues}
        onIntArrayChanged={event => {
          console.log(event.nativeEvent.values);
          console.log(event.nativeEvent.boolValues);
          console.log(event.nativeEvent.floats);
          console.log(event.nativeEvent.doubles);
          console.log(event.nativeEvent.yesNos);
          console.log(event.nativeEvent.strings);
          console.log(event.nativeEvent.latLons);
          console.log(event.nativeEvent.multiArrays);
        }}
      />
      <Text style={{color: 'red'}}>Legacy View</Text>
      <RNTMyLegacyNativeView
        ref={legacyRef}
        style={{flex: 1}}
        opacity={opacity}
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
      <Text style={{color: 'green', textAlign: 'center'}}>
        HSBA: {hsba.toString()}
      </Text>
      <Text style={{color: 'green', textAlign: 'center'}}>
        Constants From Interop Layer:{' '}
        {UIManager.getViewManagerConfig('RNTMyLegacyNativeView').Constants.PI}
      </Text>
      <Button
        title="Change Background"
        onPress={() => {
          let newColor = colors[Math.floor(Math.random() * 5)];
          RNTMyNativeViewCommands.callNativeMethodToChangeBackgroundColor(
            // $FlowFixMe[incompatible-call]
            ref.current,
            newColor,
          );

          callNativeMethodToChangeBackgroundColor(legacyRef.current, newColor);
        }}
      />
      <Button
        title="Set Opacity"
        onPress={() => {
          setOpacity(Math.random());
          setArrayValues([
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
          ]);
        }}
      />
      <Button
        title="Console.log Measure"
        onPress={() => {
          ref.current?.measure((x, y, width, height) => {
            console.log(x, y, width, height);
          });

          legacyRef.current?.measure((x, y, width, height) => {
            setLegacyMeasure({x, y, width, height});
          });
          legacyRef.current?.measureInWindow((x, y, width, height) => {
            setLegacyMeasureInWindow({x, y, width, height});
          });

          if (containerRef.current) {
            legacyRef.current?.measureLayout(
              // $FlowFixMe[incompatible-call]
              containerRef.current,
              (x, y, width, height) => {
                setLegacyMeasureLayout({x, y, width, height});
              },
            );
          }
        }}
      />

      <Text style={{color: 'green', textAlign: 'center'}}>
        &gt; Interop Layer Measurements &lt;
      </Text>
      <Text style={{color: 'green', textAlign: 'center'}}>
        measure {getTextFor(legacyMeasure)}
      </Text>
      <Text style={{color: 'green', textAlign: 'center'}}>
        InWindow {getTextFor(legacyMeasureInWindow)}
      </Text>
      <Text style={{color: 'green', textAlign: 'center'}}>
        InLayout {getTextFor(legacyMeasureLayout)}
      </Text>
      <Button
        title="Test setNativeProps"
        onPress={() => {
          const newCRIndex =
            cornerRadiusIndex + 1 >= cornerRadiuses.length
              ? 0
              : cornerRadiusIndex + 1;
          setCornerRadiusIndex(newCRIndex);
          legacyRef.current?.setNativeProps({
            cornerRadius: cornerRadiuses[newCRIndex],
          });
        }}
      />
    </View>
  );
}
