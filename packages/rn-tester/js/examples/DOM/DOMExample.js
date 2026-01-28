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

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import DOMRect from 'react-native/src/private/webapis/geometry/DOMRect';

function GetBoundingClientRectExample(): React.Node {
  const [viewRect, setViewRect] = useState<?DOMRect>(null);
  const [textRect, setTextRect] = useState<?DOMRect>(null);

  return (
    <View style={styles.container}>
      <View
        style={styles.box}
        ref={el => {
          const rect = el?.getBoundingClientRect();
          if (rect != null && !rectsEqual(rect, viewRect)) {
            setViewRect(rect);
          }
        }}>
        <Text>View Element</Text>
      </View>
      {viewRect != null && (
        <RNTesterText style={styles.result}>
          View: x={viewRect.x.toFixed(2)}, y={viewRect.y.toFixed(2)}, width=
          {viewRect.width.toFixed(2)}, height={viewRect.height.toFixed(2)}
        </RNTesterText>
      )}

      <Text
        style={styles.textBox}
        ref={el => {
          const rect = el?.getBoundingClientRect();
          if (rect != null && !rectsEqual(rect, textRect)) {
            setTextRect(rect);
          }
        }}>
        Text Element
      </Text>
      {textRect != null && (
        <RNTesterText style={styles.result}>
          Text: x={textRect.x.toFixed(2)}, y={textRect.y.toFixed(2)}, width=
          {textRect.width.toFixed(2)}, height={textRect.height.toFixed(2)}
        </RNTesterText>
      )}
    </View>
  );
}

function GetClientRectsNestedTextExample(): React.Node {
  const [paragraphRect, setParagraphRect] = useState<?DOMRect>(null);
  const [nestedRect, setNestedRect] = useState<?DOMRect>(null);
  const [clientRects, setClientRects] = useState<$ReadOnlyArray<DOMRect>>([]);

  // Calculate the base Y offset from the first fragment to position overlays correctly
  // The fragment rects have a consistent offset that we correct by using relative positioning
  const firstFragmentY = clientRects.length > 0 ? clientRects[0].y : 0;

  return (
    <View style={styles.container}>
      <RNTesterText style={styles.description}>
        This example demonstrates getClientRects() for nested Text components.
        The nested text spans multiple lines and getClientRects() returns a rect
        for each line fragment. Red overlays show each fragment.
      </RNTesterText>

      <View style={styles.paragraphWrapper}>
        <Text
          style={styles.paragraph}
          ref={el => {
            const rect = el?.getBoundingClientRect();
            if (rect != null && !rectsEqual(rect, paragraphRect)) {
              setParagraphRect(rect);
            }
          }}>
          This is the start of the paragraph.{' '}
          <Text
            style={styles.nestedText}
            ref={el => {
              const rect = el?.getBoundingClientRect();
              if (rect != null && !rectsEqual(rect, nestedRect)) {
                setNestedRect(rect);
              }
              // $FlowFixMe[prop-missing] - getClientRects is newly added
              const rects = el?.getClientRects();
              if (rects != null && rects.length !== clientRects.length) {
                setClientRects(rects);
              }
            }}>
            This nested text wraps across multiple lines and each line gets its
            own client rect from getClientRects
          </Text>{' '}
          and this is the end.
        </Text>
        {paragraphRect != null &&
          clientRects.map((rect, index) => (
            <View
              key={index}
              style={[
                styles.fragmentOverlay,
                {
                  // Position relative to paragraph, using first fragment as Y reference
                  left: rect.x - paragraphRect.x,
                  top: rect.y - firstFragmentY,
                  width: rect.width,
                  height: rect.height,
                },
              ]}
            />
          ))}
      </View>

      <RNTesterText style={styles.sectionHeader}>
        getBoundingClientRect() Results
      </RNTesterText>
      {paragraphRect != null && (
        <RNTesterText style={styles.result}>
          Paragraph: x={paragraphRect.x.toFixed(2)}, y=
          {paragraphRect.y.toFixed(2)}, w={paragraphRect.width.toFixed(2)}, h=
          {paragraphRect.height.toFixed(2)}
        </RNTesterText>
      )}
      {nestedRect != null && (
        <RNTesterText style={styles.result}>
          Nested: x={nestedRect.x.toFixed(2)}, y={nestedRect.y.toFixed(2)}, w=
          {nestedRect.width.toFixed(2)}, h={nestedRect.height.toFixed(2)}
        </RNTesterText>
      )}
      <RNTesterText style={styles.note}>
        Note: getBoundingClientRect() returns the same rect for nested text as
        the parent paragraph.
      </RNTesterText>

      <RNTesterText style={styles.sectionHeader}>
        getClientRects() Results
      </RNTesterText>
      <RNTesterText style={styles.result}>
        Fragment count: {clientRects.length}
      </RNTesterText>
      {clientRects.map((rect, index) => (
        <RNTesterText key={index} style={styles.result}>
          Fragment {index}: x={rect.x.toFixed(2)}, y={rect.y.toFixed(2)}, w=
          {rect.width.toFixed(2)}, h={rect.height.toFixed(2)}
        </RNTesterText>
      ))}
      <RNTesterText style={styles.note}>
        Each fragment represents a separate line of the nested text. Red
        overlays visualize the fragment boundaries.
      </RNTesterText>
    </View>
  );
}

