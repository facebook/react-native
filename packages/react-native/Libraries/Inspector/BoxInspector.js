/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {TextStyleProp, ViewStyleProp} from '../StyleSheet/StyleSheet';
import type {InspectedElementFrame} from './Inspector';

import React from 'react';

const View = require('../Components/View/View');
const StyleSheet = require('../StyleSheet/StyleSheet');
const Text = require('../Text/Text');
const resolveBoxStyle = require('./resolveBoxStyle');

const blank = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

type BoxInspectorProps = $ReadOnly<{
  style: ViewStyleProp,
  frame: ?InspectedElementFrame,
}>;

function BoxInspector({style, frame}: BoxInspectorProps): React.Node {
  const margin = (style && resolveBoxStyle('margin', style)) || blank;
  const padding = (style && resolveBoxStyle('padding', style)) || blank;

  return (
    <BoxContainer title="margin" titleStyle={styles.marginLabel} box={margin}>
      <BoxContainer title="padding" box={padding}>
        <View>
          <Text style={styles.innerText}>
            ({(frame?.left || 0).toFixed(1)}, {(frame?.top || 0).toFixed(1)})
          </Text>
          <Text style={styles.innerText}>
            {(frame?.width || 0).toFixed(1)} &times;{' '}
            {(frame?.height || 0).toFixed(1)}
          </Text>
        </View>
      </BoxContainer>
    </BoxContainer>
  );
}

type BoxContainerProps = $ReadOnly<{
  title: string,
  titleStyle?: TextStyleProp,
  box: $ReadOnly<{
    top: number,
    left: number,
    right: number,
    bottom: number,
  }>,
  children: React.Node,
}>;

function BoxContainer({
  title,
  titleStyle,
  box,
  children,
}: BoxContainerProps): React.Node {
  return (
    <View style={styles.box}>
      <View style={styles.row}>
        {}
        <Text style={[titleStyle, styles.label]}>{title}</Text>
        <Text style={styles.boxText}>{box.top}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.boxText}>{box.left}</Text>
        {children}
        <Text style={styles.boxText}>{box.right}</Text>
      </View>
      <Text style={styles.boxText}>{box.bottom}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  marginLabel: {
    width: 60,
  },
  label: {
    fontSize: 10,
    color: 'rgb(255,100,0)',
    marginLeft: 5,
    flex: 1,
    textAlign: 'left',
    top: -3,
  },
  innerText: {
    color: 'yellow',
    fontSize: 12,
    textAlign: 'center',
    width: 70,
  },
  box: {
    borderWidth: 1,
    borderColor: 'grey',
  },
  boxText: {
    color: 'white',
    fontSize: 12,
    marginHorizontal: 3,
    marginVertical: 2,
    textAlign: 'center',
  },
});

module.exports = BoxInspector;
