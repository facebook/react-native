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
  log: string => void,
  ...ViewProps,
|}) {
  const ref = React.useRef<?React.ElementRef<typeof View>>();
  React.useEffect(() => {
    // $FlowFixMe[prop-missing] Using private property
    setTag(ref.current?._nativeTag);
  }, [ref]);
  const [lastEvent, setLastEvent] = React.useState('');
  const [listen, setListen] = React.useState(false);
  const [tag, setTag] = React.useState('');

  const {log, name, children, ...restProps} = props;

  const eventLog = eventName => event => {
    // $FlowFixMe[prop-missing] Using private property
    log(`${name} - ${eventName} - target: ${event.target._nativeTag}`);
    setLastEvent(eventName);
  };

  const listeners = listen
    ? {
        onPointerUp: eventLog('up'),
        onPointerDown: eventLog('down'),
        onPointerLeave2: eventLog('leave'),
        onPointerEnter2: eventLog('enter'),
      }
    : Object.freeze({});

  return (
    <View ref={ref} {...listeners} {...restProps}>
      <View style={styles.row}>
        <Text>
          {props.name}, {tag}, last event: {lastEvent}
        </Text>
        <Switch value={listen} onValueChange={() => setListen(l => !l)} />
      </View>
      {props.children}
    </View>
  );
}

function RelativeChildExample() {
  const [eventsLog, setEventsLog] = React.useState('');
  const clear = () => setEventsLog('');
  const log = eventStr => {
    setEventsLog(currentEventsLog => `${currentEventsLog}\n${eventStr}`);
  };
  return (
    <ScrollView>
      <View>
        <EventfulView
          log={log}
          collapsable={false}
          style={StyleSheet.compose(styles.eventfulView, styles.parent)}
          name="parent">
          <EventfulView
            log={log}
            style={StyleSheet.compose(
              styles.eventfulView,
              styles.relativeChild,
            )}
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
      </View>
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
  absoluteChild: {
    position: 'absolute',
    top: 400,
    left: 40,
    height: 100,
    width: 200,
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

exports.title = 'W3C PointerEvents experiment';
exports.category = 'Experimental';
exports.description = 'Demonstrate pointer events';
exports.examples = [
  {
    title: 'Relative Child',
    render(): React.Node {
      return <RelativeChildExample />;
    },
  },
];
