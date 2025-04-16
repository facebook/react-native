/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import {
  FooterComponent,
  HeaderComponent,
  ItemComponent,
  SeparatorComponent,
} from '../../components/ListExampleShared';
import RNTesterPage from '../../components/RNTesterPage';
import React from 'react';
import {
  SectionList,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';

const DATA = [
  {
    title: 'Section 1',
    data: [
      {title: 'Item 1', text: 'Section 1'},
      {title: 'Item 2', text: 'Section 1'},
      {title: 'Item 3', text: 'Section 1'},
    ],
  },
  {
    title: 'Section 2',
    data: [
      {title: 'Item 4', text: 'Section 2'},
      {title: 'Item 5', text: 'Section 2'},
      {title: 'Item 6', text: 'Section 2'},
    ],
  },
];

const renderSectionHeader = ({section}) => (
  <View style={styles.header}>
    <Text style={styles.headerText}>SECTION HEADER: {section.title}</Text>
    <SeparatorComponent />
  </View>
);

const renderItem = ({item}) => (
  <View style={styles.item}>
    <Text style={styles.title}>{item.title}</Text>
    <Text>{item.text}</Text>
  </View>
);

function SectionListCollectionRolesExample() {
  return (
    <RNTesterPage
      title="SectionList with Collection Roles"
      noSpacer={true}
      noScroll={true}>
      <View style={styles.container}>
        <Text style={styles.title}>List Role Example</Text>
        <SectionList
          sections={DATA}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={HeaderComponent}
          ListFooterComponent={FooterComponent}
          ItemSeparatorComponent={SeparatorComponent}
          accessibilityRole="list"
          style={styles.list}
        />

        <Text style={styles.title}>Grid Role Example</Text>
        <SectionList
          sections={DATA}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={HeaderComponent}
          ListFooterComponent={FooterComponent}
          ItemSeparatorComponent={SeparatorComponent}
          accessibilityRole="grid"
          accessibilityCollection={{
            rowCount: 3,
            columnCount: 2,
            hierarchical: false,
          }}
          style={styles.list}
        />
      </View>
    </RNTesterPage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 10,
  },
  list: {
    flex: 1,
  },
  header: {
    backgroundColor: '#e9eaed',
  },
  headerText: {
    padding: 4,
    fontWeight: '600',
  },
  item: {
    padding: 20,
    marginVertical: 8,
    backgroundColor: 'pink',
  },
});

export default SectionListCollectionRolesExample; 