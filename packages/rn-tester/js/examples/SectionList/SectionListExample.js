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
const RNTesterPage = require('../../components/RNTesterPage');
const React = require('react');

const infoLog = require('react-native/Libraries/Utilities/infoLog');

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
} = require('../../components/ListExampleShared');
const {
  Alert,
  Animated,
  Button,
  StyleSheet,
  Text,
  View,
  SectionList,
} = require('react-native');

const VIEWABILITY_CONFIG = {
  minimumViewTime: 3000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

const CONSTANT_SECTION_EXAMPLES = [
  {
    key: 'empty section',
    data: [],
  },
  {
    renderItem: renderStackedItem,
    key: 's1',
    data: [
      {
        title: 'Item In Header Section',
        text: 'Section s1',
        key: 'header item',
      },
    ],
  },
  {
    key: 's2',
    data: [
      {
        noImage: true,
        title: '1st item',
        text: 'Section s2',
        key: 'noimage0',
      },
      {
        noImage: true,
        title: '2nd item',
        text: 'Section s2',
        key: 'noimage1',
      },
    ],
  },
];

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
  <View
    style={[
      styles.customSeparator,
      highlighted && {backgroundColor: 'rgb(217, 217, 217)'},
    ]}>
    <Text style={styles.separatorText}>{text}</Text>
  </View>
);

const EmptySectionList = () => (
  <View style={{alignItems: 'center'}}>
    <Text style={{fontSize: 20}}>This is rendered when the list is empty</Text>
  </View>
);

const renderItemComponent = setItemState => ({item, separators}) => {
  if (isNaN(item.key)) {
    return;
  }
  const onPress = () => {
    const updatedItem = pressItem(item);
    setItemState(updatedItem);
  };

  return (
    <ItemComponent
      item={item}
      onPress={onPress}
      onHideUnderlay={separators.unhighlight}
      onShowUnderlay={separators.highlight}
    />
  );
};

const onScrollToIndexFailed = (info: {
  index: number,
  c: number,
  averageItemLength: number,
}) => {
  console.warn('onScrollToIndexFailed. See comment in callback', info);
  /**
   * scrollToLocation() can only scroll to viewable area.
   * For any failure cases this callback will get triggered with `info` object
   *
   * The idea is to calculate a yPosition from `info` to call scrollResponder.scrollTo on.
   *
   * const scrollResponder = ref.current?.getScrollResponder();
   * const positionY = some value we calculate from `info`;
   * if (scrollResponder != null) {
   *    scrollResponder.scrollTo({x, y:positionY, animated: true});
   * }
   */
};

