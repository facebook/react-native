/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/*
TODO:

- ViewConfigs should spread in View's valid attributes
*/

const fs = require('fs');
const generateComponentDescriptorH = require('./components/GenerateComponentDescriptorH.js');
const generateComponentHObjCpp = require('./components/GenerateComponentHObjCpp.js');
const generateEventEmitterCpp = require('./components/GenerateEventEmitterCpp.js');
const generateEventEmitterH = require('./components/GenerateEventEmitterH.js');
const generatePropsCpp = require('./components/GeneratePropsCpp.js');
const generatePropsH = require('./components/GeneratePropsH.js');
const generateModuleH = require('./modules/GenerateModuleH.js');
const generateModuleCpp = require('./modules/GenerateModuleCpp.js');
const generateModuleHObjCpp = require('./modules/GenerateModuleHObjCpp.js');
const generateModuleMm = require('./modules/GenerateModuleMm.js');
const generatePropsJavaInterface = require('./components/GeneratePropsJavaInterface.js');
const generatePropsJavaDelegate = require('./components/GeneratePropsJavaDelegate.js');
const generateTests = require('./components/GenerateTests.js');
const generateShadowNodeCpp = require('./components/GenerateShadowNodeCpp.js');
const generateShadowNodeH = require('./components/GenerateShadowNodeH.js');
const generateViewConfigJs = require('./components/GenerateViewConfigJs.js');
const path = require('path');
const schemaValidator = require('../SchemaValidator.js');

import type {SchemaType} from '../CodegenSchema';

type Options = $ReadOnly<{|
  libraryName: string,
  schema: SchemaType,
  outputDirectory: string,
  moduleSpecName: string,
|}>;

type Generators =
  | 'descriptors'
  | 'events'
  | 'props'
  | 'tests'
  | 'shadow-nodes'
  | 'modules';

type Config = $ReadOnly<{|
  generators: Array<Generators>,
  test?: boolean,
|}>;

const GENERATORS = {
  descriptors: [generateComponentDescriptorH.generate],
  events: [
    generateEventEmitterCpp.generate,
    generateEventEmitterH.generate,
    generateModuleHObjCpp.generate,
    generateModuleMm.generate,
  ],
  props: [
    generateComponentHObjCpp.generate,
    generatePropsCpp.generate,
    generatePropsH.generate,
    generatePropsJavaInterface.generate,
    generatePropsJavaDelegate.generate,
  ],
  modules: [generateModuleCpp.generate, generateModuleH.generate],
  tests: [generateTests.generate],
  'shadow-nodes': [
    generateShadowNodeCpp.generate,
    generateShadowNodeH.generate,
  ],
};

function writeMapToFiles(map: Map<string, string>, outputDir: string) {
  let success = true;
  map.forEach((contents: string, fileName: string) => {
    try {
      const location = path.join(outputDir, fileName);
      fs.writeFileSync(location, contents);
    } catch (error) {
      success = false;
      console.error(`Failed to write ${fileName} to ${outputDir}`, error);
    }
  });

  return success;
}

function checkFilesForChanges(
  map: Map<string, string>,
  outputDir: string,
): boolean {
  let hasChanged = false;

  map.forEach((contents: string, fileName: string) => {
    const location = path.join(outputDir, fileName);
    const currentContents = fs.readFileSync(location, 'utf8');
    if (currentContents !== contents) {
      console.error(`- ${fileName} has changed`);

      hasChanged = true;
    }
  });

  return !hasChanged;
}

module.exports = {
  generate(
    {libraryName, schema, outputDirectory, moduleSpecName}: Options,
    {generators, test}: Config,
  ): boolean {
    schemaValidator.validate(schema);

    const generatedFiles = [];
    for (const name of generators) {
      for (const generator of GENERATORS[name]) {
        generatedFiles.push(...generator(libraryName, schema, moduleSpecName));
      }
    }

    const filesToUpdate = new Map([...generatedFiles]);

    if (test === true) {
      return checkFilesForChanges(filesToUpdate, outputDirectory);
    }

    return writeMapToFiles(filesToUpdate, outputDirectory);
  },
  generateViewConfig({libraryName, schema}: Options): string {
    schemaValidator.validate(schema);

    const result = generateViewConfigJs
      .generate(libraryName, schema)
      .values()
      .next();

    if (typeof result.value !== 'string') {
      throw new Error(`Failed to generate view config for ${libraryName}`);
    }

    return result.value;
  },
};
