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
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

::_IMPORTS_::

::_COMPONENT_CONFIG_::
`;

function getReactDiffProcessValue(prop) {
  const typeAnnotation = prop.typeAnnotation;

  switch (typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'StringEnumTypeAnnotation':
      return j.literal(true);
    case 'NativePrimitiveTypeAnnotation':
      const nativeTypesString =
        "require('react-native').__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.NativePrimitives";
      switch (typeAnnotation.name) {
        case 'ColorPrimitive':
          return j.template.expression`${nativeTypesString}.ColorPrimitive`;
        default:
          (typeAnnotation.name: empty);
          throw new Error('Receieved unknown NativePrimitiveTypeAnnotation');
      }
    default:
      (typeAnnotation: empty);
      throw new Error('Receieved invalid typeAnnotation');
  }
}

const componentTemplate = `
const ::_COMPONENT_NAME_::ViewConfig = VIEW_CONFIG;

ReactNativeViewConfigRegistry.register(
  '::_COMPONENT_NAME_::',
  () => ::_COMPONENT_NAME_::ViewConfig,
);
`.trim();

function generateBubblingEventInfo(event) {
  return j.property(
    'init',
    j.identifier(event.name),
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
    j.identifier(event.name),
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

  let styleAttribute = null;

  component.extendsProps.forEach(extendProps => {
    switch (extendProps.type) {
      case 'ReactNativeBuiltInType':
        switch (extendProps.knownTypeName) {
          case 'ReactNativeCoreViewProps':
            imports.add(
              "const ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');",
            );
            styleAttribute = j.property(
              'init',
              j.identifier('style'),
              j.identifier('ReactNativeStyleAttributes'),
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
        getReactDiffProcessValue(schemaProp),
      );
    }),
    styleAttribute,
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
    const fileName = 'ViewConfigs.js';
    const imports: Set<string> = new Set();

    imports.add(
      "const ReactNativeViewConfigRegistry = require('ReactNativeViewConfigRegistry');",
    );

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

            const replacedTemplate = componentTemplate.replace(
              /::_COMPONENT_NAME_::/g,
              componentName,
            );

            const replacedSource: string = j
              .withParser('flow')(replacedTemplate)
              .find(j.Identifier, {
                name: 'VIEW_CONFIG',
              })
              .replaceWith(
                buildViewConfig(schema, componentName, component, imports),
              )
              .toSource({quote: 'single'});

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
  },
};
