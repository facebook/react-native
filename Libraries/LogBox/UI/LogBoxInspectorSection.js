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
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import View from '../../Components/View/View';
import * as LogBoxStyle from './LogBoxStyle';

type Props = $ReadOnly<{|
  heading: string,
  children: React.Node,
  action?: ?React.Node,
|}>;

function LogBoxInspectorSection(props: Props): React.Node {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text style={styles.headingText}>{props.heading}</Text>
        {props.action}
      </View>
      <View style={styles.body}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 15,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  headingText: {
    color: LogBoxStyle.getTextColor(1),
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 20,
  },
  body: {
    paddingBottom: 10,
  },
});

export default LogBoxInspectorSection;
