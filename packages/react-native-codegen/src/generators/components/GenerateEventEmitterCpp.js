/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';
import type {EventTypeShape} from '../../CodegenSchema';
import type {
  ComponentShape,
  EventTypeAnnotation,
  NamedShape,
  ObjectTypeAnnotation,
  SchemaType,
} from '../../CodegenSchema';

const {indent} = require('../Utils');
const {IncludeTemplate, generateEventStructName} = require('./CppHelpers');

// File path -> contents
type FilesOutput = Map<string, string>;

type ComponentCollection = $ReadOnly<{
  [component: string]: ComponentShape,
  ...
}>;

const FileTemplate = ({
  events,
  extraIncludes,
  headerPrefix,
}: {
  events: string,
  extraIncludes: Set<string>,
  headerPrefix: string,
}) => `
/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * ${'@'}generated by codegen project: GenerateEventEmitterCpp.js
 */

${IncludeTemplate({headerPrefix, file: 'EventEmitters.h'})}
${[...extraIncludes].join('\n')}

namespace facebook::react {
${events}
} // namespace facebook::react
`;

const ComponentTemplate = ({
  className,
  eventName,
  structName,
  dispatchEventName,
  implementation,
}: {
  className: string,
  eventName: string,
  structName: string,
  dispatchEventName: string,
  implementation: string,
}) => {
  const capture = implementation.includes('event')
    ? 'event=std::move(event)'
    : '';
  return `
void ${className}EventEmitter::${eventName}(${structName} event) const {
  dispatchEvent("${dispatchEventName}", [${capture}](jsi::Runtime &runtime) {
    ${implementation}
  });
}
`;
};

const BasicComponentTemplate = ({
  className,
  eventName,
  dispatchEventName,
}: {
  className: string,
  eventName: string,
  dispatchEventName: string,
}) =>
  `
void ${className}EventEmitter::${eventName}() const {
  dispatchEvent("${dispatchEventName}");
}
`.trim();

function generateSetter(
  variableName: string,
  propertyName: string,
  propertyParts: $ReadOnlyArray<string>,
  usingEvent: boolean,
  valueMapper: string => string = value => value,
) {
  const eventChain = usingEvent
    ? `event.${[...propertyParts, propertyName].join('.')}`
    : [...propertyParts, propertyName].join('.');
  return `${variableName}.setProperty(runtime, "${propertyName}", ${valueMapper(
    eventChain,
  )});`;
}

function generateObjectSetter(
  variableName: string,
  propertyName: string,
  propertyParts: $ReadOnlyArray<string>,
  typeAnnotation: ObjectTypeAnnotation<EventTypeAnnotation>,
  extraIncludes: Set<string>,
  usingEvent: boolean,
) {
  return `
{
  auto ${propertyName} = jsi::Object(runtime);
  ${indent(
    generateSetters(
      propertyName,
      typeAnnotation.properties,
      propertyParts.concat([propertyName]),
      extraIncludes,
      usingEvent,
    ),
    2,
  )}
  ${variableName}.setProperty(runtime, "${propertyName}", ${propertyName});
}
`.trim();
}

function setValueAtIndex(
  propertyName: string,
  indexVariable: string,
  loopLocalVariable: string,
  mappingFunction: string => string = value => value,
) {
  return `${propertyName}.setValueAtIndex(runtime, ${indexVariable}++, ${mappingFunction(
    loopLocalVariable,
  )});`;
}

function generateArraySetter(
  variableName: string,
  propertyName: string,
  propertyParts: $ReadOnlyArray<string>,
  elementType: EventTypeAnnotation,
  extraIncludes: Set<string>,
  usingEvent: boolean,
): string {
  const eventChain = usingEvent
    ? `event.${[...propertyParts, propertyName].join('.')}`
    : [...propertyParts, propertyName].join('.');
  const indexVar = `${propertyName}Index`;
  const innerLoopVar = `${propertyName}Value`;
  return `
    auto ${propertyName} = jsi::Array(runtime, ${eventChain}.size());
    size_t ${indexVar} = 0;
    for (auto ${innerLoopVar} : ${eventChain}) {
      ${handleArrayElementType(
        elementType,
        propertyName,
        indexVar,
        innerLoopVar,
        propertyParts,
        extraIncludes,
        usingEvent,
      )}
    }
    ${variableName}.setProperty(runtime, "${propertyName}", ${propertyName});
  `;
}

