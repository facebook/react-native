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

const React = require('React');
const Text = require('Text');
const UTFSequence = require('UTFSequence');

const stringifySafe = require('stringifySafe');

import type {TextStyleProp} from 'StyleSheet';

export type Category = string;
export type Message = $ReadOnly<{|
  content: string,
  substitutions: $ReadOnlyArray<
    $ReadOnly<{|
      length: number,
      offset: number,
    |}>,
  >,
|}>;

const SUBSTITUTION = UTFSequence.BOM + '%s';

const YellowBoxCategory = {
  parse(
    args: $ReadOnlyArray<mixed>,
  ): $ReadOnly<{|
    category: Category,
    message: Message,
  |}> {
    const categoryParts = [];
    const contentParts = [];
    const substitutionOffsets = [];

    const remaining = [...args];

    if (typeof remaining[0] === 'string') {
      const formatString = String(remaining.shift());
      const formatStringParts = formatString.split('%s');
      const substitutionCount = formatStringParts.length - 1;
      const substitutions = remaining.splice(0, substitutionCount);

      let categoryString = '';
      let contentString = '';

      let substitutionIndex = 0;
      for (const formatStringPart of formatStringParts) {
        categoryString += formatStringPart;
        contentString += formatStringPart;

        if (substitutionIndex < substitutionCount) {
          if (substitutionIndex < substitutions.length) {
            const substitution = stringifySafe(
              substitutions[substitutionIndex],
            );
            substitutionOffsets.push({
              length: substitution.length,
              offset: contentString.length,
            });

            categoryString += SUBSTITUTION;
            contentString += substitution;
          } else {
            substitutionOffsets.push({
              length: 2,
              offset: contentString.length,
            });

            categoryString += '%s';
            contentString += '%s';
          }

          substitutionIndex++;
        }
      }

      categoryParts.push(categoryString);
      contentParts.push(contentString);
    }

    const remainingArgs = remaining.map(stringifySafe);
    categoryParts.push(...remainingArgs);
    contentParts.push(...remainingArgs);

    return {
      category: categoryParts.join(' '),
      message: {
        content: contentParts.join(' '),
        substitutions: substitutionOffsets,
      },
    };
  },

  render(
    {content, substitutions}: Message,
    substitutionStyle: TextStyleProp,
  ): React.Node {
    const elements = [];

    const lastOffset = substitutions.reduce(
      (prevOffset, substitution, index) => {
        const key = String(index);

        if (substitution.offset > prevOffset) {
          const prevPart = content.substr(
            prevOffset,
            substitution.offset - prevOffset,
          );
          elements.push(<Text key={key}>{prevPart}</Text>);
        }

        const substititionPart = content.substr(
          substitution.offset,
          substitution.length,
        );
        elements.push(
          <Text key={key + '.5'} style={substitutionStyle}>
            {substititionPart}
          </Text>,
        );

        return substitution.offset + substitution.length;
      },
      0,
    );

    if (lastOffset < content.length) {
      const lastPart = content.substr(lastOffset);
      elements.push(<Text key="-1">{lastPart}</Text>);
    }

    return elements;
  },
};

module.exports = YellowBoxCategory;
