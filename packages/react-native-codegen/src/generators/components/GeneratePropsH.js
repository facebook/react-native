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

const {
<<<<<<< HEAD
  getCppTypeForAnnotation,
  toSafeCppString,
  generateStructName,
  getImports,
} = require('./CppHelpers.js');

import type {PropTypeShape, SchemaType} from '../../CodegenSchema';
=======
  convertDefaultTypeToString,
  getCppTypeForAnnotation,
  getEnumMaskName,
  getEnumName,
  toSafeCppString,
  generateStructName,
  getImports,
  toIntEnumValueName,
} = require('./CppHelpers.js');

import type {
  ExtendsPropsShape,
  PropTypeShape,
  SchemaType,
} from '../../CodegenSchema';
>>>>>>> fb/0.62-stable

// File path -> contents
type FilesOutput = Map<string, string>;
type StructsMap = Map<string, string>;

const template = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

::_IMPORTS_::

namespace facebook {
namespace react {

::_COMPONENT_CLASSES_::

} // namespace react
} // namespace facebook
`;

const classTemplate = `
::_ENUMS_::
::_STRUCTS_::
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

<<<<<<< HEAD
=======
const intEnumTemplate = `
enum class ::_ENUM_NAME_:: { ::_VALUES_:: };

static inline void fromRawValue(const RawValue &value, ::_ENUM_NAME_:: &result) {
  assert(value.hasType<int>());
  auto integerValue = (int)value;
  switch (integerValue) {::_FROM_CASES_::
  }
  abort();
}

static inline std::string toString(const ::_ENUM_NAME_:: &value) {
  switch (value) {
    ::_TO_CASES_::
  }
}
`.trim();

>>>>>>> fb/0.62-stable
const structTemplate = `struct ::_STRUCT_NAME_:: {
  ::_FIELDS_::
};

static inline void fromRawValue(const RawValue &value, ::_STRUCT_NAME_:: &result) {
  auto map = (better::map<std::string, RawValue>)value;

  ::_FROM_CASES_::
}

static inline std::string toString(const ::_STRUCT_NAME_:: &value) {
  return "[Object ::_STRUCT_NAME_::]";
}
`.trim();

const arrayConversionFunction = `static inline void fromRawValue(const RawValue &value, std::vector<::_STRUCT_NAME_::> &result) {
  auto items = (std::vector<RawValue>)value;
  for (const auto &item : items) {
    ::_STRUCT_NAME_:: newItem;
    fromRawValue(item, newItem);
    result.emplace_back(newItem);
  }
}
`;

<<<<<<< HEAD
=======
const doubleArrayConversionFunction = `static inline void fromRawValue(const RawValue &value, std::vector<std::vector<::_STRUCT_NAME_::>> &result) {
  auto items = (std::vector<std::vector<RawValue>>)value;
  for (const std::vector<RawValue> &item : items) {
    auto nestedArray = std::vector<::_STRUCT_NAME_::>{};
    for (const RawValue &nestedItem : item) {
      ::_STRUCT_NAME_:: newItem;
      fromRawValue(nestedItem, newItem);
      nestedArray.emplace_back(newItem);
    }
    result.emplace_back(nestedArray);
  }
}
`;

