/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import ScrollViewPressableStickyHeaderExample from './ScrollViewPressableStickyHeaderExample';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {useCallback, useState} from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

class EnableDisableList extends React.Component<{}, {scrollEnabled: boolean}> {
  state: {scrollEnabled: boolean} = {
    scrollEnabled: true,
  };
  render(): React.Node {
    return (
      <View>
        <ScrollView
          automaticallyAdjustContentInsets={false}
          style={styles.scrollView}
          scrollEnabled={this.state.scrollEnabled}>
          {ITEMS.map(createItemRow)}
        </ScrollView>
        <Text>
          {'Scrolling enabled = ' + this.state.scrollEnabled.toString()}
        </Text>
        <Button
          label="Disable Scrolling"
          onPress={() => {
            this.setState({scrollEnabled: false});
          }}
        />
        <Button
          label="Enable Scrolling"
          onPress={() => {
            this.setState({scrollEnabled: true});
          }}
        />
      </View>
    );
  }
}

let AppendingListItemCount = 6;
class AppendingList extends React.Component<
  {},
  {items: Array<React$Element<Class<Item>>>},
> {
  state: {items: Array<React.Element<Class<Item>>>} = {
    items: [...Array(AppendingListItemCount)].map((_, ii) => (
      <Item msg={`Item ${ii}`} />
    )),
  };
  render(): React.Node {
    return (
      <View>
        <ScrollView
          automaticallyAdjustContentInsets={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 1,
            autoscrollToTopThreshold: 10,
          }}
          style={styles.scrollView}>
          {this.state.items.map(item =>
            React.cloneElement(item, {key: item.props.msg}),
          )}
        </ScrollView>
        <ScrollView
          horizontal={true}
          automaticallyAdjustContentInsets={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 1,
            autoscrollToTopThreshold: 10,
          }}
          style={[styles.scrollView, styles.horizontalScrollView]}>
          {this.state.items.map(item =>
            React.cloneElement(item, {key: item.props.msg, style: null}),
          )}
        </ScrollView>
        <View style={styles.row}>
          <Button
            label="Add to top"
            onPress={() => {
              this.setState(state => {
                const idx = AppendingListItemCount++;
                return {
                  items: [
                    <Item style={{paddingTop: idx * 5}} msg={`Item ${idx}`} />,
                  ].concat(state.items),
                };
              });
            }}
          />
          <Button
            label="Remove top"
            onPress={() => {
              this.setState(state => ({
                items: state.items.slice(1),
              }));
            }}
          />
          <Button
            label="Change height top"
            onPress={() => {
              this.setState(state => ({
                items: [
                  React.cloneElement(state.items[0], {
                    style: {paddingBottom: Math.random() * 40},
                  }),
                ].concat(state.items.slice(1)),
              }));
            }}
          />
        </View>
        <View style={styles.row}>
          <Button
            label="Add to end"
            onPress={() => {
              this.setState(state => ({
                items: state.items.concat(
                  <Item msg={`Item ${AppendingListItemCount++}`} />,
                ),
              }));
            }}
          />
          <Button
            label="Remove end"
            onPress={() => {
              this.setState(state => ({
                items: state.items.slice(0, -1),
              }));
            }}
          />
          <Button
            label="Change height end"
            onPress={() => {
              this.setState(state => ({
                items: state.items.slice(0, -1).concat(
                  React.cloneElement(state.items[state.items.length - 1], {
                    style: {paddingBottom: Math.random() * 40},
                  }),
                ),
              }));
            }}
          />
        </View>
      </View>
    );
  }
}

function CenterContentList(): React.Node {
  return (
    <ScrollView style={styles.scrollView} centerContent={true}>
      <Text>This should be in center.</Text>
    </ScrollView>
  );
}

function ContentOffsetList(): React.Node {
  return (
    <ScrollView
      style={[styles.scrollView, {height: 100}]}
      horizontal={true}
      contentOffset={{x: 100, y: 0}}>
      {ITEMS.map(createItemRow)}
    </ScrollView>
  );
}

exports.displayName = 'ScrollViewExample';
exports.title = 'ScrollView';
exports.documentationURL = 'https://reactnative.dev/docs/scrollview';
exports.category = 'Basic';
exports.description =
  'Component that enables scrolling through child components';
