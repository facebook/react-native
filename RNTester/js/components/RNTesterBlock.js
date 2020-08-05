/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

type Props = $ReadOnly<{|
  children?: React.Node,
  title?: ?string,
  description?: ?string,
|}>;

import React from 'react';
import {RNTesterThemeContext} from './RNTesterTheme';
import {StyleSheet, Text, View} from 'react-native';

/** functional component for generating example blocks */
const RNTesterBlock = ({description, title, children}: Props) => {
  let descComponent = null;
  /** generating description component if description passed */
  descComponent = (
    <RNTesterThemeContext.Consumer>
      {theme => {
        return <Text style={[styles.descriptionText]}>{description}</Text>;
      }}
    </RNTesterThemeContext.Consumer>
  );

  return (
    <RNTesterThemeContext.Consumer>
      {theme => (
        <View style={[styles.container]}>
          <View style={[styles.titleContainer]}>
            <Text style={[styles.titleText]}>{title}</Text>
            {descComponent}
          </View>
          <View style={styles.children}>{children}</View>
        </View>
      )}
    </RNTesterThemeContext.Consumer>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 0,
    borderWidth: 1,
    margin: 15,
    marginVertical: 5,
    borderColor: '#005DFF',
    backgroundColor: 'white',
  },
  titleText: {
    fontSize: 18,
    fontFamily: 'Times New Roman',
    fontWeight: '300',
  },
  titleContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  descriptionText: {
    fontSize: 12,
    opacity: 0.5,
    color: 'black',
  },
  children: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#F3F8FF',
    margin: 10,
  },
});

module.exports = RNTesterBlock;
