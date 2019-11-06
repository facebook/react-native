/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import * as React from 'react';
import Text from '../../Text/Text';

import type {TextStyleProp} from '../../StyleSheet/StyleSheet';
import type {Message} from '../Data/parseLogBoxLog';

type Props = {
  message: Message,
  style: TextStyleProp,
  plaintext?: ?boolean,
};

const cleanContent = content => content.replace(/(Warning|Error): /g, '');

function LogBoxMessage(props: Props): React.Node {
  const {content, substitutions}: Message = props.message;

  if (props.plaintext === true) {
    return <Text>{content}</Text>;
  }

  const substitutionStyle: TextStyleProp = props.style;
  const elements = [];

  const lastOffset = substitutions.reduce((prevOffset, substitution, index) => {
    const key = String(index);

    if (substitution.offset > prevOffset) {
      const prevPart = content.substr(
        prevOffset,
        substitution.offset - prevOffset,
      );

      elements.push(<Text key={key}>{cleanContent(prevPart)}</Text>);
    }

    const substititionPart = content.substr(
      substitution.offset,
      substitution.length,
    );
    elements.push(
      <Text key={key + '.5'} style={substitutionStyle}>
        {cleanContent(substititionPart)}
      </Text>,
    );

    return substitution.offset + substitution.length;
  }, 0);

  if (lastOffset < content.length) {
    const lastPart = content.substr(lastOffset);
    elements.push(<Text key="-1">{cleanContent(lastPart)}</Text>);
  }

  return <>{elements}</>;
}

export default LogBoxMessage;
