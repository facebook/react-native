/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {SchemaType} from '@react-native/codegen/src/CodegenSchema';

import {FlowParser} from '@react-native/codegen/src/parsers/flow/parser';
import path from 'path';

const flowParser = new FlowParser();

export function getTestSchema(
  ...filenameComponents: Array<string>
): SchemaType {
  const filename = path.join(...filenameComponents);

  const schema = flowParser.parseFile(filename);

  return schema;
}
