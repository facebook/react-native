/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {PointerEvent} from 'react-native/Libraries/Types/CoreEventTypes';
import {Button, StyleSheet, ScrollView, View, Text} from 'react-native';
import * as React from 'react';
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';

import PointerEventAttributesHoverablePointers from './W3CPointerEventPlatformTests/PointerEventAttributesHoverablePointers';
import PointerEventPointerMove from './W3CPointerEventPlatformTests/PointerEventPointerMove';

function EventfulView(props: {|
  name: string,
  emitByDefault?: boolean,
  onLeave?: boolean,
  onLeaveCapture?: boolean,
  onEnter?: boolean,
  onEnterCapture?: boolean,
  onDown?: boolean,
  onDownCapture?: boolean,
  onUp?: boolean,
  onUpCapture?: boolean,
  onMove?: boolean,
  onMoveCapture?: boolean,
  log: string => void,
  ...ViewProps,
|}) {
  const ref = React.useRef<?React.ElementRef<typeof View>>();
  React.useEffect(() => {
    // $FlowFixMe[prop-missing] Using private property
    setTag(ref.current?._nativeTag);
  }, [ref]);

  const {
    log,
    name,
    children,
    emitByDefault,
    onLeave,
    onLeaveCapture,
    onEnter,
    onEnterCapture,
    onDown,
    onDownCapture,
    onUp,
    onUpCapture,
    onMove,
    onMoveCapture,
    ...restProps
  } = props;
  const [tag, setTag] = React.useState('');

  const eventLog = (eventName: string) => (event: PointerEvent) => {
    // $FlowFixMe Using private property
    log(`${name} - ${eventName} - target: ${event.target._nativeTag}`);
  };

  const listeners = {
    onPointerUp: onUp ? eventLog('up') : null,
    onPointerUpCapture: onUpCapture ? eventLog('up capture') : null,
    onPointerDown: onDown ? eventLog('down') : null,
    onPointerDownCapture: onDownCapture ? eventLog('down capture') : null,
    onPointerLeave: onLeave ? eventLog('leave') : null,
    onPointerLeaveCapture: onLeaveCapture ? eventLog('leave capture') : null,
    onPointerEnter: onEnter ? eventLog('enter') : null,
    onPointerEnterCapture: onEnterCapture ? eventLog('enter capture') : null,
    onPointerMove: onMove ? eventLog('move') : null,
    onPointerMoveCapture: onMoveCapture ? eventLog('move capture') : null,
  };

  let listeningTo = Object.keys(listeners)
    .filter(listenerName => listeners[listenerName] != null)
    .join(', ');

  return (
    <View ref={ref} {...listeners} {...restProps}>
      <View style={styles.row}>
        <Text>
          {props.name}, {tag}, {listeningTo}
        </Text>
      </View>
      {props.children}
    </View>
  );
}

function AbsoluteChildExample({log}: {log: string => void}) {
  return (
    <View style={styles.absoluteExampleContainer}>
      <EventfulView
        onUp
        onDown
        onEnter
        onLeave
        log={log}
        style={StyleSheet.compose(styles.eventfulView, styles.parent)}
        name="parent">
        <EventfulView
          onUp
          onDown
          onEnter
          onLeave
          log={log}
          emitByDefault
          style={StyleSheet.compose(styles.eventfulView, styles.absoluteChild)}
          name="childA"
        />
      </EventfulView>
    </View>
  );
}

function RelativeChildExample({log}: {log: string => void}) {
  return (
    <>
      <EventfulView
        log={log}
        style={StyleSheet.compose(styles.eventfulView, styles.parent)}
        onUp
        onDown
        onEnter
        onLeave
        name="parent">
        <EventfulView
          log={log}
          onUp
          onDown
          onEnter
          onLeave
          style={StyleSheet.compose(styles.eventfulView, styles.relativeChild)}
          name="childA">
          <EventfulView
            log={log}
            onUp
            onDown
            onEnter
            onLeave
            style={StyleSheet.compose(
              styles.eventfulView,
              styles.relativeChild,
            )}
            name="childB"
          />
        </EventfulView>
      </EventfulView>
    </>
  );
}

function PointerEventScaffolding({
  Example,
}: {
  Example: React.AbstractComponent<{log: string => void}>,
}) {
  const [eventsLog, setEventsLog] = React.useState('');
  const clear = () => setEventsLog('');
  const log = (eventStr: string) => {
    setEventsLog(currentEventsLog => `${eventStr}\n${currentEventsLog}`);
  };
  return (
    <ScrollView>
      <Example log={log} />
      <View>
        <View style={styles.row}>
          <Text>Events Log</Text>
          <Button onPress={clear} title="Clear" />
        </View>
        <Text>{eventsLog}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  absoluteExampleContainer: {
    height: 200,
  },
  absoluteChild: {
    position: 'absolute',
    top: 100,
    height: 50,
    width: 300,
    borderWidth: 1,
    borderColor: 'red',
  },
  eventfulView: {
    paddingBottom: 40,
  },
  relativeChild: {borderWidth: 1, margin: 10},
  parent: {
    margin: 20,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default {
  title: 'W3C PointerEvents experiment',
  category: 'Experimental',
  description: 'Demonstrate pointer events',
  showIndividualExamples: true,
  examples: [
    {
      name: 'relative',
      description: 'Children laid out using relative positioning',
      title: 'Relative Child',
      render(): React.Node {
        return <PointerEventScaffolding Example={RelativeChildExample} />;
      },
    },
    {
      name: 'absolute',
      description: 'Children laid out using absolute positioning',
      title: 'Absolute Child',
      render(): React.Node {
        return <PointerEventScaffolding Example={AbsoluteChildExample} />;
      },
    },
    {
      name: 'pointerevent_attributes_hoverable_pointers',
      description: '',
      title: 'Pointer Events hoverable pointer attributes test',
      render(): React.Node {
        return <PointerEventAttributesHoverablePointers />;
      },
    },
    {
      name: 'pointerevent_pointermove',
      description: '',
      title: 'PointerMove test',
      render(): React.Node {
        return <PointerEventPointerMove />;
      },
    },
  ],
};
