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
  ComponentShape,
  SchemaType,
  CommandsFunctionTypeParamAnnotation,
} from '../../CodegenSchema';

type FilesOutput = Map<string, string>;

const protocolTemplate = `
@protocol ::_COMPONENT_NAME_::ViewProtocol <NSObject>
::_METHODS_::
@end
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
    case 'Int32TypeAnnotation':
      return 'NSInteger';
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

module.exports = {
  generate(libraryName: string, schema: SchemaType): FilesOutput {
    const fileName = 'ComponentViewHelpers.h';

    const componentContent = Object.keys(schema.modules)
      .map(moduleName => {
        const components = schema.modules[moduleName].components;
        // No components in this module
        if (components == null) {
          return null;
        }

        return Object.keys(components)
          .map(componentName => {
            return generateProtocol(components[componentName], componentName);
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
