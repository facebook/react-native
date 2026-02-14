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

import * as React from 'react';
import {useCallback, useState} from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';
import {createPortal} from 'react-native/Libraries/ReactNative/RendererProxy';

function CustomComponent() {
  const [count, setCount] = useState(0);
  return (
    <Button title={'Test ' + count} onPress={() => setCount(c => c + 1)} />
  );
}
function PortalBasicExample(): React.Node {
  const [portals, setPortals] = useState<{[string]: boolean}>({
    a: false,
    b: false,
    c: false,
  });
  const [count, setCount] = useState(0);
  const targetRef = React.useRef<React.ElementRef<typeof View> | null>(null);

  const toggle = useCallback(
    (id: string) => {
      if (!portals[id] && targetRef.current == null) {
        return;
      }
      setPortals(prev => ({...prev, [id]: !prev[id]}));
    },
    [portals],
  );

  const colors: {[string]: string} = {a: '#e94560', b: '#4ecca3', c: '#3498db'};

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        {['a', 'b', 'c'].map(id => (
          <Button
            key={id}
            title={
              portals[id]
                ? `Hide ${id.toUpperCase()}`
                : `Show ${id.toUpperCase()}`
            }
            onPress={() => toggle(id)}
          />
        ))}
      </View>

      <Button
        title={`Update State (${count})`}
        onPress={() => setCount(c => c + 1)}
      />

      <View style={styles.sourceBox}>
        {['a', 'b', 'c'].map(id =>
          portals[id]
            ? createPortal(
                <View
                  key={id}
                  style={[
                    styles.portalContent,
                    {backgroundColor: colors[id], marginTop: 4},
                  ]}>
                  <Text style={styles.portalText}>
                    Portal {id.toUpperCase()} (count: {count})
                  </Text>
                  <CustomComponent />
                </View>,
                targetRef.current,
              )
            : null,
        )}
      </View>

      <View ref={targetRef} style={styles.targetBox} collapsable={false}>
        <Text style={styles.label}>Target View</Text>
      </View>
    </View>
  );
}

const ThemeContext = React.createContext('light');

function ContextReader(): React.Node {
  const theme = React.useContext(ThemeContext);
  return <Text style={styles.portalText}>Theme: {theme}</Text>;
}

function PortalContextExample(): React.Node {
  const [showPortal, setShowPortal] = useState(false);
  const targetRef = React.useRef<React.ElementRef<typeof View> | null>(null);

  const handleToggle = useCallback(() => {
    if (!showPortal) {
      if (targetRef.current != null) {
        setShowPortal(true);
      }
    } else {
      setShowPortal(false);
    }
  }, [showPortal]);

  return (
    <ThemeContext.Provider value="dark">
      <View style={styles.container}>
        <Button
          title={showPortal ? 'Unmount' : 'Mount'}
          onPress={handleToggle}
        />
        <View style={styles.sourceBox}>
          {showPortal
            ? createPortal(
                <View style={styles.portalContent}>
                  <ContextReader />
                </View>,
                targetRef.current,
              )
            : null}
        </View>
        <View ref={targetRef} style={styles.targetBox} collapsable={false}>
          <Text style={styles.label}>Target View</Text>
        </View>
      </View>
    </ThemeContext.Provider>
  );
}

function PortalOverlayExample(): React.Node {
  const [show, setShow] = useState(false);
  const ref = React.useRef<React.ElementRef<typeof View> | null>(null);

  const handleToggle = useCallback(() => {
    if (!show) {
      if (ref.current != null) {
        setShow(true);
      }
    } else {
      setShow(false);
    }
  }, [show]);

  return (
    <View style={styles.container}>
      <Button
        title={show ? 'Hide Overlay' : 'Show Overlay'}
        onPress={handleToggle}
      />
      <View ref={ref} style={styles.overlayTarget} collapsable={false}>
        <Text>Content underneath</Text>
        {show
          ? createPortal(
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>Portal Overlay</Text>
              </View>,
              ref.current,
            )
          : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  sourceBox: {
    borderWidth: 1,
    borderColor: '#e94560',
    borderStyle: 'dashed',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    minHeight: 30,
  },
  targetBox: {
    borderWidth: 2,
    borderColor: '#4ecca3',
    borderRadius: 6,
    padding: 10,
    minHeight: 60,
  },
  label: {
    fontSize: 12,
    color: '#888',
  },
  portalContent: {
    backgroundColor: '#4ecca3',
    padding: 10,
    borderRadius: 4,
  },
  portalText: {
    fontWeight: 'bold',
  },
  overlayTarget: {
    marginTop: 10,
    backgroundColor: '#eee',
    borderRadius: 6,
    padding: 20,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(78, 204, 163, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  overlayText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export const displayName: ?string = undefined;
export const framework = 'React';
export const title = 'Portal';
export const category = 'UI';
export const description = 'Render children into a different native view.';
export const examples: Array<RNTesterModuleExample> = [
  {
    title: 'Multiple Portals',
    description:
      'Multiple unkeyed portals into the same target view with state updates.',
    render(): React.Node {
      return <PortalBasicExample />;
    },
  },
  {
    title: 'Context Preservation',
    description:
      'Portal children retain access to React context from the source tree.',
    render(): React.Node {
      return <PortalContextExample />;
    },
  },
  {
    title: 'Overlay',
    description: 'Portal as an overlay on top of the target view.',
    render(): React.Node {
      return <PortalOverlayExample />;
    },
  },
];
