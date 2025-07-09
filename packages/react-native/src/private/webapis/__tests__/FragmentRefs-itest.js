/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';
import setUpIntersectionObserver from 'react-native/src/private/setup/setUpIntersectionObserver';

setUpIntersectionObserver();

describe('Fragment Refs', () => {
  describe('observers', () => {
    it('attaches intersection observers to children', () => {
      let logs: Array<string> = [];
      const root = Fantom.createRoot({
        viewportHeight: 1000,
        viewportWidth: 1000,
      });
      // $FlowFixMe[cannot-resolve-name] oss doesn't have this
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            logs.push(`show:${entry.target.id}`);
          } else {
            logs.push(`hide:${entry.target.id}`);
          }
        });
      });
      function Test({showB}: {showB: boolean}) {
        // $FlowFixMe[cannot-resolve-name] oss doesn't have this
        const fragmentRef = React.useRef<null | ReactFragmentInstance>(null);
        React.useEffect(() => {
          fragmentRef.current?.observeUsing(observer);
          const lastRefValue = fragmentRef.current;
          return () => {
            lastRefValue?.unobserveUsing(observer);
          };
        }, []);
        return (
          <View nativeID="parent">
            {/* $FlowFixMe oss doesn't have this */}
            <React.Fragment ref={fragmentRef}>
              <View style={{width: 100, height: 100}} nativeID="childA" />
              {showB && (
                <View style={{width: 100, height: 100}} nativeID="childB" />
              )}
            </React.Fragment>
          </View>
        );
      }

      Fantom.runTask(() => {
        root.render(<Test showB={false} />);
      });
      expect(logs).toEqual(['show:childA']);

      // Reveal child and expect it to be observed and intersecting
      logs = [];
      Fantom.runTask(() => {
        root.render(<Test showB={true} />);
      });
      expect(logs).toEqual(['show:childB']);

      // Hide child and expect it to still be observed, no longer intersecting
      logs = [];
      Fantom.runTask(() => {
        root.render(<Test showB={false} />);
      });
      expect(logs).toEqual(['hide:childB']);
    });
  });
});