>>>>>>> fb/0.62-stable
const arrayEnumTemplate = `
using ::_ENUM_MASK_:: = uint32_t;

enum class ::_ENUM_NAME_::: ::_ENUM_MASK_:: {
  ::_VALUES_::
};

constexpr bool operator&(
  ::_ENUM_MASK_:: const lhs,
  enum ::_ENUM_NAME_:: const rhs) {
  return lhs & static_cast<::_ENUM_MASK_::>(rhs);
}

constexpr ::_ENUM_MASK_:: operator|(
  ::_ENUM_MASK_:: const lhs,
  enum ::_ENUM_NAME_:: const rhs) {
  return lhs | static_cast<::_ENUM_MASK_::>(rhs);
}

constexpr void operator|=(
  ::_ENUM_MASK_:: &lhs,
  enum ::_ENUM_NAME_:: const rhs) {
  lhs = lhs | static_cast<::_ENUM_MASK_::>(rhs);
}

static inline void fromRawValue(const RawValue &value, ::_ENUM_MASK_:: &result) {
  auto items = std::vector<std::string>{value};
  for (const auto &item : items) {
    ::_FROM_CASES_::
    abort();
  }
}

static inline std::string toString(const ::_ENUM_MASK_:: &value) {
    auto result = std::string{};
    auto separator = std::string{", "};

    ::_TO_CASES_::
    if (!result.empty()) {
      result.erase(result.length() - separator.length());
    }
    return result;
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

<<<<<<< HEAD
function getNativeTypeFromAnnotation(componentName: string, prop): string {
=======
function getNativeTypeFromAnnotation(
  componentName: string,
  prop,
  nameParts: $ReadOnlyArray<string>,
): string {
>>>>>>> fb/0.62-stable
  const typeAnnotation = prop.typeAnnotation;

  switch (typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'DoubleTypeAnnotation':
    case 'FloatTypeAnnotation':
      return getCppTypeForAnnotation(typeAnnotation.type);
    case 'NativePrimitiveTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'ColorPrimitive':
          return 'SharedColor';
        case 'ImageSourcePrimitive':
          return 'ImageSource';
        case 'PointPrimitive':
          return 'Point';
<<<<<<< HEAD
=======
        case 'EdgeInsetsPrimitive':
          return 'EdgeInsets';
>>>>>>> fb/0.62-stable
        default:
          (typeAnnotation.name: empty);
          throw new Error('Received unknown NativePrimitiveTypeAnnotation');
      }
    case 'ArrayTypeAnnotation': {
<<<<<<< HEAD
      if (typeAnnotation.elementType.type === 'ArrayTypeAnnotation') {
        throw new Error(
          'ArrayTypeAnnotation of type ArrayTypeAnnotation not supported',
        );
      }
      if (typeAnnotation.elementType.type === 'ObjectTypeAnnotation') {
        const structName = generateStructName(componentName, [prop.name]);
        return `std::vector<${structName}>`;
      }
      if (typeAnnotation.elementType.type === 'StringEnumTypeAnnotation') {
        const enumName = getEnumName(componentName, prop.name);
        return getEnumMaskName(enumName);
      }
      const itemAnnotation = getNativeTypeFromAnnotation(componentName, {
        typeAnnotation: typeAnnotation.elementType,
        name: componentName,
      });
      return `std::vector<${itemAnnotation}>`;
    }
    case 'ObjectTypeAnnotation': {
      return generateStructName(componentName, [prop.name]);
    }
    case 'StringEnumTypeAnnotation':
      return getEnumName(componentName, prop.name);
=======
      const arrayType = typeAnnotation.elementType.type;
      if (arrayType === 'ArrayTypeAnnotation') {
        return `std::vector<${getNativeTypeFromAnnotation(
          componentName,
          {typeAnnotation: typeAnnotation.elementType, name: ''},
          nameParts.concat([prop.name]),
        )}>`;
      }
      if (arrayType === 'ObjectTypeAnnotation') {
        const structName = generateStructName(
          componentName,
          nameParts.concat([prop.name]),
        );
        return `std::vector<${structName}>`;
      }
      if (arrayType === 'StringEnumTypeAnnotation') {
        const enumName = getEnumName(componentName, prop.name);
        return getEnumMaskName(enumName);
      }
      const itemAnnotation = getNativeTypeFromAnnotation(
        componentName,
        {
          typeAnnotation: typeAnnotation.elementType,
          name: componentName,
        },
        nameParts.concat([prop.name]),
      );
      return `std::vector<${itemAnnotation}>`;
    }
    case 'ObjectTypeAnnotation': {
      return generateStructName(componentName, nameParts.concat([prop.name]));
    }
    case 'StringEnumTypeAnnotation':
      return getEnumName(componentName, prop.name);
    case 'Int32EnumTypeAnnotation':
      return getEnumName(componentName, prop.name);
>>>>>>> fb/0.62-stable
    default:
      (typeAnnotation: empty);
      throw new Error(
        `Received invalid typeAnnotation for ${componentName} prop ${
          prop.name
        }, received ${typeAnnotation.type}`,
      );
  }
}

<<<<<<< HEAD
function convertDefaultTypeToString(componentName: string, prop): string {
  const typeAnnotation = prop.typeAnnotation;
  switch (typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
      return String(typeAnnotation.default);
    case 'StringTypeAnnotation':
      if (typeAnnotation.default == null) {
        return '';
      }
      return `"${typeAnnotation.default}"`;
    case 'Int32TypeAnnotation':
      return String(typeAnnotation.default);
    case 'DoubleTypeAnnotation':
      const defaultDoubleVal = typeAnnotation.default;
      return parseInt(defaultDoubleVal, 10) === defaultDoubleVal
        ? typeAnnotation.default.toFixed(1)
        : String(typeAnnotation.default);
    case 'FloatTypeAnnotation':
      const defaultFloatVal = typeAnnotation.default;
      return parseInt(defaultFloatVal, 10) === defaultFloatVal
        ? typeAnnotation.default.toFixed(1)
        : String(typeAnnotation.default);
    case 'NativePrimitiveTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'ColorPrimitive':
          return '';
        case 'ImageSourcePrimitive':
          return '';
        case 'PointPrimitive':
          return '';
        default:
          (typeAnnotation.name: empty);
          throw new Error('Received unknown NativePrimitiveTypeAnnotation');
      }
    case 'ArrayTypeAnnotation': {
      switch (typeAnnotation.elementType.type) {
        case 'StringEnumTypeAnnotation':
          if (typeAnnotation.elementType.default == null) {
            throw new Error(
              'A default is required for array StringEnumTypeAnnotation',
            );
          }
          const enumName = getEnumName(componentName, prop.name);
          const enumMaskName = getEnumMaskName(enumName);
          const defaultValue = `${enumName}::${toSafeCppString(
            typeAnnotation.elementType.default || '',
          )}`;
          return `static_cast<${enumMaskName}>(${defaultValue})`;
        default:
          return '';
      }
    }
    case 'ObjectTypeAnnotation': {
      return '';
    }
    case 'StringEnumTypeAnnotation':
      return `${getEnumName(componentName, prop.name)}::${toSafeCppString(
        typeAnnotation.default,
      )}`;
    default:
      (typeAnnotation: empty);
      throw new Error('Received invalid typeAnnotation');
  }
}

function getEnumName(componentName, propName): string {
  const uppercasedPropName = toSafeCppString(propName);
  return `${componentName}${uppercasedPropName}`;
}

function getEnumMaskName(enumName: string): string {
  return `${enumName}Mask`;
}

=======
>>>>>>> fb/0.62-stable
function convertValueToEnumOption(value: string): string {
  return toSafeCppString(value);
}

function generateArrayEnumString(
  componentName: string,
  name: string,
  enumOptions,
): string {
  const options = enumOptions.map(option => option.name);
  const enumName = getEnumName(componentName, name);

  const values = options
    .map((option, index) => `${toSafeCppString(option)} = 1 << ${index}`)
    .join(',\n  ');

  const fromCases = options
    .map(
      option =>
        `if (item == "${option}") {
      result |= ${enumName}::${toSafeCppString(option)};
      continue;
    }`,
    )
    .join('\n    ');

  const toCases = options
    .map(
      option =>
        `if (value & ${enumName}::${toSafeCppString(option)}) {
      result += "${option}" + separator;
    }`,
    )
    .join('\n' + '    ');

  return arrayEnumTemplate
    .replace(/::_ENUM_NAME_::/g, enumName)
    .replace(/::_ENUM_MASK_::/g, getEnumMaskName(enumName))
    .replace('::_VALUES_::', values)
    .replace('::_FROM_CASES_::', fromCases)
    .replace('::_TO_CASES_::', toCases);
}
<<<<<<< HEAD
function generateEnum(componentName, prop) {
  if (!prop.typeAnnotation.options) {
    return '';
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
    .join('\n' + '  ');

  const toCases = values
    .map(
      value =>
        `case ${enumName}::${convertValueToEnumOption(
          value,
        )}: return "${value}";`,
    )
    .join('\n' + '    ');

  return enumTemplate
    .replace(/::_ENUM_NAME_::/g, enumName)
    .replace('::_VALUES_::', values.map(toSafeCppString).join(', '))
    .replace('::_FROM_CASES_::', fromCases)
    .replace('::_TO_CASES_::', toCases);
}
=======

function generateStringEnum(componentName, prop) {
  const typeAnnotation = prop.typeAnnotation;
  if (typeAnnotation.type === 'StringEnumTypeAnnotation') {
    const values: $ReadOnlyArray<string> = typeAnnotation.options.map(
      option => option.name,
    );
    const enumName = getEnumName(componentName, prop.name);

    const fromCases = values
      .map(
        value =>
          `if (string == "${value}") { result = ${enumName}::${convertValueToEnumOption(
            value,
          )}; return; }`,
      )
      .join('\n' + '  ');

    const toCases = values
      .map(
        value =>
          `case ${enumName}::${convertValueToEnumOption(
            value,
          )}: return "${value}";`,
      )
      .join('\n' + '    ');

    return enumTemplate
      .replace(/::_ENUM_NAME_::/g, enumName)
      .replace('::_VALUES_::', values.map(toSafeCppString).join(', '))
      .replace('::_FROM_CASES_::', fromCases)
      .replace('::_TO_CASES_::', toCases);
  }

  return '';
}

function generateIntEnum(componentName, prop) {
  const typeAnnotation = prop.typeAnnotation;
  if (typeAnnotation.type === 'Int32EnumTypeAnnotation') {
    const values: $ReadOnlyArray<number> = typeAnnotation.options.map(
      option => option.value,
    );
    const enumName = getEnumName(componentName, prop.name);

    const fromCases = values
      .map(
        value =>
          `
    case ${value}:
      result = ${enumName}::${toIntEnumValueName(prop.name, value)};
      return;`,
      )
      .join('');

    const toCases = values
      .map(
        value =>
          `case ${enumName}::${toIntEnumValueName(
            prop.name,
            value,
          )}: return "${value}";`,
      )
      .join('\n' + '    ');

    const valueVariables = values
      .map(val => `${toIntEnumValueName(prop.name, val)} = ${val}`)
      .join(', ');

    return intEnumTemplate
      .replace(/::_ENUM_NAME_::/g, enumName)
      .replace('::_VALUES_::', valueVariables)
      .replace('::_FROM_CASES_::', fromCases)
      .replace('::_TO_CASES_::', toCases);
  }

  return '';
}

>>>>>>> fb/0.62-stable
function generateEnumString(componentName: string, component): string {
  return component.props
    .map(prop => {
      if (
        prop.typeAnnotation.type === 'ArrayTypeAnnotation' &&
        prop.typeAnnotation.elementType.type === 'StringEnumTypeAnnotation'
      ) {
        return generateArrayEnumString(
          componentName,
          prop.name,
          prop.typeAnnotation.elementType.options,
        );
      }

      if (prop.typeAnnotation.type === 'StringEnumTypeAnnotation') {
<<<<<<< HEAD
        return generateEnum(componentName, prop);
=======
        return generateStringEnum(componentName, prop);
      }

      if (prop.typeAnnotation.type === 'Int32EnumTypeAnnotation') {
        return generateIntEnum(componentName, prop);
>>>>>>> fb/0.62-stable
      }

      if (prop.typeAnnotation.type === 'ObjectTypeAnnotation') {
        return prop.typeAnnotation.properties
<<<<<<< HEAD
          .filter(
            property =>
              property.typeAnnotation.type === 'StringEnumTypeAnnotation',
          )
          .map(property => {
            return generateEnum(componentName, property);
=======
          .map(property => {
            if (property.typeAnnotation.type === 'StringEnumTypeAnnotation') {
              return generateStringEnum(componentName, property);
            } else if (
              property.typeAnnotation.type === 'Int32EnumTypeAnnotation'
            ) {
              return generateIntEnum(componentName, property);
            }
            return null;
>>>>>>> fb/0.62-stable
          })
          .filter(Boolean)
          .join('\n');
      }
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
<<<<<<< HEAD
      const nativeType = getNativeTypeFromAnnotation(componentName, prop);
=======
      const nativeType = getNativeTypeFromAnnotation(componentName, prop, []);
>>>>>>> fb/0.62-stable
      const defaultValue = convertDefaultTypeToString(componentName, prop);

      return `const ${nativeType} ${prop.name}{${defaultValue}};`;
    })
    .join('\n' + '  ');
}

<<<<<<< HEAD
function getLocalImports(component): Set<string> {
  const imports: Set<string> = new Set();

  component.extendsProps.forEach(extendProps => {
=======
function getExtendsImports(
  extendsProps: $ReadOnlyArray<ExtendsPropsShape>,
): Set<string> {
  const imports: Set<string> = new Set();

  extendsProps.forEach(extendProps => {
>>>>>>> fb/0.62-stable
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

<<<<<<< HEAD
=======
  return imports;
}

function getLocalImports(
  properties: $ReadOnlyArray<PropTypeShape>,
): Set<string> {
  const imports: Set<string> = new Set();

>>>>>>> fb/0.62-stable
  function addImportsForNativeName(name) {
    switch (name) {
      case 'ColorPrimitive':
        imports.add('#include <react/graphics/Color.h>');
        return;
      case 'ImageSourcePrimitive':
        imports.add('#include <react/imagemanager/primitives.h>');
        return;
      case 'PointPrimitive':
        imports.add('#include <react/graphics/Geometry.h>');
        return;
<<<<<<< HEAD
=======
      case 'EdgeInsetsPrimitive':
        imports.add('#include <react/graphics/Geometry.h>');
        return;
>>>>>>> fb/0.62-stable
      default:
        (name: empty);
        throw new Error(
          `Invalid NativePrimitiveTypeAnnotation name, got ${name}`,
        );
    }
  }

<<<<<<< HEAD
  component.props.forEach(prop => {
=======
  properties.forEach(prop => {
>>>>>>> fb/0.62-stable
    const typeAnnotation = prop.typeAnnotation;

    if (typeAnnotation.type === 'NativePrimitiveTypeAnnotation') {
      addImportsForNativeName(typeAnnotation.name);
    }

    if (typeAnnotation.type === 'ArrayTypeAnnotation') {
      imports.add('#include <vector>');
      if (typeAnnotation.elementType.type === 'StringEnumTypeAnnotation') {
        imports.add('#include <cinttypes>');
      }
    }

    if (
      typeAnnotation.type === 'ArrayTypeAnnotation' &&
      typeAnnotation.elementType.type === 'NativePrimitiveTypeAnnotation'
    ) {
      addImportsForNativeName(typeAnnotation.elementType.name);
    }

<<<<<<< HEAD
    if (typeAnnotation.type === 'ObjectTypeAnnotation') {
      imports.add('#include <react/core/propsConversions.h>');
      const objectImports = getImports(typeAnnotation.properties);
      objectImports.forEach(imports.add, imports);
=======
    if (
      typeAnnotation.type === 'ArrayTypeAnnotation' &&
      typeAnnotation.elementType.type === 'ObjectTypeAnnotation'
    ) {
      const objectProps = typeAnnotation.elementType.properties;
      const objectImports = getImports(objectProps);
      const localImports = getLocalImports(objectProps);
      objectImports.forEach(imports.add, imports);
      localImports.forEach(imports.add, imports);
    }

    if (typeAnnotation.type === 'ObjectTypeAnnotation') {
      imports.add('#include <react/core/propsConversions.h>');
      const objectImports = getImports(typeAnnotation.properties);
      const localImports = getLocalImports(typeAnnotation.properties);
      objectImports.forEach(imports.add, imports);
      localImports.forEach(imports.add, imports);
>>>>>>> fb/0.62-stable
    }
  });

  return imports;
}

<<<<<<< HEAD
function generateStructs(componentName: string, component): string {
  const structs: StructsMap = new Map();
  component.props.forEach(prop => {
    if (prop.typeAnnotation.type === 'ObjectTypeAnnotation') {
      generateStruct(
        structs,
        componentName,
        [prop.name],
        prop.typeAnnotation.properties,
      );
    } else if (
      prop.typeAnnotation.type === 'ArrayTypeAnnotation' &&
      prop.typeAnnotation.elementType.type === 'ObjectTypeAnnotation'
    ) {
      const properties = prop.typeAnnotation.elementType.properties;
      generateStruct(structs, componentName, [prop.name], properties);
      structs.set(
        `${componentName}ArrayStruct`,
        arrayConversionFunction.replace(
          /::_STRUCT_NAME_::/g,
          generateStructName(componentName, [prop.name]),
=======
function generateStructsForComponent(componentName: string, component): string {
  const structs = generateStructs(componentName, component.props, []);
  const structArray = Array.from(structs.values());
  if (structArray.length < 1) {
    return '';
  }
  return structArray.join('\n\n');
}

function generateStructs(
  componentName: string,
  properties,
  nameParts,
): StructsMap {
  const structs: StructsMap = new Map();
  properties.forEach(prop => {
    const typeAnnotation = prop.typeAnnotation;
    if (typeAnnotation.type === 'ObjectTypeAnnotation') {
      // Recursively visit all of the object properties.
      // Note: this is depth first so that the nested structs are ordered first.
      const elementProperties = typeAnnotation.properties;
      const nestedStructs = generateStructs(
        componentName,
        elementProperties,
        nameParts.concat([prop.name]),
      );
      nestedStructs.forEach(function(value, key) {
        structs.set(key, value);
      });

      generateStruct(
        structs,
        componentName,
        nameParts.concat([prop.name]),
        typeAnnotation.properties,
      );
    }

    if (
      prop.typeAnnotation.type === 'ArrayTypeAnnotation' &&
      prop.typeAnnotation.elementType.type === 'ObjectTypeAnnotation'
    ) {
      // Recursively visit all of the object properties.
      // Note: this is depth first so that the nested structs are ordered first.
      const elementProperties = prop.typeAnnotation.elementType.properties;
      const nestedStructs = generateStructs(
        componentName,
        elementProperties,
        nameParts.concat([prop.name]),
      );
      nestedStructs.forEach(function(value, key) {
        structs.set(key, value);
      });

      // Generate this struct and its conversion function.
      generateStruct(
        structs,
        componentName,
        nameParts.concat([prop.name]),
        elementProperties,
      );

      // Generate the conversion function for std:vector<Object>.
      // Note: This needs to be at the end since it references the struct above.
      structs.set(
        `${[componentName, ...nameParts.concat([prop.name])].join(
          '',
        )}ArrayStruct`,
        arrayConversionFunction.replace(
          /::_STRUCT_NAME_::/g,
          generateStructName(componentName, nameParts.concat([prop.name])),
        ),
      );
    }
    if (
      prop.typeAnnotation.type === 'ArrayTypeAnnotation' &&
      prop.typeAnnotation.elementType.type === 'ArrayTypeAnnotation' &&
      prop.typeAnnotation.elementType.elementType.type ===
        'ObjectTypeAnnotation'
    ) {
      // Recursively visit all of the object properties.
      // Note: this is depth first so that the nested structs are ordered first.
      const elementProperties =
        prop.typeAnnotation.elementType.elementType.properties;
      const nestedStructs = generateStructs(
        componentName,
        elementProperties,
        nameParts.concat([prop.name]),
      );
      nestedStructs.forEach(function(value, key) {
        structs.set(key, value);
      });

      // Generate this struct and its conversion function.
      generateStruct(
        structs,
        componentName,
        nameParts.concat([prop.name]),
        elementProperties,
      );

      // Generate the conversion function for std:vector<Object>.
      // Note: This needs to be at the end since it references the struct above.
      structs.set(
        `${[componentName, ...nameParts.concat([prop.name])].join(
          '',
        )}ArrayArrayStruct`,
        doubleArrayConversionFunction.replace(
          /::_STRUCT_NAME_::/g,
          generateStructName(componentName, nameParts.concat([prop.name])),
>>>>>>> fb/0.62-stable
        ),
      );
    }
  });

<<<<<<< HEAD
  const structArray = Array.from(structs.values());
  if (structArray.length < 1) {
    return '';
  }
  return structArray.join('\n\n');
=======
  return structs;
>>>>>>> fb/0.62-stable
}

function generateStruct(
  structs: StructsMap,
  componentName: string,
  nameParts: $ReadOnlyArray<string>,
  properties: $ReadOnlyArray<PropTypeShape>,
): void {
  const structNameParts = nameParts;
  const structName = generateStructName(componentName, structNameParts);

  const fields = properties
    .map(property => {
      return `${getNativeTypeFromAnnotation(
        componentName,
        property,
<<<<<<< HEAD
        // structNameParts,
=======
        structNameParts,
>>>>>>> fb/0.62-stable
      )} ${property.name};`;
    })
    .join('\n' + '  ');

  properties.forEach((property: PropTypeShape) => {
    const name = property.name;
    switch (property.typeAnnotation.type) {
      case 'BooleanTypeAnnotation':
        return;
      case 'StringTypeAnnotation':
        return;
      case 'Int32TypeAnnotation':
        return;
      case 'DoubleTypeAnnotation':
        return;
      case 'FloatTypeAnnotation':
        return;
      case 'NativePrimitiveTypeAnnotation':
        return;
      case 'ArrayTypeAnnotation':
        return;
      case 'StringEnumTypeAnnotation':
        return;
<<<<<<< HEAD
=======
      case 'Int32EnumTypeAnnotation':
        return;
>>>>>>> fb/0.62-stable
      case 'DoubleTypeAnnotation':
        return;
      case 'ObjectTypeAnnotation':
        const props = property.typeAnnotation.properties;
        if (props == null) {
          throw new Error(
            `Properties are expected for ObjectTypeAnnotation (see ${name} in ${componentName})`,
          );
        }
        generateStruct(structs, componentName, nameParts.concat([name]), props);
        return;
      default:
        (property.typeAnnotation.type: empty);
        throw new Error(
          `Received invalid component property type ${
            property.typeAnnotation.type
          }`,
        );
    }
  });

  const fromCases = properties
    .map(property => {
      const variable = property.name;
      return `auto ${variable} = map.find("${property.name}");
  if (${variable} != map.end()) {
    fromRawValue(${variable}->second, result.${variable});
  }`;
    })
    .join('\n  ');

  structs.set(
    structName,
    structTemplate
      .replace(/::_STRUCT_NAME_::/g, structName)
      .replace('::_FIELDS_::', fields)
      .replace('::_FROM_CASES_::', fromCases),
  );
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    moduleSpecName: string,
  ): FilesOutput {
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
<<<<<<< HEAD
=======
          .filter(componentName => {
            const component = components[componentName];
            return component.excludedPlatform !== 'iOS';
          })
>>>>>>> fb/0.62-stable
          .map(componentName => {
            const component = components[componentName];

            const newName = `${componentName}Props`;
<<<<<<< HEAD
            const structString = generateStructs(componentName, component);
=======
            const structString = generateStructsForComponent(
              componentName,
              component,
            );
>>>>>>> fb/0.62-stable
            const enumString = generateEnumString(componentName, component);
            const propsString = generatePropsString(
              componentName,
              component.props,
            );
            const extendString = getClassExtendString(component);
<<<<<<< HEAD
            const imports = getLocalImports(component);

=======
            const extendsImports = getExtendsImports(component.extendsProps);
            const imports = getLocalImports(component.props);

            extendsImports.forEach(allImports.add, allImports);
>>>>>>> fb/0.62-stable
            imports.forEach(allImports.add, allImports);

            const replacedTemplate = classTemplate
              .replace('::_ENUMS_::', enumString)
              .replace('::_STRUCTS_::', structString)
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
