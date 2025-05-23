/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import {useTheme} from '../../components/RNTesterTheme';
import {View} from 'react-native';

function InlineView(props: {
  textAlign: 'auto' | 'left' | 'right' | 'center' | 'justify',
  long?: boolean,
}): React.Node {
  return (
    <View style={{margin: 4}}>
      <RNTesterText
        style={{textAlign: props.textAlign, backgroundColor: 'cyan'}}>
        Parent
        <RNTesterText style={{fontWeight: 'bold'}}>Child</RNTesterText>
        <View style={{width: 30, height: 30, backgroundColor: 'red'}} />
        <RNTesterText style={{fontWeight: 'bold'}}>Child</RNTesterText>
        {props !== null && props.long === true && (
          <RNTesterText style={{fontWeight: 'bold'}}>
            aaaa a aaaa aaaaaa aaa a a a aaaaa sdsds dsdSAD asd ASDasd ASDas
          </RNTesterText>
        )}
      </RNTesterText>
    </View>
  );
}

function TextInlineViewsExample(props: {}): React.Node {
  return (
    <View style={{flex: 1}} testID="view-test-inline-text-alignment">
      <RNTesterText style={{textAlign: 'center', fontSize: 14}}>
        BoringLayout
      </RNTesterText>
      <InlineView textAlign="left" />
      <InlineView textAlign="center" />
      <InlineView textAlign="right" />
      <InlineView textAlign="justify" />

      <RNTesterText style={{textAlign: 'center', fontSize: 14}}>
        StaticLayout
      </RNTesterText>
      <InlineView textAlign="left" long />
      <InlineView textAlign="center" long />
      <InlineView textAlign="right" long />
      <InlineView textAlign="justify" long />
    </View>
  );
}

function EmptyTextExample(): React.Node {
  const {BorderColor} = useTheme();
  return (
    <RNTesterText
      testID="empty-text"
      style={{
        borderWidth: 1,
        borderColor: BorderColor,
      }}
    />
  );
}

export default [
  {
    title: 'Empty Text',
    name: 'emptyText',
    render: EmptyTextExample,
  },
  {
    title: 'TextInlineViewsExample',
    name: 'inlineViews',
    description:
      'Shows how inline views are rendered when text is subject to alignment.',
    expect: 'The red box should align correctly with the rest of the text.',
    render: TextInlineViewsExample,
  },
] as $ReadOnlyArray<RNTesterModuleExample>;
