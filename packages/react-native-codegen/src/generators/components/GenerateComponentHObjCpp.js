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
  SchemaType,
  CommandsFunctionTypeParamAnnotation,
} from '../../CodegenSchema';

type FilesOutput = Map<string, string>;

function getOrdinalNumber(num: number): string {
  switch (num) {
    case 1:
      return '1st';
    case 2:
      return '2nd';
    case 3:
      return '3rd';
  }

  if (num <= 20) {
    return `${num}th`;
  }

  return 'unknown';
}

const protocolTemplate = `
@protocol RCT::_COMPONENT_NAME_::ViewProtocol <NSObject>
::_METHODS_::
@end
`.trim();

const commandHandlerIfCaseConvertArgTemplate = `
#if RCT_DEBUG
  NSObject *arg::_ARG_NUMBER_:: = args[::_ARG_NUMBER_::];
  if (!RCTValidateTypeOfViewCommandArgument(arg::_ARG_NUMBER_::, ::_EXPECTED_KIND_::, @"::_EXPECTED_KIND_STRING_::", @"::_COMPONENT_NAME_::", commandName, @"::_ARG_NUMBER_STR_::")) {
    return;
  }
#endif
  ::_ARG_CONVERSION_::
`.trim();

const commandHandlerIfCaseTemplate = `
if ([commandName isEqualToString:@"::_COMMAND_NAME_::"]) {
#if RCT_DEBUG
  if ([args count] != ::_NUM_ARGS_::) {
    RCTLogError(@"%@ command %@ received %d arguments, expected %d.", @"::_COMPONENT_NAME_::", commandName, (int)[args count], ::_NUM_ARGS_::);
    return;
  }
#endif

::_CONVERT_ARGS_::

  ::_COMMAND_CALL_::
  return;
}
`.trim();

const commandHandlerTemplate = `
RCT_EXTERN inline void RCT::_COMPONENT_NAME_::HandleCommand(
  id<::_COMPONENT_NAME_::ViewProtocol> componentView,
  NSString const *commandName,
  NSArray const *args)
{
  ::_IF_CASES_::

#if RCT_DEBUG
  RCTLogError(@"%@ received command %@, which is not a supported command.", @"::_COMPONENT_NAME_::", commandName);
#endif
}
`.trim();

const template = `
/**
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

#import <Foundation/Foundation.h>
#import <React/RCTDefines.h>
#import <React/RCTLog.h>

NS_ASSUME_NONNULL_BEGIN

::_COMPONENT_CONTENT_::

NS_ASSUME_NONNULL_END
`.trim();

function getObjCParamType(param: CommandsFunctionTypeParamAnnotation): string {
  switch (param.typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
      return 'BOOL';
    case 'DoubleTypeAnnotation':
      return 'double';
    case 'FloatTypeAnnotation':
      return 'float';
    case 'Int32TypeAnnotation':
      return 'NSInteger';
    case 'StringTypeAnnotation':
      return 'NSString *';
    default:
      (param.typeAnnotation.type: empty);
      throw new Error('Received invalid param type annotation');
  }
}

function getObjCExpectedKindParamType(
  param: CommandsFunctionTypeParamAnnotation,
): string {
  switch (param.typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
      return '[NSNumber class]';
    case 'DoubleTypeAnnotation':
      return '[NSNumber class]';
    case 'FloatTypeAnnotation':
      return '[NSNumber class]';
    case 'Int32TypeAnnotation':
      return '[NSNumber class]';
    case 'StringTypeAnnotation':
      return '[NSString class]';
    default:
      (param.typeAnnotation.type: empty);
      throw new Error('Received invalid param type annotation');
  }
}

function getReadableExpectedKindParamType(
  param: CommandsFunctionTypeParamAnnotation,
): string {
  switch (param.typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
      return 'boolean';
    case 'DoubleTypeAnnotation':
      return 'double';
    case 'FloatTypeAnnotation':
      return 'float';
    case 'Int32TypeAnnotation':
      return 'number';
    case 'StringTypeAnnotation':
      return 'string';
    default:
      (param.typeAnnotation.type: empty);
      throw new Error('Received invalid param type annotation');
  }
}