function SectionListExample(Props: {...}): React.Element<typeof RNTesterPage> {
  const scrollPos = new Animated.Value(0);
  const scrollSinkY = Animated.event(
    [{nativeEvent: {contentOffset: {y: scrollPos}}}],
    {useNativeDriver: true},
  );
  const [filterText, setFilterText] = React.useState('');
  const [virtualized, setVirtualized] = React.useState(true);
  const [logViewable, setLogViewable] = React.useState(false);
  const [debug, setDebug] = React.useState(false);
  const [inverted, setInverted] = React.useState(false);
  const [data, setData] = React.useState(genItemData(1000));

  const filterRegex = new RegExp(String(filterText), 'i');
  const filter = item =>
    filterRegex.test(item.text) || filterRegex.test(item.title);
  const filteredData = data.filter(filter);
  const filteredSectionData = [...CONSTANT_SECTION_EXAMPLES];

  let startIndex = 0;
  const endIndex = filteredData.length - 1;
  for (let ii = 10; ii <= endIndex + 10; ii += 10) {
    filteredSectionData.push({
      key: `${filteredData[startIndex].key} - ${
        filteredData[Math.min(ii - 1, endIndex)].key
      }`,
      data: filteredData.slice(startIndex, ii),
    });
    startIndex = ii;
  }

  const setItemPress = item => {
    if (isNaN(item.key)) {
      return;
    }
    const index = Number(item.key);
    setData([...data.slice(0, index), item, ...data.slice(index + 1)]);
  };

  const ref = React.useRef<?React.ElementRef<typeof SectionList>>(null);
  const scrollToLocation = (sectionIndex, itemIndex) => {
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    if (ref != null && ref.current?.scrollToLocation != null) {
      ref.current.scrollToLocation({sectionIndex, itemIndex});
    }
  };

  const onViewableItemsChanged = (info: {
    changed: Array<{
      key: string,
      isViewable: boolean,
      item: {columns: Array<*>, ...},
      index: ?number,
      section?: any,
      ...
    }>,
    ...
  }) => {
    // Impressions can be logged here
    if (logViewable) {
      infoLog(
        'onViewableItemsChanged: ',
        info.changed.map((v: Object) => ({
          ...v,
          item: '...',
          section: v.section.key,
        })),
      );
    }
  };

  return (
    <RNTesterPage noSpacer={true} noScroll={true}>
      <View style={styles.searchRow}>
        <PlainInput
          onChangeText={text => setFilterText(text)}
          placeholder="Search..."
          value={filterText}
        />
        <View style={styles.optionSection}>
          {renderSmallSwitchOption('Virtualized', virtualized, setVirtualized)}
          {renderSmallSwitchOption('Log Viewable', logViewable, setLogViewable)}
          {renderSmallSwitchOption('Debug', debug, setDebug)}
          {renderSmallSwitchOption('Inverted', inverted, setInverted)}
          <Spindicator value={scrollPos} />
        </View>
        <View style={styles.scrollToColumn}>
          <Text>scroll to:</Text>
          <View style={styles.button}>
            <Button
              title="Top"
              onPress={() => scrollToLocation(Math.max(0, 2), 0)}
            />
          </View>
          <View style={styles.button}>
            <Button
              title="3rd Section"
              onPress={() => scrollToLocation(Math.max(0, 3), 0)}
            />
          </View>
          <View style={styles.button}>
            <Button
              title="6th Section"
              onPress={() => scrollToLocation(Math.max(0, 6), 0)}
            />
          </View>
          <View style={styles.button}>
            <Button
              title="Out of Viewable Area (See warning) "
              onPress={() =>
                scrollToLocation(filteredSectionData.length - 1, 0)
              }
            />
          </View>
        </View>
      </View>
      <SeparatorComponent />
      <Animated.SectionList
        ref={ref}
        ListHeaderComponent={HeaderComponent}
        ListFooterComponent={FooterComponent}
        SectionSeparatorComponent={info => (
          <CustomSeparatorComponent {...info} text="SECTION SEPARATOR" />
        )}
        ItemSeparatorComponent={info => (
          <CustomSeparatorComponent {...info} text="ITEM SEPARATOR" />
        )}
        debug={debug}
        inverted={inverted}
        disableVirtualization={!virtualized}
        onRefresh={() => Alert.alert('onRefresh: nothing to refresh :P')}
        onScroll={scrollSinkY}
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollToIndexFailed={onScrollToIndexFailed}
        refreshing={false}
        renderItem={renderItemComponent(setItemPress)}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        stickySectionHeadersEnabled
        initialNumToRender={10}
        ListEmptyComponent={EmptySectionList}
        onEndReached={() =>
          Alert.alert(
            'onEndReached called',
            'You have reached the end of this list',
          )
        }
        onEndReachedThreshold={0}
        sections={filteredSectionData}
        style={styles.list}
        viewabilityConfig={VIEWABILITY_CONFIG}
      />
    </RNTesterPage>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 5,
  },
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
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchRow: {
    paddingHorizontal: 10,
  },
  scrollToColumn: {
    flexDirection: 'column',
    paddingHorizontal: 8,
  },
  separatorText: {
    color: 'gray',
    alignSelf: 'center',
    fontSize: 7,
  },
});

exports.title = 'SectionList';
exports.category = 'ListView';
exports.documentationURL = 'https://reactnative.dev/docs/sectionlist';
exports.description = 'Performant, scrollable list of data.';
exports.examples = [
  {
    title: 'Simple scrollable list',
    render: function(): React.Element<typeof SectionListExample> {
      return <SectionListExample />;
    },
  },
];
