/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */


import * as React from 'react';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, findNodeHandle, Button } from 'react-native';
import { createPortal } from 'react-native/Libraries/ReactNative/RendererProxy';

const ThemeContext = React.createContext < string > ('none');

const PortaledContent = ({ handleUnmount }) => {
  const theme = React.useContext(ThemeContext);
  console.log('PortaledContent', theme);
  React.useEffect(() => {
    console.log('PortaledContent', theme);
    return () => {
      console.log('PortaledContent unmounted');
    };
  }, [theme]);
  return (
    <View style={styles.portaledBox}>
      <Text style={styles.portaledText}>
        I was rendered through a React Portal!
      </Text>
      <Text style={styles.portaledDetail}>
        ThemeContext value: "{theme}" (proves context is preserved)
      </Text>
      <Button
        title="Unmount Portal"
        onPress={() => {
          console.log('Button pressed');
          handleUnmount();
        }}
      />
    </View>
  );
};

const PortalDemo = () => {
  const [showPortal, setShowPortal] = useState(false);
  const [targetTag, setTargetTag] = useState < number | null > (null);
  const [status, setStatus] = useState < string > ('Tap "Mount Portal" to begin');
  const targetRef = React.useRef < React.ElementRef < typeof View > | null > (null);

  const handleMount = useCallback(() => {
    const node = targetRef.current;
    if (node == null) {
      setStatus('ERROR: target ref is null');
      return;
    }
    const tag = findNodeHandle(node);
    if (tag == null) {
      setStatus('ERROR: findNodeHandle returned null');
      return;
    }
    setTargetTag(tag);
    setShowPortal(true);
    setStatus(`Portal mounted into native tag ${tag}`);
  }, []);

  const handleUnmount = useCallback(() => {
    setShowPortal(false);
    setTargetTag(null);
    setStatus('Portal unmounted');
  }, []);

  return (
    <ThemeContext.Provider value="dark-blue">
      <View style={styles.demoContainer}>
        <Text style={styles.demoTitle}>Portal Demo</Text>
        <Text style={styles.demoSubtitle}>
          Portals content from the source tree into a separate target View
        </Text>

        {/* Controls */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, showPortal && styles.buttonDisabled]}
            onPress={handleMount}
            disabled={showPortal}>
            <Text style={styles.buttonText}>Mount Portal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, !showPortal && styles.buttonDisabled]}
            onPress={handleUnmount}
            disabled={!showPortal}>
            <Text style={styles.buttonText}>Unmount Portal</Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status}</Text>
        </View>

        {/* Source: where the portal is declared in the React tree */}
        <View style={styles.sourceBox}>
          <Text style={styles.boxLabel}>Source (React tree location)</Text>
          <Text style={styles.sourceNote}>
            The portal element lives here in the React tree, but its children
            render into the target View below.
          </Text>
          {showPortal && targetTag != null
            ? createPortal(<PortaledContent handleUnmount={handleUnmount} />, targetTag)
            : null}
        </View>

        {/* Target: where the portal content actually appears */}
        <View
          ref={targetRef}
          style={styles.targetBox}
          collapsable={false}>
          <Text style={styles.boxLabel}>
            Target (native container, tag: {targetTag ?? '?'})
          </Text>
          {/* Portal children will appear here natively */}
        </View>
      </View>
    </ThemeContext.Provider>
  );
};

// -------------------------------------------------------------------
// Same-root portal test: portal to the app's own root tag
// -------------------------------------------------------------------
const SameRootPortalTest = () => {
  const [show, setShow] = useState(false);
  const [rootTag, setRootTag] = useState < number | null > (null);
  const rootRef = React.useRef < React.ElementRef < typeof View > | null > (null);

  const handleToggle = useCallback(() => {
    if (!show) {
      const node = rootRef.current;
      const tag = node ? findNodeHandle(node) : null;
      if (tag != null) {
        setRootTag(tag);
        setShow(true);
      }
    } else {
      setShow(false);
      setRootTag(null);
    }
  }, [show]);

  return (
    <View style={styles.testSection}>
      <Text style={styles.testTitle}>Same-Container Portal Test</Text>
      <TouchableOpacity style={styles.button} onPress={handleToggle}>
        <Text style={styles.buttonText}>
          {show ? 'Hide' : 'Show'} Overlay
        </Text>
      </TouchableOpacity>

      <View ref={rootRef} style={styles.overlayTarget} collapsable={false}>
        <Text style={styles.overlayTargetText}>
          Overlay will appear on top of this view
        </Text>
        {show && rootTag != null
          ? createPortal(
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>
                Portal overlay (tag: {rootTag})
              </Text>
            </View>,
            rootTag,
          )
          : null}
      </View>
    </View>
  );
};

const RNTesterApp = (): React.Node => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>React Portals - Fixed</Text>
      <Text style={styles.subtitle}>
        containerInfo now wraps containerTag in {'{ containerTag, publicInstance }'}
      </Text>

      <View style={styles.scrollArea}>
        <PortalDemo />
        <SameRootPortalTest />
      </View>
    </View>
  );
};

export default RNTesterApp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ecca3',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#a0a0b0',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  demoContainer: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  demoSubtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4ecca3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  buttonDisabled: {
    backgroundColor: '#2a4a3a',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statusBox: {
    backgroundColor: '#0f3460',
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  statusText: {
    color: '#f0c040',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  sourceBox: {
    borderWidth: 1,
    borderColor: '#e94560',
    borderStyle: 'dashed',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  boxLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sourceNote: {
    fontSize: 12,
    color: '#ccc',
  },
  targetBox: {
    borderWidth: 2,
    borderColor: '#4ecca3',
    borderRadius: 6,
    padding: 12,
    minHeight: 80,
  },
  portaledBox: {
    backgroundColor: '#4ecca3',
    padding: 12,
    borderRadius: 4,
    marginTop: 6,
    backgroundColor: "red"
  },
  portaledText: {
    color: '#1a1a2e',
    fontWeight: 'bold',
    fontSize: 14,
  },
  portaledDetail: {
    color: '#16213e',
    fontSize: 12,
    marginTop: 4,
  },
  testSection: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  overlayTarget: {
    marginTop: 10,
    backgroundColor: '#0f3460',
    borderRadius: 6,
    padding: 20,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTargetText: {
    color: '#666',
    fontSize: 13,
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
    color: '#1a1a2e',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
