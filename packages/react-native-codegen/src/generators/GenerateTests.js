/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {SchemaType} from '../CodegenSchema';

// File path -> contents
type FilesOutput = Map<string, string>;

const template = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

TEST(::_COMPONENT_NAME_::, etc) {

  ASSERT_EQ(true, true);
}
`;

module.exports = {
  generate(libraryName: string, schema: SchemaType): FilesOutput {
    const fileName = 'Tests.cpp';

    const replacedTemplate = template
      .replace('::_COMPONENT_NAME_::', libraryName)
      .trim();
    return new Map([[fileName, replacedTemplate]]);
  },
};