function getObjCRightHandAssignmentParamType(
  param: CommandsFunctionTypeParamAnnotation,
  index: number,
): string {
  switch (param.typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
      return `[(NSNumber *)arg${index} boolValue]`;
    case 'DoubleTypeAnnotation':
      return `[(NSNumber *)arg${index} doubleValue]`;
    case 'FloatTypeAnnotation':
      return `[(NSNumber *)arg${index} floatValue]`;
    case 'Int32TypeAnnotation':
      return `[(NSNumber *)arg${index} intValue]`;
    case 'StringTypeAnnotation':
      return `(NSString *)arg${index}`;
    default:
      (param.typeAnnotation.type: empty);
      throw new Error('Received invalid param type annotation');
  }
}

function generateProtocol(
  component: ComponentShape,
  componentName: string,
): string {
  const commands = component.commands
    .map(command => {
      const params = command.typeAnnotation.params;
      const paramString =
        params.length === 0
          ? ''
          : params
              .map((param, index) => {
                const objCType = getObjCParamType(param);

                return `${index === 0 ? '' : param.name}:(${objCType})${
                  param.name
                }`;
              })
              .join(' ');
      return `- (void)${command.name}${paramString};`;
    })
    .join('\n')
    .trim();

  return protocolTemplate
    .replace(/::_COMPONENT_NAME_::/g, componentName)
    .replace('::_METHODS_::', commands);
}

function generateConvertAndValidateParam(
  param: CommandsFunctionTypeParamAnnotation,
  index: number,
  componentName: string,
): string {
  const leftSideType = getObjCParamType(param);
  const expectedKind = getObjCExpectedKindParamType(param);
  const expectedKindString = getReadableExpectedKindParamType(param);
  const argConversion = `${leftSideType} ${
    param.name
  } = ${getObjCRightHandAssignmentParamType(param, index)};`;

  return commandHandlerIfCaseConvertArgTemplate
    .replace(/::_COMPONENT_NAME_::/g, componentName)
    .replace('::_ARG_CONVERSION_::', argConversion)
    .replace(/::_ARG_NUMBER_::/g, '' + index)
    .replace('::_ARG_NUMBER_STR_::', getOrdinalNumber(index + 1))
    .replace('::_EXPECTED_KIND_::', expectedKind)
    .replace('::_EXPECTED_KIND_STRING_::', expectedKindString);
}

function generateCommandIfCase(
  command: CommandTypeShape,
  componentName: string,
) {
  const params = command.typeAnnotation.params;

  const convertArgs = params
    .map((param, index) =>
      generateConvertAndValidateParam(param, index, componentName),
    )
    .join('\n\n')
    .trim();

  const commandCallArgs =
    params.length === 0
      ? ''
      : params
          .map((param, index) => {
            return `${index === 0 ? '' : param.name}:${param.name}`;
          })
          .join(' ');
  const commandCall = `[componentView ${command.name}${commandCallArgs}]`;

  return commandHandlerIfCaseTemplate
    .replace(/::_COMPONENT_NAME_::/g, componentName)
    .replace(/::_COMMAND_NAME_::/g, command.name)
    .replace(/::_NUM_ARGS_::/g, '' + params.length)
    .replace('::_CONVERT_ARGS_::', convertArgs)
    .replace('::_COMMAND_CALL_::', commandCall);
}

function generateCommandHandler(
  component: ComponentShape,
  componentName: string,
): ?string {
  if (component.commands.length === 0) {
    return null;
  }

  const ifCases = component.commands
    .map(command => generateCommandIfCase(command, componentName))
    .join('\n\n');

  return commandHandlerTemplate
    .replace(/::_COMPONENT_NAME_::/g, componentName)
    .replace('::_IF_CASES_::', ifCases);
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    moduleSpecName: string,
  ): FilesOutput {
    const fileName = 'RCTComponentViewHelpers.h';

    const componentContent = Object.keys(schema.modules)
      .map(moduleName => {
        const components = schema.modules[moduleName].components;
        // No components in this module
        if (components == null) {
          return null;
        }

        return Object.keys(components)
          .map(componentName => {
            return [
              generateProtocol(components[componentName], componentName),
              generateCommandHandler(components[componentName], componentName),
            ]
              .join('\n\n')
              .trim();
          })
          .join('\n\n');
      })
      .filter(Boolean)
      .join('\n\n');

    const replacedTemplate = template.replace(
      '::_COMPONENT_CONTENT_::',
      componentContent,
    );

    return new Map([[fileName, replacedTemplate]]);
  },
};
