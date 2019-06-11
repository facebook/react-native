/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const j = require('jscodeshift');

import type {SchemaType} from '../CodegenSchema';

// File path -> contents
type FilesOutput = Map<string, string>;

const template = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

::_IMPORTS_::

::_COMPONENT_CONFIG_::
`;

function getReactDiffProcessValue(typeAnnotation) {
  switch (typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'StringEnumTypeAnnotation':
      return j.literal(true);
    case 'NativePrimitiveTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'ColorPrimitive':
          return j.template.expression`{ process: require('processColor') }`;
        case 'ImageSourcePrimitive':
          return j.template
            .expression`{ process: require('resolveAssetSource') }`;
        case 'PointPrimitive':
          return j.template.expression`{ diff: require('pointsDiffer') }`;
        default:
          (typeAnnotation.name: empty);
          throw new Error(
            `Received unknown native typeAnnotation: "${typeAnnotation.name}"`,
          );
      }
    case 'ArrayTypeAnnotation':
      if (typeAnnotation.elementType.type === 'NativePrimitiveTypeAnnotation') {
        switch (typeAnnotation.elementType.name) {
          case 'ColorPrimitive':
            return j.template
              .expression`{ process: require('processColorArray') }`;
          case 'ImageSourcePrimitive':
            return j.literal(true);
          case 'PointPrimitive':
            return j.literal(true);
          default:
            throw new Error(
              `Received unknown array native typeAnnotation: "${
                typeAnnotation.elementType.name
              }"`,
            );
        }
      }
      return j.literal(true);
    default:
      (typeAnnotation: empty);
      throw new Error(
        `Received unknown typeAnnotation: "${typeAnnotation.type}"`,
      );
  }
}

const componentTemplate = `
const ::_COMPONENT_NAME_::ViewConfig = VIEW_CONFIG;

registerGeneratedViewConfig('::_COMPONENT_NAME_WITH_COMPAT_SUPPORT_::', ::_COMPONENT_NAME_::ViewConfig);

export const __INTERNAL_VIEW_CONFIG = ::_COMPONENT_NAME_::ViewConfig;

export default '::_COMPONENT_NAME_WITH_COMPAT_SUPPORT_::';::_COMPAT_COMMENT_::
`.trim();

// Replicates the behavior of RCTNormalizeInputEventName in RCTEventDispatcher.m
function normalizeInputEventName(name) {
  if (name.startsWith('on')) {
    return name.replace(/^on/, 'top');
  } else if (!name.startsWith('top')) {
    return `top${name[0].toUpperCase()}${name.slice(1)}`;
  }

  return name;
}

// Replicates the behavior of viewConfig in RCTComponentData.m
function getValidAttributesForEvents(events) {
  return events.map(eventType => {
    return j.property('init', j.identifier(eventType.name), j.literal(true));
  });
}

function generateBubblingEventInfo(event) {
  return j.property(
    'init',
    j.identifier(normalizeInputEventName(event.name)),
    j.objectExpression([
      j.property(
        'init',
        j.identifier('phasedRegistrationNames'),
        j.objectExpression([
          j.property(
            'init',
            j.identifier('captured'),
            j.literal(`${event.name}Capture`),
          ),
          j.property('init', j.identifier('bubbled'), j.literal(event.name)),
        ]),
      ),
    ]),
  );
}

function generateDirectEventInfo(event) {
  return j.property(
    'init',
    j.identifier(normalizeInputEventName(event.name)),
    j.objectExpression([
      j.property(
        'init',
        j.identifier('registrationName'),
        j.literal(event.name),
      ),
    ]),
  );
}

function buildViewConfig(
  schema: SchemaType,
  componentName: string,
  component,
  imports,
) {
  const componentProps = component.props;
  const componentEvents = component.events;

  component.extendsProps.forEach(extendProps => {
    switch (extendProps.type) {
      case 'ReactNativeBuiltInType':
        switch (extendProps.knownTypeName) {
          case 'ReactNativeCoreViewProps':
            imports.add(
              "const registerGeneratedViewConfig = require('registerGeneratedViewConfig');",
            );

            return;
          default:
            (extendProps.knownTypeName: empty);
            throw new Error('Invalid knownTypeName');
        }
      default:
        (extendProps.type: empty);
        throw new Error('Invalid extended type');
    }
  });

  const validAttributes = j.objectExpression([
    ...componentProps.map(schemaProp => {
      return j.property(
        'init',
        j.identifier(schemaProp.name),
        getReactDiffProcessValue(schemaProp.typeAnnotation),
      );
    }),
    ...getValidAttributesForEvents(componentEvents),
  ]);

  const bubblingEventNames = component.events
    .filter(event => event.bubblingType === 'bubble')
    .map(generateBubblingEventInfo);

  const bubblingEvents =
    bubblingEventNames.length > 0
      ? j.property(
          'init',
          j.identifier('bubblingEventTypes'),
          j.objectExpression(bubblingEventNames),
        )
      : null;

  const directEventNames = component.events
    .filter(event => event.bubblingType === 'direct')
    .map(generateDirectEventInfo);

  const directEvents =
    directEventNames.length > 0
      ? j.property(
          'init',
          j.identifier('directEventTypes'),
          j.objectExpression(directEventNames),
        )
      : null;

  const properties = [
    j.property(
      'init',
      j.identifier('uiViewClassName'),
      j.literal(componentName),
    ),
    bubblingEvents,
    directEvents,
    j.property('init', j.identifier('validAttributes'), validAttributes),
  ].filter(Boolean);

  return j.objectExpression(properties);
}

module.exports = {
  generate(libraryName: string, schema: SchemaType): FilesOutput {
    try {
      const fileName = `${libraryName}NativeViewConfig.js`;
      const imports: Set<string> = new Set();

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

              const compatabilityComponentName = `${
                component.isDeprecatedPaperComponentNameRCT ? 'RCT' : ''
              }${componentName}`;

              const replacedTemplate = componentTemplate
                .replace(/::_COMPONENT_NAME_::/g, componentName)
                .replace(
                  /::_COMPONENT_NAME_WITH_COMPAT_SUPPORT_::/g,
                  compatabilityComponentName,
                )
                .replace(
                  /::_COMPAT_COMMENT_::/g,
                  component.isDeprecatedPaperComponentNameRCT
                    ? ' // RCT prefix present for paper support'
                    : '',
                );

              const replacedSource: string = j
                .withParser('flow')(replacedTemplate)
                .find(j.Identifier, {
                  name: 'VIEW_CONFIG',
                })
                .replaceWith(
                  buildViewConfig(
                    schema,
                    compatabilityComponentName,
                    component,
                    imports,
                  ),
                )
                .toSource({quote: 'single', trailingComma: true});

              return replacedSource;
            })
            .join('\n\n');
        })
        .filter(Boolean)
        .join('\n\n');

      const replacedTemplate = template
        .replace(/::_COMPONENT_CONFIG_::/g, moduleResults)
        .replace(
          '::_IMPORTS_::',
          Array.from(imports)
            .sort()
            .join('\n'),
        );

      return new Map([[fileName, replacedTemplate]]);
    } catch (error) {
      console.error(`\nError parsing schema for ${libraryName}\n`);
      console.error(JSON.stringify(schema));
      throw error;
    }
  },
};