const examples = ([
  {
    name: 'scrollTo',
    title: '<ScrollView>\n',
    description:
      'To make content scrollable, wrap it within a <ScrollView> component',
    render: function (): React.Node {
      let _scrollView: ?React.ElementRef<typeof ScrollView>;
      return (
        <View>
          <ScrollView
            accessibilityRole="grid"
            ref={scrollView => {
              _scrollView = scrollView;
            }}
            automaticallyAdjustContentInsets={false}
            onScroll={() => {
              console.log('onScroll!');
            }}
            scrollEventThrottle={200}
            style={styles.scrollView}
            testID="scroll_vertical">
            {ITEMS.map(createItemRow)}
          </ScrollView>
          <Button
            label="Scroll to top"
            onPress={() => {
              nullthrows<$FlowFixMe>(_scrollView).scrollTo({y: 0});
            }}
            testID="scroll_to_top_button"
          />
          <Button
            label="Scroll to bottom"
            onPress={() => {
              nullthrows<$FlowFixMe>(_scrollView).scrollToEnd({animated: true});
            }}
            testID="scroll_to_bottom_button"
          />
          <Button
            label="Flash scroll indicators"
            onPress={() => {
              nullthrows<$FlowFixMe>(_scrollView).flashScrollIndicators();
            }}
            testID="flash_scroll_indicators_button"
          />
        </View>
      );
    },
  },
  {
    name: 'horizontalScrollTo',
    title: '<ScrollView> (horizontal = true)\n',
    description:
      "You can display <ScrollView>'s child components horizontally rather than vertically",
    render: function (): React.Node {
      return (
        <View>
          <HorizontalScrollView direction="ltr" />
        </View>
      );
    },
  },
  {
    name: 'horizontalScrollToRTL',
    title: '<ScrollView> (horizontal = true) in RTL\n',
    description:
      "You can display <ScrollView>'s child components horizontally rather than vertically",
    render: function (): React.Node {
      return (
        <View>
          <HorizontalScrollView direction="rtl" />
        </View>
      );
    },
  },
  {
    title: '<ScrollView> enable & disable\n',
    description: 'ScrollView scrolling behaviour can be disabled and enabled',
    render: function (): React.Node {
      return <EnableDisableList />;
    },
  },
  {
    title: '<ScrollView> Content\n',
    description: 'Adjust properties of content inside ScrollView.',
    render: function (): React.Node {
      return <ContentExample />;
    },
  },
  {
    title: '<ScrollView> Deceleration Rate\n',
    description:
      'Determines how quickly the scroll view decelerates after the user lifts their finger.',
    render: function (): React.Node {
      return <DecelerationRateExample />;
    },
  },
  {
    title: '<ScrollView> Enable & Disable Scrolling Behavior\n',
    description:
      'DirectionalLockEnabled (iOS), disableIntervalMomentum, disableScrollViewPanResponder can be enabled or disabled.',
    render: function (): React.Node {
      return <DisableEnable />;
    },
  },
  {
    name: 'invertStickyHeaders',
    title: '<ScrollView> Invert Sticky Headers\n',
    description:
      'If sticky headers should stick at the bottom instead of the top of the ScrollView. This is usually used with inverted ScrollViews.',
    render: function (): React.Node {
      return <InvertStickyHeaders />;
    },
  },
  {
    name: 'multipleStickyHeaders',
    title: '<ScrollView> Multiple Sticky Headers\n',
    description:
      'Scroll down to see 3 sticky headers stick when they get to the top.',
    render: function (): React.Node {
      return <MultipleStickyHeaders />;
    },
  },
  {
    name: 'pressableStickyHeaders',
    title: '<ScrollView> Pressable Sticky Header\n',
    description:
      'Press the blue box to toggle it between blue and yellow. The box should remain Pressable after scrolling.',
    render: function (): React.Node {
      return (
        <View style={{height: 400}}>
          <ScrollViewPressableStickyHeaderExample />
        </View>
      );
    },
  },
  {
    name: 'keyboardShouldPersistTaps',
    title: '<ScrollView> Keyboard Options\n',
    description:
      'Toggle the keyboard using the search bar and determine keyboard behavior in response to drag and tap.',
    render: function (): React.Node {
      return <KeyboardExample />;
    },
  },
  {
    title: '<ScrollView> OnContentSizeChange\n',
    description:
      'The text below will change when scrollable content view of the ScrollView changes.',
    render: function (): React.Node {
      return <OnContentSizeChange />;
    },
  },
  {
    title: '<ScrollView> OnMomentumScroll\n',
    description:
      'An alert will be called when the momentum scroll starts or ends.',
    render: function (): React.Node {
      return <OnMomentumScroll />;
    },
  },
  {
    title: '<ScrollView> OnScroll Options\n',
    description:
      'Change the behavior of onScroll using these options: onScrollBeginDrag, onScrollEndDrag, onScrollToTop (iOS), and overScrollMode (Android).',
    render: function (): React.Node {
      return <OnScrollOptions />;
    },
  },
  {
    title: '<ScrollView> RefreshControl\n',
    description: 'Pull down to see RefreshControl indicator.',
    render: function (): React.Node {
      return <RefreshControlExample />;
    },
  },
  {
    title: '<ScrollView> Remove Clipped Subviews\n',
    description:
      'When true, offscreen child views (whose overflow value is hidden) are removed from their native backing superview when offscreen.',
    render: function (): React.Node {
      return <RemoveClippedSubviews />;
    },
  },
  {
    title: '<ScrollView> Scroll Indicator\n',
    description: 'Adjust properties of the scroll indicator.',
    render: function (): React.Node {
      return <ScrollIndicatorExample />;
    },
  },
  {
    title: '<ScrollView> SnapTo Options\n',
    description: 'Adjust properties of snapping to the scroll view.',
    render: function (): React.Node {
      return <SnapToOptions />;
    },
  },
  {
    title: '<ScrollView> (contentOffset = {x: 100, y: 0})\n',
    description: 'Initial contentOffset can be set on ScrollView.',
    render: function (): React.Node {
      return <ContentOffsetList />;
    },
  },
]: Array<RNTesterModuleExample>);

