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
import {SectionList, Text} from 'react-native';

describe('<SectionList>', () => {
  describe('renders empty list', () => {
    it('renders a scroll view with an empty content container', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[]}
            renderItem={({item}) => <Text>{item.key}</Text>}
          />,
        );
      });

      expect(
        JSON.stringify(root.getRenderedOutput({props: []}).toJSX()),
      ).toEqual(
        JSON.stringify(
          <rn-scrollView>
            <rn-view />
          </rn-scrollView>,
        ),
      );
    });
  });

  describe('renders section with items', () => {
    it('renders section items inside the scroll view when renderSectionHeader returns null', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[{key: 's1', data: [{key: 'i1'}, {key: 'i2'}]}]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={() => null}
          />,
        );
      });

      expect(
        JSON.stringify(root.getRenderedOutput({props: []}).toJSX()),
      ).toEqual(
        JSON.stringify(
          <rn-scrollView>
            <rn-view>
              <rn-paragraph key="0">i1</rn-paragraph>
              <rn-paragraph key="1">i2</rn-paragraph>
            </rn-view>
          </rn-scrollView>,
        ),
      );
    });
  });

  describe('renders section header', () => {
    it('renders section header above items', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[{key: 's1', data: [{key: 'i1'}, {key: 'i2'}]}]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={({section}) => (
              <Text>Header: {section.key}</Text>
            )}
          />,
        );
      });

      const output = JSON.stringify(
        root.getRenderedOutput({props: []}).toJSX(),
      );
      expect(output).toContain('Header: s1');
      expect(output).toContain('i1');
      expect(output).toContain('i2');
    });
  });

  describe('renders section footer', () => {
    it('renders section footer when there is no data', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[{key: 's1', data: []}]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={({section}) => (
              <Text>Header: {section.key}</Text>
            )}
            renderSectionFooter={({section}) => (
              <Text>Footer: {section.key}</Text>
            )}
          />,
        );
      });

      const output = JSON.stringify(
        root.getRenderedOutput({props: []}).toJSX(),
      );
      expect(output).toContain('Header: s1');
      expect(output).toContain('Footer: s1');
    });

    it('renders section footer when there is no data and no header', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[{key: 's1', data: []}]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionFooter={({section}) => (
              <Text>Footer: {section.key}</Text>
            )}
          />,
        );
      });

      const output = JSON.stringify(
        root.getRenderedOutput({props: []}).toJSX(),
      );
      expect(output).toContain('Footer: s1');
    });
  });

  describe('renders multiple sections', () => {
    it('renders items from all sections', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[
              {key: 's1', data: [{key: 'i1'}, {key: 'i2'}]},
              {key: 's2', data: [{key: 'i3'}, {key: 'i4'}]},
            ]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={() => null}
          />,
        );
      });

      const output = JSON.stringify(
        root.getRenderedOutput({props: []}).toJSX(),
      );
      expect(output).toContain('i1');
      expect(output).toContain('i2');
      expect(output).toContain('i3');
      expect(output).toContain('i4');
    });
  });

  describe('renders list header and footer', () => {
    it('renders list header and footer with section items', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            initialNumToRender={Infinity}
            ListHeaderComponent={() => <Text>List Header</Text>}
            ListFooterComponent={() => <Text>List Footer</Text>}
            sections={[{key: 's1', data: [{key: 'i1'}]}]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={() => null}
          />,
        );
      });

      const output = JSON.stringify(
        root.getRenderedOutput({props: []}).toJSX(),
      );
      expect(output).toContain('List Header');
      expect(output).toContain('List Footer');
      expect(output).toContain('i1');
    });
  });
});
