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

type FilesOutput = Map<string, string>;

const template = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsireact/TurboModule.h>

namespace facebook {
namespace react {

::_CLASS_DEFINITION_::
protected:
::_PROPERTIES_MAP_::

public:
::_MODULE_PROPERTIES_::

} // namespace react
} // namespace facebook
`;

module.exports = {
  generate(libraryName: string, schema: SchemaType): FilesOutput {
    const fileName = `${libraryName}.cpp`;

    const moduleProperties = '';

    const replacedTemplate = template
      .replace(/::_MODULE_PROPERTIES_::/g, moduleProperties)
      .replace('::_MODULE_NAME_::', libraryName)
      .replace('::_CLASS_DEFINITION_::', '')
      .replace('::_PROPERTIES_MAP_::', '');

    return new Map([[fileName, replacedTemplate]]);
  },
};
