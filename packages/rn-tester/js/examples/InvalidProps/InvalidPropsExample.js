/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import * as React from 'react';

import {Text, View} from 'react-native';

export const title = 'Invalid Props';
export const category = 'Other';
export const description =
  'Examples of passing invalid prop values and how they fall back to expected defaults.';

export const examples = [
  {
    title: 'View flex',
    render(): React.Node {
      return (
        <Comparison actual={[1]} expected={undefined}>
          {flex => (
            <View style={{height: 50}}>
              <View
                style={
                  // $FlowFixMe[incompatible-type]
                  {
                    flex,
                    backgroundColor: 'red',
                  }
                }
              />
              <View style={{flex: 1, backgroundColor: 'lightgreen'}} />
            </View>
          )}
        </Comparison>
      );
    },
  },
  {
    title: 'View flexDirection',
    render(): React.Node {
      return (
        <Comparison actual={'row.'} expected={undefined}>
          {flexDirection => (
            <View
              // $FlowFixMe[incompatible-type]
              style={{flexDirection}}>
              <Text>⬇️</Text>
              <Text>⬇️</Text>
            </View>
          )}
        </Comparison>
      );
    },
  },
  {
    title: 'Text fontVariant',
    render(): React.Node {
      return (
        <Comparison
          actual={['no-such-variant', 'small-caps-12345']}
          expected={undefined}>
          {fontVariant => (
            <Text
              style={
                // $FlowFixMe[incompatible-type]
                {fontVariant}
              }>
              The quick brown fox jumps over the lazy dog.
            </Text>
          )}
        </Comparison>
      );
    },
  },
  {
    title: 'View width',
    render(): React.Node {
      return (
        <Comparison actual={['invalid']} expected={undefined}>
          {width => (
            <View style={{backgroundColor: 'red'}}>
              <View
                style={
                  // $FlowFixMe[incompatible-type]
                  {width, height: 50, backgroundColor: 'lightgreen'}
                }
              />
            </View>
          )}
        </Comparison>
      );
    },
  },
  {
    title: 'View background color',
    render(): React.Node {
      return (
        <Comparison actual={['invalid']} expected={undefined}>
          {backgroundColor => (
            <View style={{backgroundColor: 'lightgreen'}}>
              <View
                style={
                  // $FlowFixMe[incompatible-type]
                  {backgroundColor, height: 50}
                }
              />
            </View>
          )}
        </Comparison>
      );
    },
  },
  {
    title: 'Malformed platform color',
    render(): React.Node {
      return (
        <Comparison
          actual={{resource_paths: ([]: Array<string>)}}
          expected={undefined}>
          {backgroundColor => (
            <View style={{backgroundColor: 'lightgreen'}}>
              <View
                style={
                  // $FlowFixMe[incompatible-type]
                  {backgroundColor, height: 50}
                }
              />
            </View>
          )}
        </Comparison>
      );
    },
  },
];

function Comparison<ExpectedT, ActualT>({
  children,
  actual,
  expected,
}: {
  children: (value: ExpectedT | ActualT) => React.Node,
  actual: ActualT,
  expected: ExpectedT,
}): React.Node {
  return (
    <>
      <Text style={{fontWeight: 'bold'}}>Actual</Text>
      {children(actual)}
      <Text style={{fontWeight: 'bold'}}>Expected</Text>
      {children(expected)}
    </>
  );
}
