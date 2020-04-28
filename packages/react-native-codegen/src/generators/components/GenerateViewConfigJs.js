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

import type {SchemaType} from '../../CodegenSchema';

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

// We use this to add to a set. Need to make sure we aren't importing
// this multiple times.
const UIMANAGER_IMPORT = 'const {UIManager} = require("react-native")';

function getReactDiffProcessValue(typeAnnotation) {
  switch (typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'DoubleTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'ObjectTypeAnnotation':
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

let nativeComponentName = '::_COMPONENT_NAME_WITH_COMPAT_SUPPORT_::';
::_DEPRECATION_CHECK_::
registerGeneratedViewConfig(nativeComponentName, ::_COMPONENT_NAME_::ViewConfig);

export const __INTERNAL_VIEW_CONFIG = ::_COMPONENT_NAME_::ViewConfig;

export default nativeComponentName;
`.trim();

const deprecatedComponentTemplate = `
if (UIManager.getViewManagerConfig('::_COMPONENT_NAME_::')) {
  nativeComponentName = '::_COMPONENT_NAME_::';
} else if (UIManager.getViewManagerConfig('::_COMPONENT_NAME_DEPRECATED_::')){
  nativeComponentName = '::_COMPONENT_NAME_DEPRECATED_::';
} else {
  throw new Error('Failed to find native component for either "::_COMPONENT_NAME_::" or "::_COMPONENT_NAME_DEPRECATED_::"')
}
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

function generateBubblingEventInfo(event, nameOveride) {
  return j.property(
    'init',
    j.identifier(nameOveride || normalizeInputEventName(event.name)),
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

function generateDirectEventInfo(event, nameOveride) {
  return j.property(
    'init',
    j.identifier(nameOveride || normalizeInputEventName(event.name)),
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
    .reduce((bubblingEvents, event) => {
      // We add in the deprecated paper name so that it is in the view config.
      // This means either the old event name or the new event name can fire
      // and be sent to the listener until the old top level name is removed.
      if (event.paperTopLevelNameDeprecated) {
        bubblingEvents.push(
          generateBubblingEventInfo(event, event.paperTopLevelNameDeprecated),
        );
      }
      bubblingEvents.push(generateBubblingEventInfo(event));
      return bubblingEvents;
    }, []);

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
    .reduce((directEvents, event) => {
      // We add in the deprecated paper name so that it is in the view config.
      // This means either the old event name or the new event name can fire
      // and be sent to the listener until the old top level name is removed.
      if (event.paperTopLevelNameDeprecated) {
        directEvents.push(
          generateDirectEventInfo(event, event.paperTopLevelNameDeprecated),
        );
      }
      directEvents.push(generateDirectEventInfo(event));
      return directEvents;
    }, []);

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

function buildCommands(
  schema: SchemaType,
  componentName: string,
  component,
  imports,
) {
  const commands = component.commands;

  if (commands.length === 0) {
    return null;
  }

  imports.add(
    'const {dispatchCommand} = require("react-native/Libraries/Renderer/shims/ReactNative");',
  );

  const properties = commands.map(command => {
    const commandName = command.name;
    const params = command.typeAnnotation.params;

    const commandNameLiteral = j.literal(commandName);
    const commandNameIdentifier = j.identifier(commandName);
    const arrayParams = j.arrayExpression(
      params.map(param => {
        return j.identifier(param.name);
      }),
    );

    const expression = j.template
      .expression`dispatchCommand(ref, ${commandNameLiteral}, ${arrayParams})`;

    const functionParams = params.map(param => {
      return j.identifier(param.name);
    });

    const property = j.property(
      'init',
      commandNameIdentifier,
      j.functionExpression(
        null,
        [j.identifier('ref'), ...functionParams],
        j.blockStatement([j.expressionStatement(expression)]),
      ),
    );
    property.method = true;

    return property;
  });

  return j.exportNamedDeclaration(
    j.variableDeclaration('const', [
      j.variableDeclarator(
        j.identifier('Commands'),
        j.objectExpression(properties),
      ),
    ]),
  );
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

              const paperComponentName = component.paperComponentName
                ? component.paperComponentName
                : componentName;

              if (component.paperComponentNameDeprecated) {
                imports.add(UIMANAGER_IMPORT);
              }

              const deprecatedCheckBlock = component.paperComponentNameDeprecated
                ? deprecatedComponentTemplate
                    .replace(/::_COMPONENT_NAME_::/g, componentName)
                    .replace(
                      /::_COMPONENT_NAME_DEPRECATED_::/g,
                      component.paperComponentNameDeprecated || '',
                    )
                : '';

              const replacedTemplate = componentTemplate
                .replace(/::_COMPONENT_NAME_::/g, componentName)
                .replace(
                  /::_COMPONENT_NAME_WITH_COMPAT_SUPPORT_::/g,
                  paperComponentName,
                )
                .replace(/::_DEPRECATION_CHECK_::/, deprecatedCheckBlock);

              const replacedSourceRoot = j.withParser('flow')(replacedTemplate);

              replacedSourceRoot
                .find(j.Identifier, {
                  name: 'VIEW_CONFIG',
                })
                .replaceWith(
                  buildViewConfig(
                    schema,
                    paperComponentName,
                    component,
                    imports,
                  ),
                );

              const commands = buildCommands(
                schema,
                paperComponentName,
                component,
                imports,
              );
              if (commands) {
                replacedSourceRoot
                  .find(j.ExportDefaultDeclaration)
                  .insertAfter(j(commands).toSource());
              }

              const replacedSource: string = replacedSourceRoot.toSource({
                quote: 'single',
                trailingComma: true,
              });

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
