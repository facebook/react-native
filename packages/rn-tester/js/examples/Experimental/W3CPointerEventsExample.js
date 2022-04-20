/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import {Button, Switch, StyleSheet, ScrollView, View, Text} from 'react-native';
import * as React from 'react';
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';

function EventfulView(props: {|
  name: string,
  emitByDefault?: boolean,
  log: string => void,
  ...ViewProps,
|}) {
  const ref = React.useRef<?React.ElementRef<typeof View>>();
  React.useEffect(() => {
    // $FlowFixMe[prop-missing] Using private property
    setTag(ref.current?._nativeTag);
  }, [ref]);

  const {log, name, children, emitByDefault, ...restProps} = props;
  const [lastEvent, setLastEvent] = React.useState('');
  const [listen, setListen] = React.useState(!!emitByDefault);
  const [tag, setTag] = React.useState('');

  const eventLog = eventName => event => {
    // $FlowFixMe Using private property
    log(`${name} - ${eventName} - target: ${event.target._nativeTag}`);
    setLastEvent(eventName);
  };

  const listeners = listen
    ? {
        onPointerUp: eventLog('up'),
        onPointerUpCapture: eventLog('up capture'),
        onPointerDown: eventLog('down'),
        onPointerDownCapture: eventLog('down capture'),
        onPointerLeave2: eventLog('leave'),
        onPointerLeave2Capture: eventLog('leave capture'),
        onPointerEnter2: eventLog('enter'),
        onPointerEnter2Capture: eventLog('enter capture'),
      }
    : Object.freeze({});

  return (
    <View ref={ref} {...listeners} {...restProps} collapsable={!listen}>
      <View style={styles.row}>
        <Text>
          {props.name}, {tag}, last event: {lastEvent}
        </Text>
        <Switch
          disabled={emitByDefault}
          value={listen}
          onValueChange={() => setListen(l => !l)}
        />
      </View>
      {props.children}
    </View>
  );
}

function AbsoluteChildExample({log}: {log: string => void}) {
  return (
    <View style={styles.absoluteExampleContainer}>
      <EventfulView
        log={log}
        style={StyleSheet.compose(styles.eventfulView, styles.parent)}
        name="parent">
        <EventfulView
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
        name="parent">
        <EventfulView
          log={log}
          style={StyleSheet.compose(styles.eventfulView, styles.relativeChild)}
          name="childA">
          <EventfulView
            log={log}
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
  const log = eventStr => {
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
  ],
};
