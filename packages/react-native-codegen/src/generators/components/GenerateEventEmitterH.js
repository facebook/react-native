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

const nullthrows = require('nullthrows');

const {
  getCppTypeForAnnotation,
  toSafeCppString,
  generateStructName,
} = require('./CppHelpers.js');

import type {
  ComponentShape,
  EventTypeShape,
  ObjectPropertyType,
  SchemaType,
} from '../../CodegenSchema';

// File path -> contents
type FilesOutput = Map<string, string>;
type StructsMap = Map<string, string>;

type ComponentCollection = $ReadOnly<{
  [component: string]: ComponentShape,
  ...,
}>;

const template = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <react/components/view/ViewEventEmitter.h>

namespace facebook {
namespace react {

::_COMPONENT_EMITTERS_::

} // namespace react
} // namespace facebook
`;

const componentTemplate = `
::_STRUCTS_::

class ::_CLASSNAME_::EventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  ::_EVENTS_::
};
`.trim();

const structTemplate = `
struct ::_STRUCT_NAME_:: {
  ::_FIELDS_::
};
`.trim();

const enumTemplate = `enum class ::_ENUM_NAME_:: {
  ::_VALUES_::
};

inline char const *toString(const ::_ENUM_NAME_:: value) {
  switch (value) {
    ::_TO_CASES_::
  }
}`.trim();

function getNativeTypeFromAnnotation(
  componentName: string,
  eventProperty: ObjectPropertyType,
  nameParts: $ReadOnlyArray<string>,
): string {
  const type = eventProperty.type;

  switch (type) {
    case 'BooleanTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'DoubleTypeAnnotation':
    case 'FloatTypeAnnotation':
      return getCppTypeForAnnotation(type);
    case 'StringEnumTypeAnnotation':
      return generateStructName(
        componentName,
        nameParts.concat([eventProperty.name]),
      );
    case 'ObjectTypeAnnotation':
      return generateStructName(
        componentName,
        nameParts.concat([eventProperty.name]),
      );
    default:
      (type: empty);
      throw new Error(`Received invalid event property type ${type}`);
  }
}
function generateEnum(structs, componentName, options, nameParts) {
  const structName = generateStructName(componentName, nameParts);
  const fields = options
    .map((option, index) => `${toSafeCppString(option.name)}`)
    .join(',\n  ');

  const toCases = options
    .map(
      option =>
        `case ${structName}::${toSafeCppString(option.name)}: return "${
          option.name
        }";`,
    )
    .join('\n' + '    ');

  structs.set(
    structName,
    enumTemplate
      .replace(/::_ENUM_NAME_::/g, structName)
      .replace('::_VALUES_::', fields)
      .replace('::_TO_CASES_::', toCases),
  );
}

function generateStruct(
  structs: StructsMap,
  componentName: string,
  nameParts: $ReadOnlyArray<string>,
  properties: $ReadOnlyArray<ObjectPropertyType>,
): void {
  const structNameParts = nameParts;
  const structName = generateStructName(componentName, structNameParts);

  const fields = properties
    .map(property => {
      return `${getNativeTypeFromAnnotation(
        componentName,
        property,
        structNameParts,
      )} ${property.name};`;
    })
    .join('\n' + '  ');

  properties.forEach((property: ObjectPropertyType) => {
    const name = property.name;
    switch (property.type) {
      case 'BooleanTypeAnnotation':
      case 'StringTypeAnnotation':
      case 'Int32TypeAnnotation':
      case 'DoubleTypeAnnotation':
      case 'FloatTypeAnnotation':
        return;
      case 'ObjectTypeAnnotation':
        generateStruct(
          structs,
          componentName,
          nameParts.concat([name]),
          nullthrows(property.properties),
        );
        return;
      case 'StringEnumTypeAnnotation':
        generateEnum(
          structs,
          componentName,
          property.options,
          nameParts.concat([name]),
        );
        return;
      default:
        (property: empty);
        throw new Error(
          `Received invalid event property type ${property.type}`,
        );
    }
  });

  structs.set(
    structName,
    structTemplate
      .replace('::_STRUCT_NAME_::', structName)
      .replace('::_FIELDS_::', fields),
  );
}

function generateStructs(componentName: string, component): string {
  const structs: StructsMap = new Map();

  component.events.forEach(event => {
    if (event.typeAnnotation.argument) {
      generateStruct(
        structs,
        componentName,
        [event.name],
        event.typeAnnotation.argument.properties,
      );
    }
  });

  return Array.from(structs.values()).join('\n\n');
}

function generateEvent(componentName: string, event: EventTypeShape): string {
  if (event.typeAnnotation.argument) {
    const structName = generateStructName(componentName, [event.name]);

    return `void ${event.name}(${structName} value) const;`;
  }

  return `void ${event.name}() const;`;
}
function generateEvents(componentName: string, component): string {
  return component.events
    .map(event => generateEvent(componentName, event))
    .join('\n\n' + '  ');
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    moduleSpecName: string,
  ): FilesOutput {
    const moduleComponents: ComponentCollection = Object.keys(schema.modules)
      .map(moduleName => {
        const components = schema.modules[moduleName].components;
        // No components in this module
        if (components == null) {
          return null;
        }

        return components;
      })
      .filter(Boolean)
      .reduce((acc, components) => Object.assign(acc, components), {});

    const moduleComponentsWithEvents = Object.keys(moduleComponents).filter(
      componentName => moduleComponents[componentName].events.length > 0,
    );

    const fileName = 'EventEmitters.h';

    const componentEmitters =
      moduleComponentsWithEvents.length > 0
        ? Object.keys(moduleComponents)
            .map(componentName => {
              const component = moduleComponents[componentName];

              const replacedTemplate = componentTemplate
                .replace(/::_CLASSNAME_::/g, componentName)
                .replace(
                  '::_STRUCTS_::',
                  generateStructs(componentName, component),
                )
                .replace(
                  '::_EVENTS_::',
                  generateEvents(componentName, component),
                )
                .trim();

              return replacedTemplate;
            })
            .join('\n')
        : '';

    const replacedTemplate = template.replace(
      /::_COMPONENT_EMITTERS_::/g,
      componentEmitters,
    );

    return new Map([[fileName, replacedTemplate]]);
  },
};