if (Platform.OS === 'ios') {
  examples.push({
    title: '<ScrollView> smooth bi-directional content loading\n',
    description:
      'The `maintainVisibleContentPosition` prop allows insertions to either end of the content ' +
      'without causing the visible content to jump. Re-ordering is not supported.',
    render: function () {
      return <AppendingList />;
    },
  });
  examples.push({
    title: '<ScrollView> (centerContent = true)\n',
    description:
      'ScrollView puts its content in the center if the content is smaller than scroll view',
    render: function (): React.Node {
      return <CenterContentList />;
    },
  });
  examples.push({
    title: '<ScrollView> Always Bounces\n',
    description: 'Always bounce vertically or horizontally.',
    render: function (): React.Node {
      return (
        <>
          <Text style={styles.text}>Vertical</Text>
          <BouncesExampleVertical />
          <Text style={styles.text}>Horizontal</Text>
          <BouncesExampleHorizontal />
        </>
      );
    },
  });
  examples.push({
    title: '<ScrollView> Bounces & Bounces Zoom\n',
    description: 'There are different options for bouncing behavior.',
    render: function (): React.Node {
      return <BouncesExample />;
    },
  });
  examples.push({
    title: '<ScrollView> Indicator Style\n',
    description: 'There are different options for indicator style colors.',
    render: function (): React.Node {
      return <IndicatorStyle />;
    },
  });
  examples.push({
    title: '<ScrollView> Maximum & Minimum Zoom Scale\n',
    description: 'Set the maximum and minimum allowed zoom scale.',
    render: function (): React.Node {
      return <MaxMinZoomScale />;
    },
  });
  examples.push({
    title: '<ScrollView> Maximum & Minimum Zoom Scale\n',
    description: 'Set the maximum and minimum allowed zoom scale.',
    render: function (): React.Node {
      return <MaxMinZoomScale />;
    },
  });
  examples.push({
    title: '<ScrollView> ScrollTo Options\n',
    description:
      'Toggle scrollToOverflowEnabled and scrollsToTop. When scrollToOverflowEnabled is true, the scroll view can be programmatically scrolled beyond its content size. When scrollsToTop is true, the scroll view scrolls to top when the status bar is tapped.',
    render: function (): React.Node {
      return <ScrollToOptions />;
    },
  });
} else if (Platform.OS === 'android') {
  examples.push({
    title: '<ScrollView> EndFillColor & FadingEdgeLength\n',
    description: 'Toggle to set endFillColor and fadingEdgeLength.',
    render: function (): React.Node {
      return <EndFillColorFadingEdgeLen />;
    },
  });
  examples.push({
    title: '<ScrollView> persistentScrollBar\n',
    description: 'Toggle to set persistentScrollbar option.',
    render: function (): React.Node {
      return <AndroidScrollBarOptions />;
    },
  });
}
exports.examples = examples;

