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

import type {SchemaType} from '../../CodegenSchema';

// File path -> contents
type FilesOutput = Map<string, string>;

const template = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

::_IMPORTS_::#include <react/components/::_LIBRARY_::/Props.h>
#include <react/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

::_COMPONENT_CLASSES_::

} // namespace react
} // namespace facebook
`;

const componentTemplate = `
extern const char ::_CLASSNAME_::ComponentName[];

/*
 * \`ShadowNode\` for <::_CLASSNAME_::> component.
 */
using ::_CLASSNAME_::ShadowNode = ConcreteViewShadowNode<
    ::_CLASSNAME_::ComponentName,
    ::_CLASSNAME_::Props::_EVENT_EMITTER_::>;
`.trim();

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    moduleSpecName: string,
  ): FilesOutput {
    const fileName = 'ShadowNodes.h';

    let hasAnyEvents = false;

    const moduleResults = Object.keys(schema.modules)
      .map(moduleName => {
        const components = schema.modules[moduleName].components;
        // No components in this module
        if (components == null) {
          return null;
        }

        return Object.keys(components)
          .map(componentName => {
            const component = components[componentName];
            if (component.interfaceOnly === true) {
              return;
            }

            const hasEvents = component.events.length > 0;

            if (hasEvents) {
              hasAnyEvents = true;
            }

            const eventEmitter = hasEvents
              ? `,\n${componentName}EventEmitter`
              : '';

            const replacedTemplate = componentTemplate
              .replace(/::_CLASSNAME_::/g, componentName)
              .replace('::_EVENT_EMITTER_::', eventEmitter);

            return replacedTemplate;
          })
          .join('\n\n');
      })
      .filter(Boolean)
      .join('\n\n');

    const eventEmitterImport = `#include <react/components/${libraryName}/EventEmitters.h>\n`;

    const replacedTemplate = template
      .replace(/::_COMPONENT_CLASSES_::/g, moduleResults)
      .replace('::_LIBRARY_::', libraryName)
      .replace('::_IMPORTS_::', hasAnyEvents ? eventEmitterImport : '');

    return new Map([[fileName, replacedTemplate]]);
  },
};
