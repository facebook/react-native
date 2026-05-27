/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {formatDiffSet} from '../ErrorFormatting.js';
import {buildSchemaDiff, summarizeDiffSet} from '../VersionDiffing.js';
import {incompatibleChanges, okayChanges} from './ErrorFormattingTests.js';
import {getTestSchema} from './utilities/getTestSchema.js';

describe('codegen formattedSummarizeDiffSet', () => {
  okayChanges.forEach(([after, before]) => {
    it(`allows a diff from ${before} to ${after}`, () => {
      const beforeObj = getTestSchema(
        __dirname,
        '__fixtures__',
        before + '.js.flow',
      );

      const afterObj = getTestSchema(
        __dirname,
        '__fixtures__',
        after + '.js.flow',
      );

      const result = formatDiffSet(
        summarizeDiffSet(buildSchemaDiff(afterObj, beforeObj)),
      );

      expect(result.status).toEqual('ok');

      expect(result).toMatchSnapshot();
    });
  });

  incompatibleChanges.forEach(([after, before]) => {
    it(`reports a diff from ${before} to ${after}`, () => {
      const beforeObj = getTestSchema(
        __dirname,
        '__fixtures__',
        before + '.js.flow',
      );

      const afterObj = getTestSchema(
        __dirname,
        '__fixtures__',
        after + '.js.flow',
      );

      const result = formatDiffSet(
        summarizeDiffSet(buildSchemaDiff(afterObj, beforeObj)),
      );

      expect(result.status).toEqual('incompatible');

      expect(result).toMatchSnapshot();
    });
  });
});