const AndroidScrollBarOptions = () => {
  const [persistentScrollBar, setPersistentScrollBar] = useState(false);
  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        persistentScrollbar={persistentScrollBar}>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <Button
        label={'persistentScrollBar: ' + persistentScrollBar.toString()}
        onPress={() => setPersistentScrollBar(!persistentScrollBar)}
      />
    </View>
  );
};

const HorizontalScrollView = (props: {direction: 'ltr' | 'rtl'}) => {
  const {direction} = props;
  const scrollRef = React.useRef<?React.ElementRef<typeof ScrollView>>();
  const title = direction === 'ltr' ? 'LTR Layout' : 'RTL Layout';
  return (
    <View style={{direction}}>
      <Text style={styles.text}>{title}</Text>
      <ScrollView
        ref={scrollRef}
        automaticallyAdjustContentInsets={false}
        horizontal={true}
        style={[styles.scrollView, styles.horizontalScrollView]}
        testID={'scroll_horizontal'}>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <Button
        label="Scroll to start"
        onPress={() => {
          nullthrows<$FlowFixMe>(scrollRef.current).scrollTo({x: 0});
        }}
        testID={'scroll_to_start_button'}
      />
      <Button
        label="Scroll to end"
        onPress={() => {
          nullthrows<$FlowFixMe>(scrollRef.current).scrollToEnd({
            animated: true,
          });
        }}
        testID={'scroll_to_end_button'}
      />
    </View>
  );
};

const EndFillColorFadingEdgeLen = () => {
  const [endFillColor, setEndFillColor] = useState('');
  const [fadingEdgeLen, setFadingEdgeLen] = useState(0);
  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        endFillColor={endFillColor}
        fadingEdgeLength={fadingEdgeLen}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <Button
        label={endFillColor === '' ? 'setEndFillColor' : 'resetEndFillColor'}
        onPress={() =>
          endFillColor === '' ? setEndFillColor('#A9DFD0') : setEndFillColor('')
        }
      />
      <Button
        label={fadingEdgeLen === 0 ? 'setFadingEdgeLen' : 'resetFadingEdgeLen'}
        onPress={() =>
          fadingEdgeLen === 0 ? setFadingEdgeLen(300) : setFadingEdgeLen(0)
        }
      />
    </View>
  );
};

const SnapToOptions = () => {
  const [snapToAlignment, setSnapToAlignment] = useState('start');
  const snapToAlignmentModes = ['start', 'center', 'end'];
  const [snapToEnd, setSnapToEnd] = useState(true);
  const [snapToInterval, setSnapToInterval] = useState(0);
  const [snapToOffsets, setSnapToOffsets] = useState<Array<number>>([]);
  const [snapToStart, setSnapToStart] = useState(true);

  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        snapToAlignment={snapToAlignment}
        snapToEnd={snapToEnd}
        snapToInterval={snapToInterval}
        snapToOffsets={snapToOffsets}
        snapToStart={snapToStart}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      {Platform.OS === 'ios' ? (
        <>
          <Text style={styles.rowTitle}>Select Snap to Alignment Mode</Text>
          <View style={styles.row}>
            {snapToAlignmentModes.map(label => (
              <Button
                active={snapToAlignment === label}
                key={label}
                label={label}
                onPress={() => setSnapToAlignment(label)}
              />
            ))}
          </View>
        </>
      ) : null}
      <Button
        label={'snapToEnd: ' + snapToEnd.toString()}
        onPress={() => setSnapToEnd(!snapToEnd)}
      />
      <Button
        label={'snapToStart: ' + snapToStart.toString()}
        onPress={() => setSnapToStart(!snapToStart)}
      />
      <Button
        label={
          snapToInterval === 0 ? 'setSnapToInterval' : 'reset snapToInterval'
        }
        onPress={() =>
          snapToInterval === 0 ? setSnapToInterval(2) : setSnapToInterval(0)
        }
      />
      <Button
        label={
          snapToOffsets === [] ? 'setSnapToOffsets' : 'reset snapToOffsets'
        }
        onPress={() =>
          snapToOffsets === []
            ? setSnapToOffsets([2, 4, 6, 8, 10])
            : setSnapToOffsets([])
        }
      />
    </View>
  );
};