function handleArrayElementType(
  elementType: EventTypeAnnotation,
  propertyName: string,
  indexVariable: string,
  loopLocalVariable: string,
  propertyParts: $ReadOnlyArray<string>,
  extraIncludes: Set<string>,
  usingEvent: boolean,
): string {
  switch (elementType.type) {
    case 'BooleanTypeAnnotation':
      return setValueAtIndex(
        propertyName,
        indexVariable,
        loopLocalVariable,
        val => `(bool)${val}`,
      );
    case 'StringTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'DoubleTypeAnnotation':
    case 'FloatTypeAnnotation':
      return setValueAtIndex(propertyName, indexVariable, loopLocalVariable);
    case 'MixedTypeAnnotation':
      return setValueAtIndex(
        propertyName,
        indexVariable,
        loopLocalVariable,
        val => `jsi::valueFromDynamic(runtime, ${val})`,
      );
    case 'StringLiteralUnionTypeAnnotation':
      return setValueAtIndex(
        propertyName,
        indexVariable,
        loopLocalVariable,
        val => `toString(${val})`,
      );
    case 'ObjectTypeAnnotation':
      return convertObjectTypeArray(
        propertyName,
        indexVariable,
        loopLocalVariable,
        propertyParts,
        elementType,
        extraIncludes,
      );
    case 'ArrayTypeAnnotation':
      return convertArrayTypeArray(
        propertyName,
        indexVariable,
        loopLocalVariable,
        propertyParts,
        elementType,
        extraIncludes,
        usingEvent,
      );
    default:
      throw new Error(
        `Received invalid elementType for array ${elementType.type}`,
      );
  }
}

function convertObjectTypeArray(
  propertyName: string,
  indexVariable: string,
  loopLocalVariable: string,
  propertyParts: $ReadOnlyArray<string>,
  objectTypeAnnotation: ObjectTypeAnnotation<EventTypeAnnotation>,
  extraIncludes: Set<string>,
): string {
  return `auto ${propertyName}Object = jsi::Object(runtime);
      ${generateSetters(
        `${propertyName}Object`,
        objectTypeAnnotation.properties,
        [].concat([loopLocalVariable]),
        extraIncludes,
        false,
      )}
      ${setValueAtIndex(propertyName, indexVariable, `${propertyName}Object`)}`;
}

function convertArrayTypeArray(
  propertyName: string,
  indexVariable: string,
  loopLocalVariable: string,
  propertyParts: $ReadOnlyArray<string>,
  eventTypeAnnotation: EventTypeAnnotation,
  extraIncludes: Set<string>,
  usingEvent: boolean,
): string {
  if (eventTypeAnnotation.type !== 'ArrayTypeAnnotation') {
    throw new Error(
      `Inconsistent eventTypeAnnotation received. Expected type = 'ArrayTypeAnnotation'; received = ${eventTypeAnnotation.type}`,
    );
  }
  return `auto ${propertyName}Array = jsi::Array(runtime, ${loopLocalVariable}.size());
      size_t ${indexVariable}Internal = 0;
      for (auto ${loopLocalVariable}Internal : ${loopLocalVariable}) {
        ${handleArrayElementType(
          eventTypeAnnotation.elementType,
          `${propertyName}Array`,
          `${indexVariable}Internal`,
          `${loopLocalVariable}Internal`,
          propertyParts,
          extraIncludes,
          usingEvent,
        )}
      }
      ${setValueAtIndex(propertyName, indexVariable, `${propertyName}Array`)}`;
}

