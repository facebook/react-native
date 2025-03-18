/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import * as React from 'react';
import {
  PixelRatio,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  Touchable,
  View,
  useWindowDimensions,
} from 'react-native';

const emojiRegex =
  /[\p{Extended_Pictographic}\u200d\u{1f1e6}-\u{1f1ff}\u{1f3fb}-\u{1f3ff}\u{e0020}-\u{e007f}\u20E3\uFE0F]|[#*0-9]\uFE0F?\u20E3/gu;

const CONST = {
  REGEX: {
    EMOJI: emojiRegex,
    // $FlowIgnore
    get SPACE_OR_EMOJI() {
      return new RegExp(`(\\s+|(?:${emojiRegex.source})+)`, 'gu');
    },
  },
};

function getValueUsingPixelRatio(
  defaultValue: number,
  maxValue: number,
): number {
  return PixelRatio.getFontScale() * defaultValue > maxValue
    ? maxValue
    : defaultValue * PixelRatio.getFontScale();
}
const fontSizeToWidthRatio = getValueUsingPixelRatio(0.8, 1);

// $FlowIgnore
type InlineCodeBlockProps = {children?: any};

function getTextMatrix(text: string): string[][] {
  return text
    .split('\n')
    .map(row =>
      row.split(CONST.REGEX.SPACE_OR_EMOJI).filter(value => value !== ''),
    );
}

function splitLongWord(word: string, maxLength: number): string[] {
  if (word.length <= maxLength) {
    return [word];
  }

  return word.match(new RegExp(`.{1,${maxLength}}`, 'g')) ?? [];
}

function InlineCodeBlock({children}: InlineCodeBlockProps) {
  const {width: windowWidth} = useWindowDimensions();

  const childrenString = typeof children === 'string' ? children : '';
  const charsPerLine = React.useMemo(
    () =>
      Math.floor(
        windowWidth /
          (styles.inlineCodeBlockText.fontSize * fontSizeToWidthRatio),
      ),
    [windowWidth],
  );

  const textMatrix = getTextMatrix(childrenString).map(row =>
    row.flatMap(word => splitLongWord(word, charsPerLine)),
  ) as string[][];

  if (typeof children !== 'string') {
    return null;
  }

  return textMatrix.map((rowText, rowIndex) => (
    <React.Fragment key={`${rowText[0]}-${rowIndex}`}>
      {rowText.map((colText, colIndex) => (
        // Outer View is important to vertically center the Text
        <View
          key={`${colText}-${colIndex}`}
          style={styles.inlineCodeBlockWrapper}>
          <View
            style={[
              styles.inlineCodeBlockContainer,
              colIndex === 0 && styles.inlineCodeBlockFirstWord,
              colIndex === rowText.length - 1 && styles.inlineCodeBlockLastWord,
            ]}>
            <Text style={[styles.inlineCodeBlockText]}>{colText}</Text>
          </View>
        </View>
      ))}
    </React.Fragment>
  ));
}

function Playground() {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <View style={styles.rootContainer}>
      <StatusBar
        barStyle={'dark-content'}
        backgroundColor={styles.rootContainer.backgroundColor}
      />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}>
        {/* <Text style={[styles.text, styles.greenOverlay]}>
          Text without nested text.
        </Text>

        <View style={styles.spacing} />

        <Text style={[styles.text, styles.greenOverlay]}>
          Text without nested text with emoji 🚀.
        </Text>

        <View style={styles.spacing} />

        <Text style={[styles.text, styles.greenOverlay]}>
          Text with{' '}
          <Text style={[styles.redText, styles.redOverlay]}>nested text</Text>.
        </Text>

        <View style={styles.spacing} />

        <Text style={[styles.text, styles.greenOverlay]}>
          Text with{' '}
          <Text style={[styles.redText, styles.redOverlay]}>
            nested text with emoji 🚀
          </Text>
          .
        </Text>

        <View style={styles.spacing} /> */}

        <Pressable
          onPress={() => {
            setIsVisible(!isVisible);
          }}>
          <View style={[styles.spacing, styles.blueOverlay]} />
        </Pressable>
        {isVisible && (
          <Text style={[styles.text, styles.greenOverlay]}>
            Text with nested empty view{' '}
            <View style={[styles.emptyView, styles.redOverlay]} />.
          </Text>
        )}

        {/* <View style={styles.spacing} />

        <Text style={[styles.text, styles.greenOverlay]}>
          Text with{' '}
          <View style={[styles.inlineCodeBlockWrapper, styles.redOverlay]}>
            <Text style={[styles.text, styles.redText, styles.redOverlay]}>
              nested view and text
            </Text>
          </View>
          .
        </Text>

        <View style={styles.spacing} />

        <Text style={[styles.text, styles.greenOverlay]}>
          Text with{' '}
          <View style={[styles.inlineCodeBlockWrapper, styles.redOverlay]}>
            <Text style={[styles.text, styles.redText, styles.redOverlay]}>
              nested view and text with emoji 🚀
            </Text>
          </View>
          .
        </Text>

        <View style={styles.spacing} />

        <Text style={[styles.text, styles.greenOverlay]}>
          Text with <InlineCodeBlock>nested view and text</InlineCodeBlock>.
        </Text>

        <View style={styles.spacing} />

        <Text style={[styles.text, styles.greenOverlay]}>
          Text with{' '}
          <InlineCodeBlock>nested view and text with emoji 🚀</InlineCodeBlock>.
        </Text>

        <View style={styles.spacing} />

        <Text style={[styles.text, styles.greenOverlay]}>
          Lorem ipsum dolor sit amet,{' '}
          <InlineCodeBlock>
            consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
            labore et dolore magna aliqua
          </InlineCodeBlock>
          . Ut enim ad minim veniam, quis{' '}
          <InlineCodeBlock>nostrud</InlineCodeBlock> exercitation{' '}
          <InlineCodeBlock>ullamco 🚀</InlineCodeBlock> laboris{' '}
          <InlineCodeBlock>nisi</InlineCodeBlock> ut{' '}
          <InlineCodeBlock>aliquip</InlineCodeBlock> ex ea commodo{' '}
          <InlineCodeBlock>consequat</InlineCodeBlock>. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. <InlineCodeBlock>Ex</InlineCodeBlock>
          <InlineCodeBlock>ce</InlineCodeBlock>pteur sint oc
          <InlineCodeBlock>c</InlineCodeBlock>a
          <InlineCodeBlock>e</InlineCodeBlock>cat cupidatat non proident,{' '}
          <InlineCodeBlock>sunt in</InlineCodeBlock> culpa{' '}
          <InlineCodeBlock>qui officia</InlineCodeBlock>{' '}
          <InlineCodeBlock>deserunt mollit</InlineCodeBlock> anim id est
          laborum.
        </Text> */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  scrollContainer: {},
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },

  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  redText: {
    color: '#FF0000',
  },

  emptyView: {
    width: 20,
    height: 20,
  },

  inlineCodeBlockWrapper: {
    height: 20,
  },
  inlineCodeBlockContainer: {
    backgroundColor: '#072419',
    borderColor: '#FF0000',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  inlineCodeBlockFirstWord: {
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    borderLeftWidth: 1,
    paddingLeft: 5,
  },
  inlineCodeBlockLastWord: {
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    borderRightWidth: 1,
    paddingRight: 5,
  },
  inlineCodeBlockText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#E7ECE9',
  },

  spacing: {
    height: 30,
  },

  greenOverlay: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
  },
  redOverlay: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  blueOverlay: {
    backgroundColor: 'rgba(0, 0, 255, 0.2)',
  },
});

export default ({
  title: 'Playground',
  name: 'playground',
  render: (): React.Node => <Playground />,
}: RNTesterModuleExample);
