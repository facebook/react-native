import React, { useCallback, useMemo, useRef } from 'react';
import { ScrollView, View, Text, Button, Dimensions, StyleSheet } from 'react-native';

const useOnUpdated = (cb, dependency) => {
  const last = useRef(undefined);

  if (dependency !== last.current) {
    last.current = dependency;
    cb();
  }
};

export const TabView = ({
  width,
  onSwipeStart,
  onSwipeEnd,
  onIndexChange,
  index,
  lazy,
  renderScene,
  renderTabBar,
  routes,
}) => {
  const scrollRef = useRef(null);
  const previousSelectedOffset = useRef(0);
  const offsetX = useRef(0);

  const handleOnTabIndexChange = useCallback(
    (event) => {
      // We ignore negative values bc it messes up the index update logic.
      offsetX.current = Math.max(event.nativeEvent.contentOffset.x, 0);
      const currentIndex = Math.round(offsetX.current / width);
      const selectedOffset = index * width;
      const movingOffset = currentIndex * width;
      // The following guard is to ignore scroll when it's done by the scrollTo call
      // in useOnUpdated
      if (
        previousSelectedOffset.current !== selectedOffset &&
        selectedOffset !== movingOffset
      ) {
        return;
      }
      previousSelectedOffset.current = selectedOffset;
      const resultingIndex = currentIndex;
      if (selectedOffset !== movingOffset) {
        onIndexChange?.(resultingIndex);
      }
    },
    [onIndexChange, width, index],
  );

  /*
   * The sole purpose of useOnUpdated is to move the scroll position
   * when the index updates from the outside.
   * */
  useOnUpdated(() => {
    /*
     * Math.trunc is required specially when width is a number with many decimals
     * will cause the offsetX.current to not always match.
     * */
    const isAtSnapPoint =
      (Math.trunc(offsetX.current) / Math.trunc(width)) % 1 === 0;

    const selectedSnapPoint = index * width;
    const isCurrentlyOutOfPlace = offsetX.current !== selectedSnapPoint;
    /*
     * We need to check if it is at a snap point bc it means the position
     * was changed through the tab bar.
     * */
    if (scrollRef.current && isAtSnapPoint && isCurrentlyOutOfPlace) {
      scrollRef.current.scrollTo({
        x: index * width,
        animated: true,
      });
    }
  }, index);

  const renderedIndexes = useRef(new Set());
  useOnUpdated(() => {
    if (!renderedIndexes.current.has(index)) {
      renderedIndexes.current.add(index);
    }
  }, index);

  const memoizedWidth = useMemo(() => ({ width }), [width]);
  const childHeights = useRef(new Map());
  const handleChildOnLayout = useCallback(
    (routeKey) =>
      function onLayoutHandler(e) {
        return childHeights.current.set(routeKey, e.nativeEvent.layout.height);
      },
    [],
  );

  const children = useMemo(
    () =>
      routes.map((route, routeIndex) => {
        if (lazy && !renderedIndexes.current.has(routeIndex)) {
          const PlaceholderView = (
            <View key={route.key + '_lazy_wrapper'} style={memoizedWidth} />
          );
          return PlaceholderView;
        }

        const child = renderScene({ route, activeIndex: index });

        return (
          <View key={route.key} style={memoizedWidth}>
            <View onLayout={handleChildOnLayout(route.key)}>{child}</View>
          </View>
        );
      }),
    // index must stay as a dependency for the lazy logic to run
    [routes, renderScene, index, memoizedWidth, lazy, handleChildOnLayout],
  );

  const tabBar = useMemo(
    () =>
      renderTabBar?.({
        onPress: onIndexChange,
        navigationState: {
          index,
          routes,
        },
      }),
    [index, routes, onIndexChange, renderTabBar],
  );

  return (
    <>
      {tabBar}
      <ScrollView
        ref={scrollRef}
        onScroll={handleOnTabIndexChange}
        scrollEventThrottle={16}
        horizontal
        snapToStart
        snapToInterval={width}
        decelerationRate="fast"
        pagingEnabled
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        disableIntervalMomentum
        onScrollBeginDrag={onSwipeStart}
        onScrollEndDrag={onSwipeEnd}
      >
        {children}
      </ScrollView>
    </>
  );
};

const Spacer = ({ vertical }) => <View style={vertical ? styles.heightTen : styles.widthTen} />;

const renderScene = ({ route }) => (
	<View
		style={[{ backgroundColor: route.key === 'one' ? 'lightblue' : 'lightpink' }, styles.tabViewScene]}
	>
		<Text>Hello {route.key}
		</Text>
	</View>
);

const Example = () => {
	const [tab, setTab] = React.useState(0);
	const setTabOne = () => setTab(0);
	const setTabTwo = () => setTab(1);

	return (
		<View style={styles.container}>
		<View style={styles.row}>
			<Button title="Tab One" onPress={setTabOne} />
			<Spacer />
			<Button title="Tab Two" onPress={setTabTwo} />
		</View>
		<Spacer vertical />
		<TabView
        index={tab}
        onIndexChange={setTab}
        width={Dimensions.get('screen').width - 40}
        routes={[{ key: 'one' }, { key: 'two'}]}
        renderScene={renderScene}
      />
		</View>
	);
};

const styles = StyleSheet.create({
	row: { flexDirection: 'row' },
	heightTen: { height: 10 },
	widthTen: { width: 10 },
	tabViewScene: { height: '100%', justifyContent: 'center', alignItems: 'center' },
	container: { flex: 1, backgroundColor: 'white', padding: 20, borderColor: 'lightgray' },
});

exports.title = 'TabView using ScrollView';
exports.category = 'Advanced';
exports.description =
  'Component that uses a horizontal ScrollView to render a tab view.';

exports.examples = [
  {
    title: 'TabView ScrollView',
    render: function () {
      return <Example />;
    },
  },
];
