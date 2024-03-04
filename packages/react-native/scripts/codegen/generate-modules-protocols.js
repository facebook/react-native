/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

'use strict';
const fs = require('fs');
const path = require('path');

const REACT_NATIVE_PACKAGE_ROOT_FOLDER = path.join(__dirname, '..', '..');

const MODULES_PROTOCOLS_H_TEMPLATE_PATH = path.join(
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  'scripts',
  'codegen',
  'templates',
  'RCTModulesConformingToProtocolsProviderH.template',
);

const MODULES_PROTOCOLS_MM_TEMPLATE_PATH = path.join(
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  'scripts',
  'codegen',
  'templates',
  'RCTModulesConformingToProtocolsProviderMM.template',
);

/*::
type Library = $ReadOnly<{
  config?: {
    ios?: {
      modulesConformingToProtocol?: {
        RCTImageURLLoader?: $ReadOnlyArray<string>,
        RCTImageDataDecoder?: $ReadOnlyArray<string>,
        RCTURLRequestHandler?: $ReadOnlyArray<string>,
      }
    }
  }
}>
*/

function generateCustomURLHandlers(
  libraries /*: Library[]*/,
  outputDir /*: string */,
) /*: void*/ {
  const customImageURLLoaderClasses = libraries
    .flatMap(
      library =>
        library?.config?.ios?.modulesConformingToProtocol?.RCTImageURLLoader,
    )
    .filter(Boolean)
    .map(className => `@"${className}"`)
    .join(',\n\t\t');

  const customImageDataDecoderClasses = libraries
    .flatMap(
      library =>
        library?.config?.ios?.modulesConformingToProtocol?.RCTImageDataDecoder,
    )
    .filter(Boolean)
    .map(className => `@"${className}"`)
    .join(',\n\t\t');

  const customURLHandlerClasses = libraries
    .flatMap(
      library =>
        library?.config?.ios?.modulesConformingToProtocol?.RCTURLRequestHandler,
    )
    .filter(Boolean)
    .map(className => `@"${className}"`)
    .join(',\n\t\t');

  const template = fs.readFileSync(MODULES_PROTOCOLS_MM_TEMPLATE_PATH, 'utf8');
  const finalMMFile = template
    .replace(/{imageURLLoaderClassNames}/, customImageURLLoaderClasses)
    .replace(/{imageDataDecoderClassNames}/, customImageDataDecoderClasses)
    .replace(/{requestHandlersClassNames}/, customURLHandlerClasses);

  fs.writeFileSync(
    path.join(outputDir, 'RCTModulesConformingToProtocolsProvider.mm'),
    finalMMFile,
  );

  const templateH = fs.readFileSync(MODULES_PROTOCOLS_H_TEMPLATE_PATH, 'utf8');
  fs.writeFileSync(
    path.join(outputDir, 'RCTModulesConformingToProtocolsProvider.h'),
    templateH,
  );
}

module.exports = {
  generateCustomURLHandlers,
};