function GetClientRectsViewExample(): React.Node {
  const [containerRect, setContainerRect] = useState<?DOMRect>(null);
  const [viewRect, setViewRect] = useState<?DOMRect>(null);
  const [clientRects, setClientRects] = useState<$ReadOnlyArray<DOMRect>>([]);

  return (
    <View
      style={styles.container}
      ref={el => {
        const rect = el?.getBoundingClientRect();
        if (rect != null && !rectsEqual(rect, containerRect)) {
          setContainerRect(rect);
        }
      }}>
      <RNTesterText style={styles.description}>
        For View elements, getClientRects() returns a single rect equivalent to
        getBoundingClientRect().
      </RNTesterText>
      <View
        style={styles.box}
        ref={el => {
          const rect = el?.getBoundingClientRect();
          if (rect != null && !rectsEqual(rect, viewRect)) {
            setViewRect(rect);
          }
          // $FlowFixMe[prop-missing] - getClientRects is newly added
          const rects = el?.getClientRects();
          if (rects != null && rects.length !== clientRects.length) {
            setClientRects(rects);
          }
        }}>
        <Text>View with getClientRects()</Text>
      </View>

      {viewRect != null && (
        <RNTesterText style={styles.result}>
          getBoundingClientRect(): x={viewRect.x.toFixed(2)}, y=
          {viewRect.y.toFixed(2)}, w={viewRect.width.toFixed(2)}, h=
          {viewRect.height.toFixed(2)}
        </RNTesterText>
      )}

      <RNTesterText style={styles.result}>
        getClientRects() count: {clientRects.length}
      </RNTesterText>
      {clientRects.map((rect, index) => (
        <RNTesterText key={index} style={styles.result}>
          Rect {index}: x={rect.x.toFixed(2)}, y={rect.y.toFixed(2)}, w=
          {rect.width.toFixed(2)}, h={rect.height.toFixed(2)}
        </RNTesterText>
      ))}
    </View>
  );
}

function rectsEqual(a: ?DOMRect, b: ?DOMRect): boolean {
  if (a == null || b == null) {
    return a === b;
  }
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  box: {
    backgroundColor: '#e0e0e0',
    padding: 20,
    marginBottom: 10,
    borderRadius: 4,
  },
  textBox: {
    backgroundColor: '#d0e0f0',
    padding: 10,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  nestedText: {
    textDecorationLine: 'underline',
    color: '#0066cc',
  },
  description: {
    marginBottom: 12,
    color: '#666',
  },
  sectionHeader: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  result: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  note: {
    fontStyle: 'italic',
    color: '#888',
    marginTop: 8,
    fontSize: 12,
  },
  paragraphWrapper: {
    // Container for paragraph and overlays
  },
  fragmentOverlay: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.5)',
  },
});

exports.title = 'DOM';
exports.category = 'Basic';
exports.documentationURL = 'https://reactnative.dev/docs/direct-manipulation';
exports.description = 'DOM APIs for measuring and querying elements';
exports.examples = ([
  {
    title: 'getBoundingClientRect()',
    name: 'getBoundingClientRect',
    description:
      'Returns the bounding rectangle of an element relative to the viewport.',
    render(): React.Node {
      return <GetBoundingClientRectExample />;
    },
  },
  {
    title: 'getClientRects() - Nested Text',
    name: 'getClientRectsNestedText',
    description:
      'Returns individual rectangles for each line fragment of nested text.',
    render(): React.Node {
      return <GetClientRectsNestedTextExample />;
    },
  },
  {
    title: 'getClientRects() - View',
    name: 'getClientRectsView',
    description:
      'For View elements, getClientRects() returns a single rect matching getBoundingClientRect().',
    render(): React.Node {
      return <GetClientRectsViewExample />;
    },
  },
]: Array<RNTesterModuleExample>);