const ScrollToOptions = () => {
  const [scrollToOverflowEnabled, setScrollToOverflowEnabled] = useState(false);
  const [scrollsToTop, setScrollsToTop] = useState(true);
  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        scrollToOverflowEnabled={scrollToOverflowEnabled}
        scrollsToTop={scrollsToTop}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <Button
        label={'scrollToOverflowEnabled: ' + scrollToOverflowEnabled.toString()}
        onPress={() => setScrollToOverflowEnabled(!scrollToOverflowEnabled)}
      />
      <Button
        label={'scrollsToTop: ' + scrollsToTop.toString()}
        onPress={() => setScrollsToTop(!scrollsToTop)}
      />
    </View>
  );
};

const ScrollIndicatorExample = () => {
  const [scrollIndicatorInsets, setScrollIndicatorInsets] = useState<null | {
    bottom: number,
    left: number,
    right: number,
    top: number,
  }>(null);
  const [showsHorizontalScrollIndic, setShowsHorizontalScrollIndic] =
    useState(true);
  const [showsVerticalScrollIndic, setShowsVerticalScrollIndic] =
    useState(true);
  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        contentInset={{top: 10, bottom: 10, left: 10, right: 10}}
        scrollIndicatorInsets={scrollIndicatorInsets}
        showsHorizontalScrollIndicator={showsHorizontalScrollIndic}
        showsVerticalScrollIndicator={showsVerticalScrollIndic}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <Button
        label={
          scrollIndicatorInsets == null
            ? 'setScrollIndicatorInsets'
            : 'Reset scrollIndicatorInsets'
        }
        onPress={() =>
          scrollIndicatorInsets == null
            ? setScrollIndicatorInsets({
                top: 10,
                left: 10,
                bottom: 10,
                right: 10,
              })
            : setScrollIndicatorInsets(null)
        }
      />
      <Button
        label={
          'showsHorizontalScrollIndicator: ' +
          showsHorizontalScrollIndic.toString()
        }
        onPress={() =>
          setShowsHorizontalScrollIndic(!showsHorizontalScrollIndic)
        }
      />
      <Button
        label={
          'showsVerticalScrollIndicator: ' + showsVerticalScrollIndic.toString()
        }
        onPress={() => setShowsVerticalScrollIndic(!showsVerticalScrollIndic)}
      />
    </View>
  );
};

const RemoveClippedSubviews = () => {
  const [removeClippedSubviews, setRemoveClippedSubviews] = useState(false);
  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        removeClippedSubviews={removeClippedSubviews}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <Button
        label={'removeClippedSubviews: ' + removeClippedSubviews.toString()}
        onPress={() => setRemoveClippedSubviews(!removeClippedSubviews)}
      />
    </View>
  );
};

const RefreshControlExample = () => {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    wait(2000).then(() => setRefreshing(false));
  }, []);

  const wait = (timeout: number) => {
    return new Promise(resolve => {
      setTimeout(resolve, timeout);
    });
  };

  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
    </View>
  );
};

