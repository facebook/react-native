/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const RNTesterExampleFilter = require('./RNTesterExampleFilter');
import RNTPressableRow from './RNTPressableRow';
const React = require('react');

const {
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableHighlight,
  Image,
  View,
} = require('react-native');

import {RNTesterThemeContext} from './RNTesterTheme';

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
const ExampleModuleRow = ({
  onShowUnderlay,
  onHideUnderlay,
  item,
  toggleBookmark,
  handlePress,
}) => {
  const theme = React.useContext(RNTesterThemeContext);
  const platform = item.module.platform;
  const onIos = !platform || platform === 'ios';
  const onAndroid = !platform || platform === 'android';
  const rightAddOn = (
    <TouchableHighlight
      style={styles.imageViewStyle}
      onPress={() =>
        toggleBookmark({
          exampleType: item.exampleType,
          key: item.key,
        })
      }>
      <Image
        style={styles.imageStyle}
        source={
          item.isBookmarked
            ? require('../assets/bookmark-outline-blue.png')
            : require('../assets/bookmark-outline-gray.png')
        }
      />
    </TouchableHighlight>
  );
  return (
    <RNTPressableRow
      title={item.module.title}
      description={item.module.description}
      testID={item.module.title}
      onPressIn={onShowUnderlay}
      onPressOut={onHideUnderlay}
      accessibilityLabel={item.module.title + ' ' + item.module.description}
      rightAddOn={rightAddOn}
      bottomAddOn={
        <View style={styles.bottomRowStyle}>
          <Text style={{color: theme.SecondaryLabelColor, width: 65}}>
            {item.module.category || 'Other'}
          </Text>
          <View style={styles.platformLabelStyle}>
            <Text
              style={{
                color: onIos ? '#787878' : theme.SeparatorColor,
                fontWeight: onIos ? '500' : '300',
              }}>
              iOS
            </Text>
            <Text
              style={{
                color: onAndroid ? '#787878' : theme.SeparatorColor,
                fontWeight: onAndroid ? '500' : '300',
              }}>
              Android
            </Text>
          </View>
        </View>
      }
      onPress={() =>
        handlePress({
          exampleType: item.exampleType,
          key: item.key,
          title: item.module.title,
        })
      }
    />
  );
};

const renderSectionHeader = ({section}: {section: any, ...}) => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return (
        <Text
          style={[
            styles.sectionHeader,
            {
              color: theme.SecondaryLabelColor,
              backgroundColor: theme.GroupedBackgroundColor,
            },
          ]}>
          {section.title}
        </Text>
      );
    }}
  </RNTesterThemeContext.Consumer>
);

const RNTesterModuleList: React$AbstractComponent<any, void> = React.memo(
  ({sections, toggleBookmark, handleModuleCardPress}) => {
    const filter = ({example, filterRegex, category}: any) =>
      filterRegex.test(example.module.title) &&
      (!category || example.category === category);

    /* $FlowFixMe[missing-local-annot] The type annotation(s) required by
     * Flow's LTI update could not be added via codemod */
    const renderListItem = ({item, section, separators}) => {
      return (
        <ExampleModuleRow
          item={item}
          section={section}
          onShowUnderlay={separators.highlight}
          onHideUnderlay={separators.unhighlight}
          toggleBookmark={toggleBookmark}
          handlePress={handleModuleCardPress}
        />
      );
    };

    return (
      <View style={styles.listContainer}>
        <RNTesterExampleFilter
          testID="explorer_search"
          page="components_page"
          sections={sections}
          filter={filter}
          hideFilterPills={true}
          render={({filteredSections}) => (
            <SectionList
              sections={filteredSections}
              extraData={filteredSections}
              renderItem={renderListItem}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustContentInsets={false}
              keyboardDismissMode="on-drag"
              renderSectionHeader={renderSectionHeader}
              // eslint-disable-next-line react/no-unstable-nested-components
              ListFooterComponent={() => <View style={{height: 80}} />}
            />
          )}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  sectionHeader: {
    padding: 5,
    fontWeight: '500',
    fontSize: 11,
  },
  row: {
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginVertical: Platform.select({ios: 4, android: 8}),
    marginHorizontal: 15,
    overflow: 'hidden',
    elevation: 5,
  },
  topRowStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  bottomRowStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageViewStyle: {
    height: 30,
    width: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    bottom: 5,
  },
  imageStyle: {
    height: 25,
    width: 25,
  },
  platformLabelStyle: {
    flexDirection: 'row',
    width: 100,
    justifyContent: 'space-between',
  },
});

module.exports = RNTesterModuleList;
