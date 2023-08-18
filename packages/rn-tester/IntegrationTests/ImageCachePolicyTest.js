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

const React = require('react');
const ReactNative = require('react-native');
const {Image, View, Text, StyleSheet} = ReactNative;
const {TestModule} = ReactNative.NativeModules;

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

type Props = {...};
type State = {
  'only-if-cached'?: boolean,
  default?: boolean,
  reload?: boolean,
  'force-cache'?: boolean,
  ...
};

class ImageCachePolicyTest extends React.Component<Props, $FlowFixMeState> {
  state: $FlowFixMe | {...} = {};

  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    const results: Array<?boolean> = TESTS.map(x => nextState[x]);

    if (!results.includes(undefined)) {
      const result: boolean = results.reduce(
        (x, y) => (x === y) === true,
        true,
      );
      TestModule.markTestPassed(result);
    }

    return false;
  }

  testComplete(name: string, pass: boolean) {
    this.setState({[name]: pass});
  }

  render(): React.Node {
    return (
      <View style={styles.container}>
        <Text>Hello</Text>
        <Image
          source={{
            uri:
              'https://raw.githubusercontent.com/facebook/react-native/HEAD/Libraries/NewAppScreen/components/logo.png?cacheBust=notinCache' +
              Date.now(),
            cache: 'only-if-cached',
          }}
          onLoad={() => this.testComplete('only-if-cached', false)}
          onError={() => this.testComplete('only-if-cached', true)}
          style={styles.base}
        />
        <Image
          source={{
            uri:
              'https://raw.githubusercontent.com/facebook/react-native/HEAD/Libraries/NewAppScreen/components/logo.png?cacheBust=notinCache' +
              Date.now(),
            cache: 'default',
          }}
          onLoad={() => this.testComplete('default', true)}
          onError={() => this.testComplete('default', false)}
          style={styles.base}
        />
        <Image
          source={{
            uri:
              'https://raw.githubusercontent.com/facebook/react-native/HEAD/Libraries/NewAppScreen/components/logo.png?cacheBust=notinCache' +
              Date.now(),
            cache: 'reload',
          }}
          onLoad={() => this.testComplete('reload', true)}
          onError={() => this.testComplete('reload', false)}
          style={styles.base}
        />
        <Image
          source={{
            uri:
              'https://raw.githubusercontent.com/facebook/react-native/HEAD/Libraries/NewAppScreen/components/logo.png?cacheBust=notinCache' +
              Date.now(),
            cache: 'force-cache',
          }}
          onLoad={() => this.testComplete('force-cache', true)}
          onError={() => this.testComplete('force-cache', false)}
          style={styles.base}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  base: {
    width: 100,
    height: 100,
  },
});

ImageCachePolicyTest.displayName = 'ImageCachePolicyTest';

module.exports = ImageCachePolicyTest;