const OnScrollOptions = () => {
  const [onScrollDrag, setOnScrollDrag] = useState('none');
  const [overScrollMode, setOverScrollMode] = useState('auto');
  const overScrollModeOptions = ['auto', 'always', 'never'];
  return (
    <View>
      <Text>onScroll: {onScrollDrag}</Text>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        onScrollBeginDrag={() => setOnScrollDrag('onScrollBeginDrag')}
        onScrollEndDrag={() => setOnScrollDrag('onScrollEndDrag')}
        onScrollToTop={() => setOnScrollDrag('onScrollToTop')}
        overScrollMode={overScrollMode}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      {Platform.OS === 'android' ? (
        <>
          <Text style={styles.rowTitle}>Over Scroll Mode</Text>
          <View style={styles.row}>
            {overScrollModeOptions.map(value => (
              <Button
                active={value === overScrollMode}
                label={value}
                key={value}
                onPress={() => setOverScrollMode(value)}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
};

const OnMomentumScroll = () => {
  const [scroll, setScroll] = useState('none');
  return (
    <View>
      <Text>Scroll State: {scroll}</Text>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        onMomentumScrollBegin={() => setScroll('onMomentumScrollBegin')}
        onMomentumScrollEnd={() => setScroll('onMomentumScrollEnd')}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
    </View>
  );
};

const OnContentSizeChange = () => {
  const [items, setItems] = useState(ITEMS);
  const [contentSizeChanged, setContentSizeChanged] = useState('original');
  return (
    <View>
      <Text>Content Size Changed: {contentSizeChanged}</Text>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        onContentSizeChange={() =>
          contentSizeChanged === 'original'
            ? setContentSizeChanged('changed')
            : setContentSizeChanged('original')
        }
        nestedScrollEnabled>
        {items.map(createItemRow)}
      </ScrollView>
      <Button
        label="Change Content Size"
        onPress={() =>
          items === ITEMS
            ? setItems(['1', '2', '3', '4', '5'])
            : setItems(ITEMS)
        }
      />
    </View>
  );
};

const MaxMinZoomScale = () => {
  const [maxZoomScale, setMaxZoomScale] = useState('1.0');
  const [minZoomScale, setMinZoomScale] = useState('1.0');
  const [zoomScale, setZoomScale] = useState('1.0');
  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        pinchGestureEnabled
        maximumZoomScale={maxZoomScale !== '' ? parseFloat(maxZoomScale) : 0.0}
        minimumZoomScale={minZoomScale !== '' ? parseFloat(minZoomScale) : 0.0}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <Text style={styles.rowTitle}>Set Maximum Zoom Scale</Text>
      <TextInput
        style={styles.textInput}
        value={maxZoomScale}
        onChangeText={val => setMaxZoomScale(val)}
        keyboardType="decimal-pad"
      />
      <Text style={styles.rowTitle}>Set Minimum Zoom Scale</Text>
      <TextInput
        style={styles.textInput}
        value={minZoomScale.toString()}
        onChangeText={val => setMinZoomScale(val)}
        keyboardType="decimal-pad"
      />
      {Platform.OS === 'ios' ? (
        <>
          <Text style={styles.rowTitle}>Set Zoom Scale</Text>
          <TextInput
            style={styles.textInput}
            value={zoomScale.toString()}
            onChangeText={val => setZoomScale(val)}
            keyboardType="decimal-pad"
          />
        </>
      ) : null}
    </View>
  );
};

const KeyboardExample = () => {
  const [keyboardDismissMode, setKeyboardDismissMode] = useState('none');
  const [keyboardShouldPersistTaps, setKeyboardShouldPersistTaps] =
    useState('never');
  const [textInputValue, setTextInputValue] = useState('Tap to open Keyboard');
  const dismissOptions =
    Platform.OS === 'ios'
      ? ['none', 'on-drag', 'interactive']
      : ['none', 'on-drag'];
  const persistOptions = ['never', 'always', 'handled'];
  return (
    <View>
      <TextInput
        style={styles.textInput}
        value={textInputValue}
        onChangeText={val => setTextInputValue(val)}
      />
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        keyboardDismissMode={keyboardDismissMode}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        nestedScrollEnabled>
        <Button
          onPress={() => console.log('button pressed!')}
          label={'Button'}
        />
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <Text style={styles.rowTitle}>Keyboard Dismiss Mode</Text>
      <View style={styles.row}>
        {dismissOptions.map(value => (
          <Button
            active={value === keyboardDismissMode}
            label={value}
            key={value}
            onPress={() => setKeyboardDismissMode(value)}
          />
        ))}
      </View>
      <Text style={styles.rowTitle}>Keyboard Should Persist taps</Text>
      <View style={styles.row}>
        {persistOptions.map(value => (
          <Button
            active={value === keyboardShouldPersistTaps}
            label={value}
            key={value}
            onPress={() => setKeyboardShouldPersistTaps(value)}
          />
        ))}
      </View>
    </View>
  );
};

const InvertStickyHeaders = () => {
  const [invertStickyHeaders, setInvertStickyHeaders] = useState(false);
  const _scrollView = React.useRef<?React.ElementRef<typeof ScrollView>>(null);
  return (
    <View>
      <ScrollView
        ref={_scrollView}
        style={[styles.scrollView, {height: 200}]}
        stickyHeaderIndices={[0]}
        invertStickyHeaders={invertStickyHeaders}
        nestedScrollEnabled
        testID="scroll_sticky_header">
        {<Text>STICKY HEADER</Text>}
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <View>
        <Button
          onPress={() => setInvertStickyHeaders(!invertStickyHeaders)}
          label={'invertStickyHeaders: ' + invertStickyHeaders.toString()}
        />
        <Button
          label="Scroll to top"
          onPress={() => {
            nullthrows<$FlowFixMe>(_scrollView.current).scrollTo({y: 0});
          }}
          testID="scroll_to_top_button"
        />
        <Button
          label="Scroll to bottom"
          onPress={() => {
            nullthrows<$FlowFixMe>(_scrollView.current).scrollToEnd({
              animated: true,
            });
          }}
          testID="scroll_to_bottom_button"
        />
      </View>
    </View>
  );
};

const MultipleStickyHeaders = () => {
  const _scrollView = React.useRef<?React.ElementRef<typeof ScrollView>>(null);
  const stickyHeaderStyle = {backgroundColor: 'yellow'};
  return (
    <View>
      <ScrollView
        ref={_scrollView}
        style={[styles.scrollView, {height: 200}]}
        stickyHeaderIndices={[0, 13, 26]}
        nestedScrollEnabled
        testID="scroll_multiple_sticky_headers">
        {<Item msg={'Sticky Header 1'} style={stickyHeaderStyle} />}
        {ITEMS.map(createItemRow)}
        {<Item msg={'Sticky Header 2'} style={stickyHeaderStyle} />}
        {ITEMS.map(createItemRow)}
        {<Item msg={'Sticky Header 3'} style={stickyHeaderStyle} />}
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <View>
        <Button
          label="Scroll to top"
          onPress={() => {
            nullthrows<$FlowFixMe>(_scrollView.current).scrollTo({y: 0});
          }}
          testID="scroll_to_top_button"
        />
        <Button
          label="Scroll to bottom"
          onPress={() => {
            nullthrows<$FlowFixMe>(_scrollView.current).scrollToEnd({
              animated: true,
            });
          }}
          testID="scroll_to_bottom_button"
        />
      </View>
    </View>
  );
};

const IndicatorStyle = () => {
  const [indicatorStyle, setIndicatorStyle] = useState('default');
  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        indicatorStyle={indicatorStyle}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <View>
        <Button
          onPress={() =>
            indicatorStyle === 'default'
              ? setIndicatorStyle('white')
              : setIndicatorStyle('default')
          }
          label={'Indicator Style: ' + indicatorStyle}
        />
      </View>
    </View>
  );
};

const DisableEnable = () => {
  const [directionalLockEnabled, setDirectionalLockEnabled] = useState(false);
  const [disableIntervalMomentum, setDisableIntervalMomentum] = useState(false);
  const [disableScrollViewPanResponder, setDisableScrollViewPanResponder] =
    useState(false);
  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        contentInset={{top: 10, bottom: 10, left: 10, right: 10}}
        snapToInterval={0}
        directionalLockEnabled={directionalLockEnabled}
        disableIntervalMomentum={disableIntervalMomentum}
        disableScrollViewPanResponder={disableScrollViewPanResponder}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <View>
        {Platform.OS === 'ios' ? (
          <Button
            onPress={() => setDirectionalLockEnabled(!directionalLockEnabled)}
            label={
              'directionalLockEnabled: ' + directionalLockEnabled.toString()
            }
          />
        ) : null}
        <Button
          onPress={() => setDisableIntervalMomentum(!disableIntervalMomentum)}
          label={
            'setDisableIntervalMomentum: ' + disableIntervalMomentum.toString()
          }
        />
        <Button
          onPress={() =>
            setDisableScrollViewPanResponder(!disableScrollViewPanResponder)
          }
          label={
            'setDisableScrollViewPanResponder: ' +
            disableScrollViewPanResponder.toString()
          }
        />
      </View>
    </View>
  );
};

const DecelerationRateExample = () => {
  const [decelRate, setDecelRate] = useState('normal');
  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        decelerationRate={decelRate}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <View>
        <Button
          onPress={() =>
            decelRate === 'normal'
              ? setDecelRate('fast')
              : setDecelRate('normal')
          }
          label={'Deceleration Rate: ' + decelRate}
        />
      </View>
    </View>
  );
};

const ContentExample = () => {
  const [canCancelContentTouches, setCanCancelContentTouches] = useState(false);
  const [contentInset, setContentInset] = useState<null | {
    bottom: number,
    left: number,
    right: number,
    top: number,
  }>(null);
  const [contentContainerStyle, setContentContainerStyle] = useState<null | {
    backgroundColor: string,
  }>(null);
  const [contentInsetAdjustmentBehavior, setContentInsetAdjustmentBehavior] =
    useState('never');
  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        canCancelContentTouches={canCancelContentTouches}
        contentOffset={{x: 100, y: 0}}
        contentContainerStyle={contentContainerStyle}
        contentInset={contentInset}
        contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <View>
        {Platform.OS === 'ios' ? (
          <>
            <Button
              onPress={() =>
                setCanCancelContentTouches(!canCancelContentTouches)
              }
              label={
                'canCancelContentTouches: ' + canCancelContentTouches.toString()
              }
            />
            <Button
              onPress={() =>
                contentInsetAdjustmentBehavior === 'never'
                  ? setContentInsetAdjustmentBehavior('always')
                  : setContentInsetAdjustmentBehavior('never')
              }
              label={
                contentInsetAdjustmentBehavior === 'never'
                  ? "setContentInsetAdjustmentBehavior to 'always'"
                  : 'reset content inset adjustment behavior'
              }
            />
          </>
        ) : null}
        <Button
          onPress={() =>
            contentContainerStyle === null
              ? setContentContainerStyle(styles.containerStyle)
              : setContentContainerStyle(null)
          }
          label={
            contentContainerStyle === null
              ? 'setContentContainerStyle'
              : 'reset content container style'
          }
        />
        <Button
          onPress={() =>
            contentInset === null
              ? setContentInset({top: 10, bottom: 10, left: 10, right: 10})
              : setContentInset(null)
          }
          label={
            contentInset === null ? 'setContentInset' : 'reset content inset'
          }
        />
      </View>
    </View>
  );
};

const BouncesExample = () => {
  const [bounces, setBounces] = useState(false);
  const [bouncesZoom, setBouncesZoom] = useState(false);
  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        bounces={bounces}
        bouncesZoom={bouncesZoom}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <View>
        <Button
          onPress={() => setBounces(!bounces)}
          label={'Bounces: ' + bounces.toString()}
        />
        <Button
          onPress={() => setBouncesZoom(!bouncesZoom)}
          label={'Bounces Zoom: ' + bouncesZoom.toString()}
        />
      </View>
    </View>
  );
};

