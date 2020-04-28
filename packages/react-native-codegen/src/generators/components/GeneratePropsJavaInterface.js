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

import type {
  CommandTypeShape,
  ComponentShape,
  PropTypeShape,
  SchemaType,
} from '../../CodegenSchema';
const {getImports, toSafeJavaString} = require('./JavaHelpers');

// File path -> contents
type FilesOutput = Map<string, string>;

const template = `
package com.facebook.react.viewmanagers;

::_IMPORTS_::

public interface ::_CLASSNAME_::<T extends ::_EXTEND_CLASSES_::> {
  ::_METHODS_::
}
`;

function addNullable(imports) {
  imports.add('import androidx.annotation.Nullable;');
}

function getJavaValueForProp(prop: PropTypeShape, imports): string {
  const typeAnnotation = prop.typeAnnotation;

  switch (typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
      return 'boolean value';
    case 'StringTypeAnnotation':
      addNullable(imports);
      return '@Nullable String value';
    case 'Int32TypeAnnotation':
      return 'int value';
    case 'DoubleTypeAnnotation':
      return 'double value';
    case 'FloatTypeAnnotation':
      return 'float value';
    case 'NativePrimitiveTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'ColorPrimitive':
          addNullable(imports);
          return '@Nullable Integer value';
        case 'ImageSourcePrimitive':
          addNullable(imports);
          return '@Nullable ReadableMap value';
        case 'PointPrimitive':
          addNullable(imports);
          return '@Nullable ReadableMap value';
        default:
          (typeAnnotation.name: empty);
          throw new Error('Received unknown NativePrimitiveTypeAnnotation');
      }
    case 'ArrayTypeAnnotation': {
      addNullable(imports);
      return '@Nullable ReadableArray value';
    }
    case 'ObjectTypeAnnotation': {
      addNullable(imports);
      return '@Nullable ReadableMap value';
    }
    case 'StringEnumTypeAnnotation':
      addNullable(imports);
      return '@Nullable String value';
    default:
      (typeAnnotation: empty);
      throw new Error('Received invalid typeAnnotation');
  }
}

function generatePropsString(component: ComponentShape, imports) {
  if (component.props.length === 0) {
    return '// No props';
  }

  return component.props
    .map(prop => {
      return `void set${toSafeJavaString(
        prop.name,
      )}(T view, ${getJavaValueForProp(prop, imports)});`;
    })
    .join('\n' + '  ');
}

function getCommandArgJavaType(param) {
  switch (param.typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
      return 'boolean';
    case 'DoubleTypeAnnotation':
      return 'double';
    case 'FloatTypeAnnotation':
      return 'float';
    case 'Int32TypeAnnotation':
      return 'int';
    case 'StringTypeAnnotation':
      return 'String';
    default:
      (param.typeAnnotation.type: empty);
      throw new Error('Receieved invalid typeAnnotation');
  }
}

function getCommandArguments(
  command: CommandTypeShape,
  componentName: string,
): string {
  return [
    'T view',
    ...command.typeAnnotation.params.map(param => {
      const commandArgJavaType = getCommandArgJavaType(param);

      return `${commandArgJavaType} ${param.name}`;
    }),
  ].join(', ');
}

function generateCommandsString(
  component: ComponentShape,
  componentName: string,
) {
  return component.commands
    .map(command => {
      const safeJavaName = toSafeJavaString(command.name, false);

      return `void ${safeJavaName}(${getCommandArguments(
        command,
        componentName,
      )});`;
    })
    .join('\n' + '  ');
}

function getClassExtendString(component): string {
  const extendString = component.extendsProps
    .map(extendProps => {
      switch (extendProps.type) {
        case 'ReactNativeBuiltInType':
          switch (extendProps.knownTypeName) {
            case 'ReactNativeCoreViewProps':
              return 'View';
            default:
              (extendProps.knownTypeName: empty);
              throw new Error('Invalid knownTypeName');
          }
        default:
          (extendProps.type: empty);
          throw new Error('Invalid extended type');
      }
    })
    .join('');

  return extendString;
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    moduleSpecName: string,
  ): FilesOutput {
    const files = new Map();
    Object.keys(schema.modules).forEach(moduleName => {
      const components = schema.modules[moduleName].components;
      // No components in this module
      if (components == null) {
        return;
      }

      return Object.keys(components).forEach(componentName => {
        const component = components[componentName];
        const className = `${componentName}ManagerInterface`;
        const fileName = `${className}.java`;

        const imports = getImports(component);
        const propsString = generatePropsString(component, imports);
        const commandsString = generateCommandsString(component, componentName);
        const extendString = getClassExtendString(component);

        const replacedTemplate = template
          .replace(
            /::_IMPORTS_::/g,
            Array.from(imports)
              .sort()
              .join('\n'),
          )
          .replace(/::_CLASSNAME_::/g, className)
          .replace('::_EXTEND_CLASSES_::', extendString)
          .replace(
            '::_METHODS_::',
            [propsString, commandsString].join('\n' + '  ').trimRight(),
          )
          .replace('::_COMMAND_HANDLERS_::', commandsString);

        files.set(fileName, replacedTemplate);
      });
    });

    return files;
  },
};
