/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {PlatformTestComponentBaseProps} from '../PlatformTest/RNTesterPlatformTestTypes';
import type {EventOccurrence, EventTrackerProps} from './PointerEventSupport';
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';

import {EventTracker, mkEvent} from './PointerEventSupport';
import RNTesterPlatformTest from '../PlatformTest/RNTesterPlatformTest';
import * as React from 'react';
import {useRef} from 'react';
import {StyleSheet, View} from 'react-native';

function PointerEventBoxParentChild(props: {
  eventsToTrack: EventTrackerProps['eventsToTrack'],
  eventsRef: EventTrackerProps['eventsRef'],
  pointerEvents: $NonMaybeType<ViewProps['pointerEvents']>,
  childStyle: ViewProps['style'],
  parentStyleOverride?: ViewProps['style'],
}) {
  const parentId = `parent_${props.pointerEvents}`;
  const childId = `child_${props.pointerEvents}`;
  return (
    <EventTracker
      eventsRef={props.eventsRef}
      eventsToTrack={props.eventsToTrack}
      id={parentId}
      style={StyleSheet.compose(styles.parent, props.parentStyleOverride)}
      pointerEvents={props.pointerEvents}>
      <EventTracker
        eventsRef={props.eventsRef}
        eventsToTrack={props.eventsToTrack}
        id={childId}
        style={props.childStyle}
      />
    </EventTracker>
  );
}

const eventsToTrack = ['onClick'];

function PointerEventClickTouchHierarchyPointerEventsTestCase(
  props: PlatformTestComponentBaseProps,
) {
  const {harness} = props;

  const eventsInOrder = useRef<Array<EventOccurrence>>([]);

  const testPointerClick = harness.useAsyncTest(
    'click event received in hierarchy with pointerEvents',
  );

  const checkResults = () => {
    testPointerClick.step(({assert_equals}) => {
      const eventsReceived = eventsInOrder.current;
      assert_equals(
        eventsReceived.length,
        5,
        'received the expected number of events',
      );
      const boxOnlyEvents = eventsReceived.slice(0, 1);
      const boxNoneEvents = eventsReceived.slice(1, 3);
      const autoEvents = eventsReceived.slice(3);
      assert_equals(
        JSON.stringify(boxOnlyEvents),
        JSON.stringify([mkEvent('parent_box-only', 'onClick')]),
        'correct events for box-only',
      );
      assert_equals(
        JSON.stringify(boxNoneEvents),
        JSON.stringify([
          mkEvent('child_box-none', 'onClick'),
          mkEvent('parent_box-none', 'onClick'),
        ]),
        'correct events for box-none',
      );
      assert_equals(
        JSON.stringify(autoEvents),
        JSON.stringify([
          mkEvent('child_auto', 'onClick'),
          mkEvent('parent_auto', 'onClick'),
        ]),
        'correct events for auto',
      );
    });
    testPointerClick.done();
  };

  return (
    <View>
      <View style={styles.parentContainer}>
        <PointerEventBoxParentChild
          eventsToTrack={eventsToTrack}
          childStyle={styles.targetBoxOnly}
          pointerEvents="box-only"
          eventsRef={eventsInOrder}
        />
        <PointerEventBoxParentChild
          eventsToTrack={eventsToTrack}
          childStyle={styles.targetBoxNone}
          pointerEvents="box-none"
          eventsRef={eventsInOrder}
          parentStyleOverride={{
            backgroundColor: 'maroon',
            height: 100,
            justifyContent: 'flex-start',
          }}
        />
        <PointerEventBoxParentChild
          eventsToTrack={eventsToTrack}
          childStyle={styles.targetAuto}
          pointerEvents="auto"
          eventsRef={eventsInOrder}
        />
        <PointerEventBoxParentChild
          eventsToTrack={eventsToTrack}
          childStyle={styles.targetNone}
          pointerEvents="none"
          eventsRef={eventsInOrder}
        />
      </View>
      <View style={styles.checkResults} onClick={checkResults} />
    </View>
  );
}

const styles = StyleSheet.create({
  parentContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
  parent: {
    display: 'flex',
    backgroundColor: 'black',
    height: 80,
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBoxOnly: {
    backgroundColor: 'blue',
    height: 50,
    width: 50,
  },
  targetBoxNone: {
    backgroundColor: 'red',
    height: 50,
    width: 50,
  },
  targetAuto: {
    backgroundColor: 'yellow',
    height: 50,
    width: 50,
  },
  targetNone: {
    backgroundColor: 'purple',
    height: 50,
    width: 50,
  },
  checkResults: {
    backgroundColor: 'green',
    height: 50,
    width: '80%',
  },
});

type Props = $ReadOnly<{}>;
export default function PointerEventClickTouchHierarchyPointerEvents(
  props: Props,
): React.MixedElement {
  return (
    <RNTesterPlatformTest
      component={PointerEventClickTouchHierarchyPointerEventsTestCase}
      description="This test checks if the click event triggers properly in a hierarchy when the `pointerEvents` property is used."
      instructions={[
        'Click (tap/release) the blue square',
        'Click (tap/release) the dark red rectangle (outer)',
        'Click (tap/release) the red square (inner)',
        'Click (tap/release) the yellow square',
        'Click (tap/release) the purple square',
        'Tap the green rectangle to check results',
      ]}
      title="Click hierarchy test (pointerEvents)"
    />
  );
}