const BouncesExampleHorizontal = () => {
  const [bounce, setBounce] = useState(false);
  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        horizontal={true}
        alwaysBounceHorizontal={bounce}
        contentOffset={{x: 100, y: 0}}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <View>
        <Button
          onPress={() => setBounce(!bounce)}
          label={'Always Bounce Horizontal: ' + bounce.toString()}
        />
      </View>
    </View>
  );
};

const BouncesExampleVertical = () => {
  const [bounce, setBounce] = useState(false);
  return (
    <View>
      <ScrollView
        style={[styles.scrollView, {height: 200}]}
        alwaysBounceVertical={bounce}
        contentOffset={{x: 100, y: 0}}
        nestedScrollEnabled>
        {ITEMS.map(createItemRow)}
      </ScrollView>
      <View>
        <Button
          onPress={() => setBounce(!bounce)}
          label={'Always Bounce Vertical: ' + bounce.toString()}
        />
      </View>
    </View>
  );
};

class Item extends React.PureComponent<{|
  msg?: string,
  style?: ViewStyleProp,
|}> {
  render(): $FlowFixMe {
    return (
      <View style={[styles.item, this.props.style]}>
        <Text>{this.props.msg}</Text>
      </View>
    );
  }
}

let ITEMS = [...Array(12)].map((_, i) => `Item ${i}`);

const createItemRow = (msg: string, index: number) => (
  <Item key={index} msg={msg} />
);

const Button = (props: {
  active?: boolean,
  label: string,
  onPress: () => void,
  testID?: string,
}) => (
  <TouchableOpacity
    style={StyleSheet.compose(
      styles.button,
      props.active === true ? styles.activeButton : null,
    )}
    onPress={props.onPress}
    testID={props.testID}>
    <Text>{props.label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#eeeeee',
    height: 300,
  },
  horizontalScrollView: {
    height: 106,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: 5,
  },
  activeButton: {
    backgroundColor: 'rgba(100,215,255,.3)',
  },
  button: {
    margin: 5,
    padding: 5,
    alignItems: 'center',
    backgroundColor: '#cccccc',
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  item: {
    margin: 5,
    padding: 5,
    backgroundColor: '#cccccc',
    borderRadius: 3,
    minWidth: 96,
  },
  containerStyle: {
    backgroundColor: '#aae3b6',
  },
  rowTitle: {
    flex: 1,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  textInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
  },
});
