/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import * as React from 'react';
import {Text, View} from 'react-native';

function InlineView(props: {
  textAlign: 'auto' | 'left' | 'right' | 'center' | 'justify',
  long?: boolean,
}): React.Node {
  return (
    <View style={{margin: 4}}>
      <Text style={{textAlign: props.textAlign, backgroundColor: 'cyan'}}>
        Parent
        <Text style={{fontWeight: 'bold'}}>Child</Text>
        <View style={{width: 30, height: 30, backgroundColor: 'red'}} />
        <Text style={{fontWeight: 'bold'}}>Child</Text>
        {props !== null && props.long === true && (
          <Text style={{fontWeight: 'bold'}}>
            aaaa a aaaa aaaaaa aaa a a a aaaaa sdsds dsdSAD asd ASDasd ASDas
          </Text>
        )}
      </Text>
    </View>
  );
}

export function TextInlineViewsExample(props: {}): React.Node {
  return (
    <>
      <View style={{flex: 1}} testID="view-test-inline-text-alignment">
        <Text style={{textAlign: 'center', fontSize: 14}}>BoringLayout</Text>
        <InlineView textAlign="left" />
        <InlineView textAlign="center" />
        <InlineView textAlign="right" />
        <InlineView textAlign="justify" />

        <Text style={{textAlign: 'center', fontSize: 14}}>StaticLayout</Text>
        <InlineView textAlign="left" long />
        <InlineView textAlign="center" long />
        <InlineView textAlign="right" long />
        <InlineView textAlign="justify" long />
      </View>
    </>
  );
}

export default ({
  title: 'TextInlineViewsExample',
  name: 'inlineViews',
  description:
    ('Shows how inline views are rendered when text is subject to alignment.': string),
  expect: 'The red box should align correctly with the rest of the text.',
  render: (): React.Node => <TextInlineViewsExample />,
}: RNTesterModuleExample);
