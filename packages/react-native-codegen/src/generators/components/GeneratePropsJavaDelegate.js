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

public class ::_CLASSNAME_::<T extends ::_EXTEND_CLASSES_::, U extends BaseViewManager<T, ? extends LayoutShadowNode> & ::_INTERFACE_CLASSNAME_::<T>> extends BaseViewManagerDelegate<T, U> {
  public ::_CLASSNAME_::(U viewManager) {
    super(viewManager);
  }
  ::_METHODS_::
}
`;

const propSetterTemplate = `
  @Override
  public void setProperty(T view, String propName, @Nullable Object value) {
    ::_PROP_CASES_::
  }
`;

const commandsTemplate = `
  public void receiveCommand(::_INTERFACE_CLASSNAME_::<T> viewManager, T view, String commandName, ReadableArray args) {
    ::_COMMAND_CASES_::
  }
`;

function getJavaValueForProp(
  prop: PropTypeShape,
  componentName: string,
): string {
  const typeAnnotation = prop.typeAnnotation;

  switch (typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
      return `value == null ? ${typeAnnotation.default.toString()} : (boolean) value`;
    case 'StringTypeAnnotation':
      const defaultValueString =
        typeAnnotation.default === null
          ? 'null'
          : `"${typeAnnotation.default}"`;
      return `value == null ? ${defaultValueString} : (String) value`;
    case 'Int32TypeAnnotation':
      return `value == null ? ${
        typeAnnotation.default
      } : ((Double) value).intValue()`;
    case 'DoubleTypeAnnotation':
      if (prop.optional) {
        return `value == null ? ${
          typeAnnotation.default
        }f : ((Double) value).doubleValue()`;
      } else {
        return 'value == null ? Double.NaN : ((Double) value).doubleValue()';
      }
    case 'FloatTypeAnnotation':
      if (prop.optional) {
        return `value == null ? ${
          typeAnnotation.default
        }f : ((Double) value).floatValue()`;
      } else {
        return 'value == null ? Float.NaN : ((Double) value).floatValue()';
      }
    case 'NativePrimitiveTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'ColorPrimitive':
          return 'value == null ? null : ((Double) value).intValue()';
        case 'ImageSourcePrimitive':
          return '(ReadableMap) value';
        case 'PointPrimitive':
          return '(ReadableMap) value';
        default:
          (typeAnnotation.name: empty);
          throw new Error('Received unknown NativePrimitiveTypeAnnotation');
      }
    case 'ArrayTypeAnnotation': {
      return '(ReadableArray) value';
    }
    case 'ObjectTypeAnnotation': {
      return '(ReadableMap) value';
    }
    case 'StringEnumTypeAnnotation':
      return '(String) value';
    default:
      (typeAnnotation: empty);
      throw new Error('Received invalid typeAnnotation');
  }
}

function generatePropCasesString(
  component: ComponentShape,
  componentName: string,
) {
  if (component.props.length === 0) {
    return 'super.setProperty(view, propName, value);';
  }

  const cases = component.props
    .map(prop => {
      return `case "${prop.name}":
        mViewManager.set${toSafeJavaString(
          prop.name,
        )}(view, ${getJavaValueForProp(prop, componentName)});
        break;`;
    })
    .join('\n' + '      ');

  return `switch (propName) {
      ${cases}
      default:
        super.setProperty(view, propName, value);
    }`;
}

function getCommandArgJavaType(param) {
  switch (param.typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
      return 'getBoolean';
    case 'DoubleTypeAnnotation':
      return 'getDouble';
    case 'FloatTypeAnnotation':
      return 'getFloat';
    case 'Int32TypeAnnotation':
      return 'getInt';
    case 'StringTypeAnnotation':
      return 'getString';
    default:
      (param.typeAnnotation.type: empty);
      throw new Error('Receieved invalid typeAnnotation');
  }
}

function getCommandArguments(command: CommandTypeShape): string {
  return [
    'view',
    ...command.typeAnnotation.params.map((param, index) => {
      const commandArgJavaType = getCommandArgJavaType(param);

      return `args.${commandArgJavaType}(${index})`;
    }),
  ].join(', ');
}

function generateCommandCasesString(
  component: ComponentShape,
  componentName: string,
) {
  if (component.commands.length === 0) {
    return null;
  }

  const commandMethods = component.commands
    .map(command => {
      return `case "${command.name}":
      viewManager.${toSafeJavaString(
        command.name,
        false,
      )}(${getCommandArguments(command)});
      break;`;
    })
    .join('\n' + '    ');

  return commandMethods;
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

function getDelegateImports(component) {
  const imports = getImports(component);
  // The delegate needs ReadableArray for commands always.
  // The interface doesn't always need it
  if (component.commands.length > 0) {
    imports.add('import com.facebook.react.bridge.ReadableArray;');
  }
  imports.add('import androidx.annotation.Nullable;');
  imports.add('import com.facebook.react.uimanager.BaseViewManager;');
  imports.add('import com.facebook.react.uimanager.BaseViewManagerDelegate;');
  imports.add('import com.facebook.react.uimanager.LayoutShadowNode;');

  return imports;
}

function generateMethods(propsString, commandsString): string {
  return [
    propSetterTemplate.trim().replace('::_PROP_CASES_::', propsString),
    commandsString != null
      ? commandsTemplate.trim().replace('::_COMMAND_CASES_::', commandsString)
      : '',
  ]
    .join('\n\n  ')
    .trimRight();
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
        const className = `${componentName}ManagerDelegate`;
        const interfaceClassName = `${componentName}ManagerInterface`;
        const fileName = `${className}.java`;

        const imports = getDelegateImports(component);
        const propsString = generatePropCasesString(component, componentName);
        const commandsString = generateCommandCasesString(
          component,
          componentName,
        );
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
          .replace('::_PROP_CASES_::', propsString)
          .replace(
            '::_METHODS_::',
            generateMethods(propsString, commandsString),
          )
          .replace(/::_INTERFACE_CLASSNAME_::/g, interfaceClassName);

        files.set(fileName, replacedTemplate);
      });
    });

    return files;
  },
};
