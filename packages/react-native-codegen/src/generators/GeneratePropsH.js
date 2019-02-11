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

const {getCppTypeForAnnotation} = require('./CppHelpers.js');
const {upperCaseFirst} = require('../Helpers.js');

import type {PropTypeShape, SchemaType} from '../CodegenSchema';

// File path -> contents
type FilesOutput = Map<string, string>;

type TypeAnnotation = $PropertyType<PropTypeShape, 'typeAnnotation'>;

const template = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

::_IMPORTS_::

namespace facebook {
namespace react {

::_COMPONENT_CLASSES_::

} // namespace react
} // namespace facebook
`;

const classTemplate = `
::_ENUMS_::

class ::_CLASSNAME_:: final::_EXTEND_CLASSES_:: {
 public:
  ::_CLASSNAME_::() = default;
  ::_CLASSNAME_::(const ::_CLASSNAME_:: &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  ::_PROPS_::
};
`.trim();

const enumTemplate = `
enum class ::_ENUM_NAME_:: { ::_VALUES_:: };

static inline void fromRawValue(const RawValue &value, ::_ENUM_NAME_:: &result) {
  auto string = (std::string)value;
  ::_FROM_CASES_::
  abort();
}

static inline std::string toString(const ::_ENUM_NAME_:: &value) {
  switch (value) {
    ::_TO_CASES_::
  }
}
`.trim();

function getClassExtendString(component): string {
  const extendString =
    ' : ' +
    component.extendsProps
      .map(extendProps => {
        switch (extendProps.type) {
          case 'ReactNativeBuiltInType':
            switch (extendProps.knownTypeName) {
              case 'ReactNativeCoreViewProps':
                return 'public ViewProps';
              default:
                (extendProps.knownTypeName: empty);
                throw new Error('Invalid knownTypeName');
            }
          default:
            (extendProps.type: empty);
            throw new Error('Invalid extended type');
        }
      })
      .join(' ');

  return extendString;
}

function getNativeTypeFromAnnotation(componentName: string, prop): string {
  const typeAnnotation = prop.typeAnnotation;

  switch (typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'FloatTypeAnnotation':
      return getCppTypeForAnnotation(typeAnnotation.type);
    case 'NativePrimitiveTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'ColorPrimitive':
          return 'SharedColor';
        default:
          (typeAnnotation.name: empty);
          throw new Error('Receieved unknown NativePrimitiveTypeAnnotation');
      }
    case 'StringEnumTypeAnnotation':
      return getEnumName(componentName, prop.name);
    default:
      (typeAnnotation: empty);
      throw new Error('Receieved invalid typeAnnotation');
  }
}

function convertDefaultTypeToString(componentName: string, prop): string {
  const typeAnnotation = prop.typeAnnotation;
  switch (typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
      return String(typeAnnotation.default);
    case 'StringTypeAnnotation':
      return `"${typeAnnotation.default}"`;
    case 'Int32TypeAnnotation':
      return String(typeAnnotation.default);
    case 'FloatTypeAnnotation':
      const defaultVal = typeAnnotation.default;
      return parseInt(defaultVal, 10) === defaultVal
        ? typeAnnotation.default.toFixed(1)
        : String(typeAnnotation.default);
    case 'NativePrimitiveTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'ColorPrimitive':
          return '';
        default:
          (typeAnnotation.name: empty);
          throw new Error('Receieved unknown NativePrimitiveTypeAnnotation');
      }
    case 'StringEnumTypeAnnotation':
      return `${getEnumName(componentName, prop.name)}::${
        typeAnnotation.default
      }`;
    default:
      (typeAnnotation: empty);
      throw new Error('Receieved invalid typeAnnotation');
  }
}

function getEnumName(componentName, propName): string {
  const uppercasedPropName = upperCaseFirst(propName);
  return `${componentName}${uppercasedPropName}`;
}

function convertValueToEnumOption(value: string): string {
  return upperCaseFirst(value);
}

function generateEnumString(componentName: string, component): string {
  return component.props
    .map(prop => {
      if (prop.typeAnnotation.type !== 'StringEnumTypeAnnotation') {
        return;
      }

      const values = prop.typeAnnotation.options.map(option => option.name);
      const enumName = getEnumName(componentName, prop.name);

      const fromCases = values
        .map(
          value =>
            `if (string == "${value}") { result = ${enumName}::${convertValueToEnumOption(
              value,
            )}; return; }`,
        )
        .join('\n');

      const toCases = values
        .map(
          value =>
            `case ${enumName}::${convertValueToEnumOption(
              value,
            )}: return "${value}";`,
        )
        .join('\n');

      return enumTemplate
        .replace(/::_ENUM_NAME_::/g, enumName)
        .replace('::_VALUES_::', values.map(upperCaseFirst).join(', '))
        .replace('::_FROM_CASES_::', fromCases)
        .replace('::_TO_CASES_::', toCases);
    })
    .filter(Boolean)
    .join('\n');
}

function generatePropsString(
  componentName: string,
  props: $ReadOnlyArray<PropTypeShape>,
) {
  return props
    .map(prop => {
      const nativeType = getNativeTypeFromAnnotation(componentName, prop);
      const defaultValue = convertDefaultTypeToString(componentName, prop);

      return `const ${nativeType} ${prop.name}{${defaultValue}};`;
    })
    .join('\n');
}

function getImports(component): Set<string> {
  const imports: Set<string> = new Set();

  component.extendsProps.forEach(extendProps => {
    switch (extendProps.type) {
      case 'ReactNativeBuiltInType':
        switch (extendProps.knownTypeName) {
          case 'ReactNativeCoreViewProps':
            imports.add('#include <react/components/view/ViewProps.h>');
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

  component.props.forEach(prop => {
    const typeAnnotation = prop.typeAnnotation;

    if (typeAnnotation.type === 'NativePrimitiveTypeAnnotation') {
      switch (typeAnnotation.name) {
        case 'ColorPrimitive':
          imports.add('#include <react/graphics/Color.h>');
          return;
        default:
          (typeAnnotation.name: empty);
          throw new Error(
            `Invalid NativePrimitiveTypeAnnotation name, got ${prop.name}`,
          );
      }
    }
  });

  return imports;
}

module.exports = {
  generate(libraryName: string, schema: SchemaType): FilesOutput {
    const fileName = 'Props.h';

    const allImports: Set<string> = new Set();

    const componentClasses = Object.keys(schema.modules)
      .map(moduleName => {
        const components = schema.modules[moduleName].components;
        // No components in this module
        if (components == null) {
          return null;
        }

        return Object.keys(components)
          .map(componentName => {
            const component = components[componentName];

            const newName = `${componentName}Props`;
            const enumString = generateEnumString(componentName, component);
            const propsString = generatePropsString(
              componentName,
              component.props,
            );
            const extendString = getClassExtendString(component);
            const imports = getImports(component);

            imports.forEach(allImports.add, allImports);

            const replacedTemplate = classTemplate
              .replace('::_ENUMS_::', enumString)
              .replace(/::_CLASSNAME_::/g, newName)
              .replace('::_EXTEND_CLASSES_::', extendString)
              .replace('::_PROPS_::', propsString)
              .trim();

            return replacedTemplate;
          })
          .join('\n\n');
      })
      .filter(Boolean)
      .join('\n\n');

    const replacedTemplate = template
      .replace(/::_COMPONENT_CLASSES_::/g, componentClasses)
      .replace(
        '::_IMPORTS_::',
        Array.from(allImports)
          .sort()
          .join('\n'),
      );

    return new Map([[fileName, replacedTemplate]]);
  },
};
