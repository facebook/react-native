/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {FlatList, Text} from 'react-native';

describe('<FlatList>', () => {
  describe('props', () => {
    describe('data & renderItem', () => {
      const root = Fantom.createRoot();
      it('List is rendered as expected', () => {
        Fantom.runTask(() => {
          root.render(
            <FlatList
              data={[
                {title: 'Title Text', key: 'item1'},
                {title: 'Title Text 2', key: 'item2'},
              ]}
              renderItem={({item, separators}) => <Text>{item.title}</Text>}
            />,
          );
        });

        expect(
          JSON.stringify(root.getRenderedOutput({props: []}).toJSX()),
        ).toEqual(
          JSON.stringify(
            <rn-scrollView>
              <rn-view>
                <rn-paragraph key="0">Title Text</rn-paragraph>
                <rn-paragraph key="1">Title Text 2</rn-paragraph>
              </rn-view>
            </rn-scrollView>,
          ),
        );
      });
    });

    describe('inverted', () => {
      it('changes prop isInvertedVirtualizedList which gets propagated to mounting layer', () => {
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(<FlatList data={null} inverted={true} />);
        });

        expect(
          root
            .getRenderedOutput({
              props: ['inverted', 'isInvertedVirtualizedList'],
            })
            .toJSX(),
        ).toEqual(
          <rn-scrollView isInvertedVirtualizedList="true">
            <rn-view />
          </rn-scrollView>,
        );
      });

      it('default value is false', () => {
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(<FlatList data={null} inverted={false} />);
        });

        expect(
          root
            .getRenderedOutput({
              props: ['inverted', 'isInvertedVirtualizedList'],
            })
            .toJSX(),
        ).toEqual(
          <rn-scrollView>
            <rn-view />
          </rn-scrollView>,
        );
      });
    });
  });

  describe('props inherited from ScrollView', () => {
    describe('horizontal', () => {
      const root = Fantom.createRoot();
      it('is propagated to the mounting layer', () => {
        Fantom.runTask(() => {
          root.render(<FlatList data={null} horizontal={true} />);
        });

        expect(root.getRenderedOutput({props: ['horizontal']}).toJSX()).toEqual(
          <rn-scrollView horizontal="true">
            <rn-androidHorizontalScrollContentView />
          </rn-scrollView>,
        );
      });

      it('default value is false', () => {
        Fantom.runTask(() => {
          root.render(<FlatList data={null} horizontal={false} />);
        });

        expect(root.getRenderedOutput({props: ['horizontal']}).toJSX()).toEqual(
          <rn-scrollView>
            <rn-view />
          </rn-scrollView>,
        );
      });
    });

    describe('scrollEnabled', () => {
      const root = Fantom.createRoot();
      it('default value is true', () => {
        Fantom.runTask(() => {
          root.render(<FlatList data={null} scrollEnabled={true} />);
        });

        expect(
          root.getRenderedOutput({props: ['scrollEnabled']}).toJSX(),
        ).toEqual(
          <rn-scrollView>
            <rn-view />
          </rn-scrollView>,
        );
      });
      it('is propagated to the mounting layer', () => {
        Fantom.runTask(() => {
          root.render(<FlatList data={null} scrollEnabled={false} />);
        });

        expect(
          root.getRenderedOutput({props: ['scrollEnabled']}).toJSX(),
        ).toEqual(
          <rn-scrollView scrollEnabled="false">
            <rn-view />
          </rn-scrollView>,
        );
      });
    });
  });
});
