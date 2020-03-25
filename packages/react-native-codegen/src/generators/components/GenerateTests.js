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
const {getImports, toSafeCppString} = require('./CppHelpers');

type FilesOutput = Map<string, string>;
type PropValueType = string | number | boolean;

type TestCase = $ReadOnly<{|
  propName: string,
  propValue: ?PropValueType,
  testName?: string,
  raw?: boolean,
|}>;

const fileTemplate = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/components/::_LIBRARY_NAME_::/Props.h>
::_IMPORTS_::

using namespace facebook::react;
::_COMPONENT_TESTS_::
`;

const testTemplate = `
TEST(::_COMPONENT_NAME_::_::_TEST_NAME_::, etc) {
  auto propParser = RawPropsParser();
  propParser.prepare<::_COMPONENT_NAME_::>();
  auto const &sourceProps = ::_COMPONENT_NAME_::();
  auto const &rawProps = RawProps(folly::dynamic::object("::_PROP_NAME_::", ::_PROP_VALUE_::));
  rawProps.parse(propParser);
  ::_COMPONENT_NAME_::(sourceProps, rawProps);
}
`;

function getTestCasesForProp(propName, typeAnnotation) {
  const cases = [];
  if (typeAnnotation.type === 'StringEnumTypeAnnotation') {
    typeAnnotation.options.forEach(option =>
      cases.push({
        propName,
        testName: `${propName}_${toSafeCppString(option.name)}`,
        propValue: option.name,
      }),
    );
  } else if (typeAnnotation.type === 'StringTypeAnnotation') {
    cases.push({
      propName,
      propValue:
        typeAnnotation.default != null && typeAnnotation.default !== ''
          ? typeAnnotation.default
          : 'foo',
    });
  } else if (typeAnnotation.type === 'BooleanTypeAnnotation') {
    cases.push({
      propName: propName,
      propValue: typeAnnotation.default != null ? typeAnnotation.default : true,
    });
  } else if (typeAnnotation.type === 'IntegerTypeAnnotation') {
    cases.push({
      propName,
      propValue: typeAnnotation.default || 10,
    });
  } else if (typeAnnotation.type === 'FloatTypeAnnotation') {
    cases.push({
      propName,
      propValue: typeAnnotation.default != null ? typeAnnotation.default : 0.1,
    });
  } else if (typeAnnotation.type === 'NativePrimitiveTypeAnnotation') {
    if (typeAnnotation.name === 'ColorPrimitive') {
      cases.push({
        propName,
        propValue: 1,
      });
    } else if (typeAnnotation.name === 'PointPrimitive') {
      cases.push({
        propName,
        propValue: 'folly::dynamic::object("x", 1)("y", 1)',
        raw: true,
      });
    } else if (typeAnnotation.name === 'ImageSourcePrimitive') {
      cases.push({
        propName,
        propValue: 'folly::dynamic::object("url", "testurl")',
        raw: true,
      });
    }
  }

  return cases;
}

function generateTestsString(name, component) {
  function createTest({testName, propName, propValue, raw = false}: TestCase) {
    const value =
      !raw && typeof propValue === 'string' ? `"${propValue}"` : propValue;

    return testTemplate
      .replace(/::_COMPONENT_NAME_::/g, name)
      .replace(/::_TEST_NAME_::/g, testName != null ? testName : propName)
      .replace(/::_PROP_NAME_::/g, propName)
      .replace(/::_PROP_VALUE_::/g, String(value));
  }

  const testCases = component.props.reduce((cases, prop) => {
    return cases.concat(getTestCasesForProp(prop.name, prop.typeAnnotation));
  }, []);

  const baseTest = {
    testName: 'DoesNotDie',
    propName: 'xx_invalid_xx',
    propValue: 'xx_invalid_xx',
  };

  return [baseTest, ...testCases].map(createTest).join('');
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    moduleSpecName: string,
  ): FilesOutput {
    const fileName = 'Tests.cpp';
    const allImports = new Set([
      '#include <react/core/propsConversions.h>',
      '#include <react/core/RawProps.h>',
      '#include <react/core/RawPropsParser.h>',
    ]);

    const componentTests = Object.keys(schema.modules)
      .map(moduleName => {
        const components = schema.modules[moduleName].components;
        if (components == null) {
          return null;
        }

        return Object.keys(components)
          .map(componentName => {
            const component = components[componentName];
            const name = `${componentName}Props`;

            const imports = getImports(component.props);
            imports.forEach(allImports.add, allImports);

            return generateTestsString(name, component);
          })
          .join('');
      })
      .filter(Boolean)
      .join('');

    const imports = Array.from(allImports)
      .sort()
      .join('\n')
      .trim();

    const replacedTemplate = fileTemplate
      .replace(/::_IMPORTS_::/g, imports)
      .replace(/::_LIBRARY_NAME_::/g, libraryName)
      .replace(/::_COMPONENT_TESTS_::/g, componentTests)
      .trim();

    return new Map([[fileName, replacedTemplate]]);
  },
};
