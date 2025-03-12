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
const {parseiOSAnnotations} = require('./utils');
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
  const iosAnnotations = parseiOSAnnotations(libraries);

  const imageURLLoaderModules = new Set();
  const imageDataDecoderModules = new Set();
  const urlRequestHandlersModules = new Set();

  // Old API
  for (const library of libraries) {
    const modulesConformingToProtocol =
      library?.config?.ios?.modulesConformingToProtocol;
    if (modulesConformingToProtocol == null) {
      continue;
    }

    modulesConformingToProtocol.RCTImageURLLoader.forEach(moduleName => {
      imageURLLoaderModules.add(moduleName);
    });
    modulesConformingToProtocol.RCTImageDataDecoder.forEach(moduleName => {
      imageDataDecoderModules.add(moduleName);
    });
    modulesConformingToProtocol.RCTURLRequestHandler.forEach(moduleName => {
      urlRequestHandlersModules.add(moduleName);
    });
  }

  // New API
  for (const {modules: moduleAnnotationMap} of Object.values(iosAnnotations)) {
    for (const [moduleName, annotation] of Object.entries(
      moduleAnnotationMap,
    )) {
      const conformsToProtocols = annotation.conformsToProtocols;
      if (!conformsToProtocols) {
        continue;
      }

      if (conformsToProtocols.includes('RCTImageURLLoader')) {
        imageURLLoaderModules.add(moduleName);
      }
      if (conformsToProtocols.includes('RCTImageDataDecoder')) {
        imageDataDecoderModules.add(moduleName);
      }
      if (conformsToProtocols.includes('RCTURLRequestHandler')) {
        urlRequestHandlersModules.add(moduleName);
      }
    }
  }

  const customImageURLLoaderClasses = Array.from(imageURLLoaderModules)
    .map(className => `@"${className}"`)
    .join(',\n\t\t');

  const customImageDataDecoderClasses = Array.from(imageDataDecoderModules)
    .map(className => `@"${className}"`)
    .join(',\n\t\t');

  const customURLHandlerClasses = Array.from(urlRequestHandlersModules)
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
