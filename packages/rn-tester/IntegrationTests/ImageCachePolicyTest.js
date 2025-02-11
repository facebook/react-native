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

import type {ImageURISource} from 'react-native/Libraries/Image/ImageSource';

import * as React from 'react';
import {useEffect, useState} from 'react';
import {Image, NativeModules, StyleSheet, Text, View} from 'react-native';

const {TestModule} = NativeModules;

/*
 * The reload and force-cache tests don't actually verify that the complete functionality.
 *
 * reload: Should have the server set a long cache header, then swap the image on next load
 * with the test comparing the old image to the new image and making sure they are different.
 *
 * force-cache: Should do the above but set a no-cache header. The test should compare the first
 * image with the new one and make sure they are the same.
 */

const TESTS = ['only-if-cached', 'default', 'reload', 'force-cache'];

function ImageCachePolicyTest(): React.Node {
  const [state, setState] = useState({
    'only-if-cached': undefined,
    default: undefined,
    reload: undefined,
    'force-cache': undefined,
  });

  const testComplete = (
    name: $NonMaybeType<ImageURISource['cache']>,
    pass: boolean,
  ) => {
    setState(prevState => ({
      ...prevState,
      [name]: pass,
    }));
  };

  useEffect(() => {
    const results = TESTS.map(key => state[key]);

    if (!results.includes(undefined)) {
      const result = results.reduce((x, y) => (x === y) === true, true);
      TestModule.markTestPassed(result);
    }
  }, [state]);

  return (
    <View style={styles.container}>
      <Text>Hello</Text>
      <Image
        source={getImageSource('only-if-cached')}
        onLoad={() => testComplete('only-if-cached', false)}
        onError={() => testComplete('only-if-cached', true)}
        style={styles.base}
      />
      <Image
        source={getImageSource('default')}
        onLoad={() => testComplete('default', true)}
        onError={() => testComplete('default', false)}
        style={styles.base}
      />
      <Image
        source={getImageSource('reload')}
        onLoad={() => testComplete('reload', true)}
        onError={() => testComplete('reload', false)}
        style={styles.base}
      />
      <Image
        source={getImageSource('force-cache')}
        onLoad={() => testComplete('force-cache', true)}
        onError={() => testComplete('force-cache', false)}
        style={styles.base}
      />
    </View>
  );
}

const getImageSource = (cache: ImageURISource['cache']) => ({
  uri:
    'https://raw.githubusercontent.com/facebook/react-native/HEAD/Libraries/NewAppScreen/components/logo.png?cacheBust=notinCache' +
    Date.now(),
  cache,
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  base: {
    width: 100,
    height: 100,
  },
});

export default ImageCachePolicyTest;
