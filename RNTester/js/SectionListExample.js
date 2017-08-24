/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule SectionListExample
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  Alert,
  Animated,
  Button,
  SectionList,
  StyleSheet,
  Text,
  View,
} = ReactNative;

const RNTesterPage = require('./RNTesterPage');

const infoLog = require('infoLog');

const {
  HeaderComponent,
  FooterComponent,
  ItemComponent,
  PlainInput,
  SeparatorComponent,
  Spindicator,
  genItemData,
  pressItem,
  renderSmallSwitchOption,
  renderStackedItem,
} = require('./ListExampleShared');

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

const VIEWABILITY_CONFIG = {
  minimumViewTime: 3000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

const renderSectionHeader = ({section}) => (
  <View style={styles.header}>
    <Text style={styles.headerText}>SECTION HEADER: {section.key}</Text>
    <SeparatorComponent />
  </View>
);

const renderSectionFooter = ({section}) => (
  <View style={styles.header}>
    <Text style={styles.headerText}>SECTION FOOTER: {section.key}</Text>
    <SeparatorComponent />
  </View>
);

const CustomSeparatorComponent = ({highlighted, text}) => (
  <View style={[styles.customSeparator, highlighted && {backgroundColor: 'rgb(217, 217, 217)'}]}>
    <Text style={styles.separatorText}>{text}</Text>
  </View>
);

class SectionListExample extends React.PureComponent<{}, $FlowFixMeState> {
  static title = '<SectionList>';
  static description = 'Performant, scrollable list of data.';

  state = {
    data: genItemData(1000),
    debug: false,
    filterText: '',
    logViewable: false,
    virtualized: true,
  };

  _scrollPos = new Animated.Value(0);
  _scrollSinkY = Animated.event(
    [{nativeEvent: { contentOffset: { y: this._scrollPos } }}],
    {useNativeDriver: true},
  );

  _sectionListRef: any;
  _captureRef = (ref) => { this._sectionListRef = ref; };

  _scrollToLocation(sectionIndex: number, itemIndex: number) {
    this._sectionListRef
      .getNode()
      .scrollToLocation({ sectionIndex, itemIndex });
  }

  render() {
    const filterRegex = new RegExp(String(this.state.filterText), 'i');
    const filter = (item) => (
      filterRegex.test(item.text) || filterRegex.test(item.title)
    );
    const filteredData = this.state.data.filter(filter);
    const filteredSectionData = [];
    let startIndex = 0;
    const endIndex = filteredData.length - 1;
    for (let ii = 10; ii <= endIndex + 10; ii += 10) {
      filteredSectionData.push({
        key: `${filteredData[startIndex].key} - ${filteredData[Math.min(ii - 1, endIndex)].key}`,
        data: filteredData.slice(startIndex, ii),
      });
      startIndex = ii;
    }
    return (
      <RNTesterPage
        noSpacer={true}
        noScroll={true}>
        <View style={styles.searchRow}>
          <PlainInput
            onChangeText={filterText => {
              this.setState(() => ({filterText}));
            }}
            placeholder="Search..."
            value={this.state.filterText}
          />
          <View style={styles.optionSection}>
            {renderSmallSwitchOption(this, 'virtualized')}
            {renderSmallSwitchOption(this, 'logViewable')}
            {renderSmallSwitchOption(this, 'debug')}
            <Spindicator value={this._scrollPos} />
          </View>
          <View style={styles.scrollToRow}>
            <Text>scroll to:</Text>
            <Button title="Item A" onPress={() => this._scrollToLocation(2, 1)}/>
            <Button title="Item B" onPress={() => this._scrollToLocation(3, 6)}/>
            <Button title="Item C" onPress={() => this._scrollToLocation(6, 3)}/>
          </View>
        </View>
        <SeparatorComponent />
        <AnimatedSectionList
          ref={this._captureRef}
          ListHeaderComponent={HeaderComponent}
          ListFooterComponent={FooterComponent}
          SectionSeparatorComponent={(info) =>
            <CustomSeparatorComponent {...info} text="SECTION SEPARATOR" />
          }
          ItemSeparatorComponent={(info) =>
            <CustomSeparatorComponent {...info} text="ITEM SEPARATOR" />
          }
          debug={this.state.debug}
          enableVirtualization={this.state.virtualized}
          onRefresh={() => Alert.alert('onRefresh: nothing to refresh :P')}
          onScroll={this._scrollSinkY}
          onViewableItemsChanged={this._onViewableItemsChanged}
          refreshing={false}
          renderItem={this._renderItemComponent}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          stickySectionHeadersEnabled
          sections={[
            {
              key: 'empty section',
              data: [],
            },
            {
              renderItem: renderStackedItem,
              key: 's1',
              data: [
                {title: 'Item In Header Section', text: 'Section s1', key: 'header item'},
              ],
            },
            {
              key: 's2',
              data: [
                {noImage: true, title: '1st item', text: 'Section s2', key: 'noimage0'},
                {noImage: true, title: '2nd item', text: 'Section s2', key: 'noimage1'},
              ],
            },
            ...filteredSectionData,
          ]}
          style={styles.list}
          viewabilityConfig={VIEWABILITY_CONFIG}
        />
      </RNTesterPage>
    );
  }

  _renderItemComponent = ({item, separators}) => (
    <ItemComponent
      item={item}
      onPress={this._pressItem}
      onHideUnderlay={separators.unhighlight}
      onShowUnderlay={separators.highlight}
    />
  );

  // This is called when items change viewability by scrolling into our out of
  // the viewable area.
  _onViewableItemsChanged = (info: {
    changed: Array<{
      key: string,
      isViewable: boolean,
      item: {columns: Array<*>},
      index: ?number,
      section?: any
    }>},
  ) => {
    // Impressions can be logged here
    if (this.state.logViewable) {
      infoLog('onViewableItemsChanged: ', info.changed.map((v: Object) => (
        {...v, item: '...', section: v.section.key}
      )));
    }
  };

  _pressItem = (key: string) => {
    !isNaN(key) && pressItem(this, key);
  };
}

const styles = StyleSheet.create({
  customSeparator: {
    backgroundColor: 'rgb(200, 199, 204)',
  },
  header: {
    backgroundColor: '#e9eaed',
  },
  headerText: {
    padding: 4,
    fontWeight: '600',
  },
  list: {
    backgroundColor: 'white',
  },
  optionSection: {
    flexDirection: 'row',
  },
  searchRow: {
    paddingHorizontal: 10,
  },
  scrollToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  separatorText: {
    color: 'gray',
    alignSelf: 'center',
    fontSize: 7,
  },
});

module.exports = SectionListExample;
