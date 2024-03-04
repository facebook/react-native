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

const COMPONENTS_MAPPING_H_TEMPLATE_PATH = path.join(
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  'scripts',
  'codegen',
  'templates',
  'RCTFabricComponentsProviderH.template',
);

const COMPONENTS_MAPPING_MM_TEMPLATE_PATH = path.join(
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  'scripts',
  'codegen',
  'templates',
  'RCTFabricComponentsProviderMM.template',
);

/*::
type Library = $ReadOnly<{
    config?: {
      ios?: {
        componentsMapping?: {
          [string]: string,
        }
      }
    }
  }>
  */

function generateLocalComponentProvider(
  libraries /*: $ReadOnlyArray<Library>*/,
  outputDir /*:string */,
) /*: void */ {
  const componentNameClassMap = libraries
    .flatMap(library => library?.config?.ios?.componentsMapping)
    .filter(Boolean)
    .flatMap(components => Object.entries(components))
    .map(
      ([componentName, componentClass]) =>
        `@"${componentName}": NSClassFromString(@"${componentClass}")`,
    )
    .join(',\n\t\t');

  const template = fs.readFileSync(COMPONENTS_MAPPING_MM_TEMPLATE_PATH, 'utf8');
  const finalMMFile = template.replace(
    /{componentNameClassMap}/,
    componentNameClassMap,
  );
  fs.writeFileSync(
    path.join(outputDir, 'RCTFabricComponentsProvider.mm'),
    finalMMFile,
  );
  const templateH = fs.readFileSync(COMPONENTS_MAPPING_H_TEMPLATE_PATH, 'utf8');
  fs.writeFileSync(
    path.join(outputDir, 'RCTFabricComponentsProvider.h'),
    templateH,
  );
}

module.exports = {
  generateLocalComponentProvider,
};
