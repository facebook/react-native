/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {TEMPLATES_FOLDER_PATH} = require('./constants');
const fs = require('fs');
const path = require('path');

const MODULES_PROTOCOLS_H_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTModulesConformingToProtocolsProviderH.template',
);

const MODULES_PROTOCOLS_MM_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTModulesConformingToProtocolsProviderMM.template',
);

function generateCustomURLHandlers(libraries, outputDir) {
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

  fs.mkdirSync(outputDir, {recursive: true});

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