function generateSetters(
  parentPropertyName: string,
  properties: $ReadOnlyArray<NamedShape<EventTypeAnnotation>>,
  propertyParts: $ReadOnlyArray<string>,
  extraIncludes: Set<string>,
  usingEvent: boolean = true,
): string {
  const propSetters = properties
    .map(eventProperty => {
      const {typeAnnotation} = eventProperty;
      switch (typeAnnotation.type) {
        case 'BooleanTypeAnnotation':
        case 'StringTypeAnnotation':
        case 'Int32TypeAnnotation':
        case 'DoubleTypeAnnotation':
        case 'FloatTypeAnnotation':
          return generateSetter(
            parentPropertyName,
            eventProperty.name,
            propertyParts,
            usingEvent,
          );
        case 'MixedTypeAnnotation':
          extraIncludes.add('#include <jsi/JSIDynamic.h>');
          return generateSetter(
            parentPropertyName,
            eventProperty.name,
            propertyParts,
            usingEvent,
            prop => `jsi::valueFromDynamic(runtime, ${prop})`,
          );
        case 'StringLiteralUnionTypeAnnotation':
          return generateSetter(
            parentPropertyName,
            eventProperty.name,
            propertyParts,
            usingEvent,
            prop => `toString(${prop})`,
          );
        case 'ObjectTypeAnnotation':
          return generateObjectSetter(
            parentPropertyName,
            eventProperty.name,
            propertyParts,
            typeAnnotation,
            extraIncludes,
            usingEvent,
          );
        case 'ArrayTypeAnnotation':
          return generateArraySetter(
            parentPropertyName,
            eventProperty.name,
            propertyParts,
            typeAnnotation.elementType,
            extraIncludes,
            usingEvent,
          );
        default:
          (typeAnnotation.type: empty);
          throw new Error(
            `Received invalid event property type ${typeAnnotation.type}`,
          );
      }
    })
    .join('\n');

  return propSetters;
}

function generateEvent(
  componentName: string,
  event: EventTypeShape,
  extraIncludes: Set<string>,
): string {
  // This is a gross hack necessary because native code is sending
  // events named things like topChange to JS which is then converted back to
  // call the onChange prop. We should be consistent throughout the system.
  // In order to migrate to this new system we have to support the current
  // naming scheme. We should delete this once we are able to control this name
  // throughout the system.
  const dispatchEventName =
    event.paperTopLevelNameDeprecated != null
      ? event.paperTopLevelNameDeprecated
      : `${event.name[2].toLowerCase()}${event.name.slice(3)}`;

  if (event.typeAnnotation.argument) {
    const implementation = `
    auto payload = jsi::Object(runtime);
    ${generateSetters(
      'payload',
      event.typeAnnotation.argument.properties,
      [],
      extraIncludes,
    )}
    return payload;
  `.trim();

    if (!event.name.startsWith('on')) {
      throw new Error('Expected the event name to start with `on`');
    }

    return ComponentTemplate({
      className: componentName,
      eventName: event.name,
      dispatchEventName,
      structName: generateEventStructName([event.name]),
      implementation,
    });
  }

  return BasicComponentTemplate({
    className: componentName,
    eventName: event.name,
    dispatchEventName,
  });
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    packageName?: string,
    assumeNonnull: boolean = false,
    headerPrefix?: string,
  ): FilesOutput {
    const moduleComponents: ComponentCollection = Object.keys(schema.modules)
      .map(moduleName => {
        const module = schema.modules[moduleName];
        if (module.type !== 'Component') {
          return;
        }

        const {components} = module;
        // No components in this module
        if (components == null) {
          return null;
        }

        return components;
      })
      .filter(Boolean)
      .reduce((acc, components) => Object.assign(acc, components), {});

    const extraIncludes = new Set<string>();
    const componentEmitters = Object.keys(moduleComponents)
      .map(componentName => {
        const component = moduleComponents[componentName];
        return component.events
          .map(event => generateEvent(componentName, event, extraIncludes))
          .join('\n');
      })
      .join('\n');

    const fileName = 'EventEmitters.cpp';
    const replacedTemplate = FileTemplate({
      events: componentEmitters,
      extraIncludes,
      headerPrefix: headerPrefix ?? '',
    });

    return new Map([[fileName, replacedTemplate]]);
  },
};
