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
import type {FlatListProps} from 'react-native/Libraries/Lists/FlatList';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {FlatList, Text} from 'react-native';

function testPropPropagatedToMountingLayer<TValue>({
  propName,
  value,
  defaultValue,
  renderChildrenForValue,
}: $ReadOnly<{
  propName: string,
  value: TValue,
  defaultValue: TValue,
  renderChildrenForValue?: () => React.Node,
}>) {
  describe(propName, () => {
    it('is propagated to the mounting layer', () => {
      const root = Fantom.createRoot();
      const props: FlatListProps<$ReadOnly<{}>> = {
        // $FlowFixMe[incompatible-type]
        [propName]: value,
      };
      Fantom.runTask(() => {
        root.render(<FlatList data={null} {...props} />);
      });

      expect(root.getRenderedOutput({props: [propName]}).toJSX()).toEqual(
        <rn-scrollView
          {...{
            [propName]: JSON.stringify(value),
          }}>
          {renderChildrenForValue != null ? (
            renderChildrenForValue()
          ) : (
            <rn-view />
          )}
        </rn-scrollView>,
      );
    });

    it(`default value is ${JSON.stringify(defaultValue) ?? 'null'}`, () => {
      const root = Fantom.createRoot();
      const props: FlatListProps<$ReadOnly<{}>> = {
        // $FlowFixMe[incompatible-type]
        [propName]: defaultValue,
      };
      Fantom.runTask(() => {
        root.render(<FlatList data={null} {...props} />);
      });

      expect(root.getRenderedOutput({props: [propName]}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view />
        </rn-scrollView>,
      );
    });
  });
}

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
    testPropPropagatedToMountingLayer<boolean>({
      propName: 'disableIntervalMomentum',
      value: true,
      defaultValue: false,
    });

    testPropPropagatedToMountingLayer<boolean>({
      propName: 'horizontal',
      value: true,
      defaultValue: false,
      renderChildrenForValue: () => <rn-androidHorizontalScrollContentView />,
    });

    testPropPropagatedToMountingLayer<boolean>({
      propName: 'scrollEnabled',
      value: false,
      defaultValue: true,
    });

    testPropPropagatedToMountingLayer<boolean>({
      propName: 'pagingEnabled',
      value: true,
      defaultValue: false,
    });

    testPropPropagatedToMountingLayer<boolean>({
      propName: 'showsVerticalScrollIndicator',
      value: false,
      defaultValue: true,
    });

    testPropPropagatedToMountingLayer<boolean>({
      propName: 'snapToStart',
      value: false,
      defaultValue: true,
    });

    testPropPropagatedToMountingLayer<boolean>({
      propName: 'snapToEnd',
      value: false,
      defaultValue: true,
    });
  });
});
