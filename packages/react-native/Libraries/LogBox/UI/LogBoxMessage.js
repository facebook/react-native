/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TextStyleProp} from '../../StyleSheet/StyleSheet';
import type {Message} from '../Data/parseLogBoxLog';

import Linking from '../../Linking/Linking';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import * as React from 'react';

type Props = {
  message: Message,
  style: TextStyleProp,
  plaintext?: ?boolean,
  maxLength?: ?number,
  ...
};

type Range = {
  lowerBound: number,
  upperBound: number,
};

function getLinkRanges(string: string): $ReadOnlyArray<Range> {
  const regex = /https?:\/\/[^\s$.?#].[^\s]*/gi;
  const matches = [];

  let regexResult: RegExp$matchResult | null;
  while ((regexResult = regex.exec(string)) !== null) {
    if (regexResult != null) {
      matches.push({
        lowerBound: regexResult.index,
        upperBound: regex.lastIndex,
      });
    }
  }

  return matches;
}

function TappableLinks(props: {
  content: string,
  style: void | TextStyleProp,
}): React.Node {
  const matches = getLinkRanges(props.content);

  if (matches.length === 0) {
    // No URLs detected. Just return the content.
    return <Text style={props.style}>{props.content}</Text>;
  }

  // URLs were detected. Construct array of Text nodes.

  const fragments: Array<React.Node> = [];
  let indexCounter = 0;
  let startIndex = 0;

  for (const linkRange of matches) {
    if (startIndex < linkRange.lowerBound) {
      const text = props.content.substring(startIndex, linkRange.lowerBound);
      fragments.push(<Text key={++indexCounter}>{text}</Text>);
    }

    const link = props.content.substring(
      linkRange.lowerBound,
      linkRange.upperBound,
    );
    fragments.push(
      <Text
        onPress={() => {
          // $FlowFixMe[unused-promise]
          Linking.openURL(link);
        }}
        key={++indexCounter}
        style={styles.linkText}>
        {link}
      </Text>,
    );

    startIndex = linkRange.upperBound;
  }

  if (startIndex < props.content.length) {
    const text = props.content.substring(startIndex);
    fragments.push(
      <Text key={++indexCounter} style={props.style}>
        {text}
      </Text>,
    );
  }

  return <Text style={props.style}>{fragments}</Text>;
}

const cleanContent = (content: string) =>
  content.replace(/^(TransformError |Warning: (Warning: )?|Error: )/g, '');

function LogBoxMessage(props: Props): React.Node {
  const {content, substitutions}: Message = props.message;

  if (props.plaintext === true) {
    return <Text>{cleanContent(content)}</Text>;
  }

  const maxLength = props.maxLength != null ? props.maxLength : Infinity;
  const substitutionStyle: TextStyleProp = props.style;
  const elements = [];
  let length = 0;
  const createUnderLength = (
    key: string,
    message: string,
    style: void | TextStyleProp,
  ) => {
    let cleanMessage = cleanContent(message);

    if (props.maxLength != null) {
      cleanMessage = cleanMessage.slice(0, props.maxLength - length);
    }

    if (length < maxLength) {
      elements.push(
        <TappableLinks content={cleanMessage} key={key} style={style} />,
      );
    }

    length += cleanMessage.length;
  };

  const lastOffset = substitutions.reduce((prevOffset, substitution, index) => {
    const key = String(index);

    if (substitution.offset > prevOffset) {
      const prevPart = content.slice(prevOffset, substitution.offset);

      createUnderLength(key, prevPart);
    }

    const substitutionPart = content.slice(
      substitution.offset,
      substitution.offset + substitution.length,
    );

    createUnderLength(key + '.5', substitutionPart, substitutionStyle);
    return substitution.offset + substitution.length;
  }, 0);

  if (lastOffset < content.length) {
    const lastPart = content.slice(lastOffset);
    createUnderLength('-1', lastPart);
  }

  return <>{elements}</>;
}

const styles = StyleSheet.create({
  linkText: {
    textDecorationLine: 'underline',
  },
});

export default LogBoxMessage;
