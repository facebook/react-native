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
import {Platform, ScrollView} from 'react-native';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import View from '../../Components/View/View';
import * as LogBoxStyle from './LogBoxStyle';
import type {CodeFrame} from '../Data/parseLogBoxLog';

type Props = $ReadOnly<{|
  codeFrame: ?CodeFrame,
|}>;

function LogBoxInspectorCodeFrame(props: Props): React.Node {
  const codeFrame = props.codeFrame;
  if (codeFrame == null) {
    return null;
  }

  function getFileName() {
    const matches = /[^/]*$/.exec(codeFrame.fileName);
    if (matches && matches.length > 0) {
      return matches[0];
    }

    return codeFrame.fileName;
  }

  return (
    <View style={metaStyles.section}>
      <View style={metaStyles.box}>
        <ScrollView horizontal>
          <Text style={metaStyles.headingText}>{codeFrame.content}</Text>
        </ScrollView>
      </View>
      <Text style={metaStyles.fileText}>
        {getFileName()} {codeFrame.location}
      </Text>
    </View>
  );
}

const metaStyles = StyleSheet.create({
  section: {
    marginTop: 30,
    marginBottom: 20,
  },
  box: {
    backgroundColor: LogBoxStyle.getBackgroundColor(),
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 3,
    padding: 10,
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
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 20,
    fontFamily: Platform.select({android: 'monospace', ios: 'Menlo'}),
  },
  fileText: {
    color: LogBoxStyle.getTextColor(0.5),
    textAlign: 'center',
    flex: 1,
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 20,
    fontFamily: Platform.select({android: 'monospace', ios: 'Menlo'}),
  },
  body: {
    paddingLeft: 25,
    paddingRight: 25,
    paddingBottom: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bodyItem: {
    flex: 0,
  },
  bodyText: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 20,
    flex: 0,
    flexGrow: 0,
  },
});

export default LogBoxInspectorCodeFrame;
