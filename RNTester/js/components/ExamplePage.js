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

import * as React from 'react';
import {StyleSheet, View, Text, Dimensions, Image} from 'react-native';

import HeadingText from './HeadingText';
import Background from './Background';

type Props = $ReadOnly<{|
  children?: React.Node,
  title: string,
  description?: ?string,
  ios?: ?boolean,
  android?: ?boolean,
|}>;

const ScreenHeight = Dimensions.get('window').height;
const ScreenWidth = Dimensions.get('window').width;

export default function ExamplePage(props: Props): React.Node {
  const title = props.title ? <HeadingText text={props.title} /> : null;

  const description = props.description ?? '';
  const androidImage = !props.android ? (
    <Image
      style={{height: 35, width: 30, margin: 2}}
      source={imagePaths.android}
    />
  ) : null;

  const appleImage = !props.ios ? (
    <Image style={{height: 35, width: 30, margin: 2}} source={imagePaths.ios} />
  ) : null;

  const docsImage = (
    <View style={styles.docsContainer}>
      <Image source={imagePaths.docs} />
      <Text>Docs</Text>
    </View>
  );

  return (
    <React.Fragment>
      <View style={styles.titleView}>
        <View style={styles.container}>
          <View style={styles.headingContainer}>
            <Text style={styles.titleContainer}>{title} </Text>
            <Text>{description}</Text>
            <View style={styles.iconContainer}>
              {appleImage}
              {androidImage}
            </View>
          </View>
          {docsImage}
        </View>
      </View>

      <Background height={ScreenHeight} width={ScreenWidth}>
        <View style={styles.examplesContainer}>{props.children}</View>
      </Background>
    </React.Fragment>
  );
}

const imagePaths = {
  android: require('../assets/android-icon.png'),
  ios: require('../assets/apple-icon.png'),
  docs: require('../assets/docs-icon.png'),
};

const styles = StyleSheet.create({
  titleView: {
    backgroundColor: '#F3F8FF',
    height: 75,
    padding: 20,
    paddingTop: 8,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleContainer: {
    justifyContent: 'space-between',
    fontWeight: 'bold',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  examplesContainer: {
    width: ScreenWidth,
    flexGrow: 1,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  description: {
    paddingVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  docsContainer: {
    alignContent: 'center',
    justifyContent: 'center',
  },
  headingContainer: {
    width: '80%',
  },
});
