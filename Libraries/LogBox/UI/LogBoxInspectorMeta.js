/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import * as React from 'react';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import View from '../../Components/View/View';
import Platform from '../../Utilities/Platform';
import * as LogBoxStyle from './LogBoxStyle';
import LogBoxInspectorSection from './LogBoxInspectorSection';
type Props = $ReadOnly<{||}>;

function LogBoxInspectorMeta(props: Props): React.Node {
  return (
    <LogBoxInspectorSection heading="Meta">
      <View style={metaStyles.body}>
        <View style={metaStyles.bodyItem}>
          <Text style={metaStyles.bodyText}>Platform</Text>
          <Text style={metaStyles.bodyText}>Engine</Text>
        </View>
        <View style={metaStyles.bodyItem}>
          {/* TODO: Determine engine correctly */}
          <Text style={[metaStyles.bodyText, metaStyles.bodyTextRight]}>
            {Platform.OS === 'android' ? 'Android' : 'iOS'}
          </Text>
          <Text style={[metaStyles.bodyText, metaStyles.bodyTextRight]}>
            {global.HermesInternal ? 'Hermes' : 'Unknown'}
          </Text>
        </View>
      </View>
    </LogBoxInspectorSection>
  );
}

const metaStyles = StyleSheet.create({
  body: {
    paddingLeft: 25,
    paddingRight: 25,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bodyItem: {
    flex: 0,
  },
  bodyText: {
    color: LogBoxStyle.getTextColor(0.5),
    fontSize: 14,
    paddingTop: 3,
    paddingBottom: 3,
    includeFontPadding: false,
    lineHeight: 20,
    flex: 0,
    flexGrow: 0,
  },
  bodyTextRight: {
    textAlign: 'right',
  },
});

export default LogBoxInspectorMeta;
