/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
const generateModuleObjCpp = require('./modules/GenerateModuleObjCpp');
const generateModuleJavaSpec = require('./modules/GenerateModuleJavaSpec.js');
const GenerateModuleJniCpp = require('./modules/GenerateModuleJniCpp.js');
const GenerateModuleJniH = require('./modules/GenerateModuleJniH.js');
const generatePropsJavaInterface = require('./components/GeneratePropsJavaInterface.js');
const generatePropsJavaDelegate = require('./components/GeneratePropsJavaDelegate.js');
const generateTests = require('./components/GenerateTests.js');
const generateShadowNodeCpp = require('./components/GenerateShadowNodeCpp.js');
const generateShadowNodeH = require('./components/GenerateShadowNodeH.js');
const generateThirdPartyFabricComponentsProviderObjCpp = require('./components/GenerateThirdPartyFabricComponentsProviderObjCpp.js');
const generateThirdPartyFabricComponentsProviderH = require('./components/GenerateThirdPartyFabricComponentsProviderH.js');
const generateViewConfigJs = require('./components/GenerateViewConfigJs.js');
const path = require('path');
const schemaValidator = require('../SchemaValidator.js');

import type {SchemaType} from '../CodegenSchema';

type LibraryOptions = $ReadOnly<{
  libraryName: string,
  schema: SchemaType,
  outputDirectory: string,
  packageName?: string, // Some platforms have a notion of package, which should be configurable.
  assumeNonnull: boolean,
}>;

type SchemasOptions = $ReadOnly<{
  schemas: {[string]: SchemaType},
  outputDirectory: string,
}>;

type LibraryGenerators =
  | 'componentsAndroid'
  | 'componentsIOS'
  | 'descriptors'
  | 'events'
  | 'props'
  | 'tests'
  | 'shadow-nodes'
  | 'modulesAndroid'
  | 'modulesCxx'
  | 'modulesIOS';

type SchemasGenerators = 'providerIOS';

type LibraryConfig = $ReadOnly<{
  generators: Array<LibraryGenerators>,
  test?: boolean,
}>;

type SchemasConfig = $ReadOnly<{
  generators: Array<SchemasGenerators>,
  test?: boolean,
}>;

const LIBRARY_GENERATORS = {
  descriptors: [generateComponentDescriptorH.generate],
  events: [generateEventEmitterCpp.generate, generateEventEmitterH.generate],
  props: [
    generateComponentHObjCpp.generate,
    generatePropsCpp.generate,
    generatePropsH.generate,
    generatePropsJavaInterface.generate,
    generatePropsJavaDelegate.generate,
  ],
  // TODO: Refactor this to consolidate various C++ output variation instead of forking per platform.
  componentsAndroid: [
    // JNI/C++ files
    generateComponentDescriptorH.generate,
    generateEventEmitterCpp.generate,
    generateEventEmitterH.generate,
    generatePropsCpp.generate,
    generatePropsH.generate,
    generateShadowNodeCpp.generate,
    generateShadowNodeH.generate,
    // Java files
    generatePropsJavaInterface.generate,
    generatePropsJavaDelegate.generate,
  ],
  componentsIOS: [
    generateComponentDescriptorH.generate,
    generateEventEmitterCpp.generate,
    generateEventEmitterH.generate,
    generateComponentHObjCpp.generate,
    generatePropsCpp.generate,
    generatePropsH.generate,
    generateShadowNodeCpp.generate,
    generateShadowNodeH.generate,
  ],
  modulesAndroid: [
    GenerateModuleJniCpp.generate,
    GenerateModuleJniH.generate,
    generateModuleJavaSpec.generate,
  ],
  modulesCxx: [generateModuleCpp.generate, generateModuleH.generate],
  modulesIOS: [generateModuleObjCpp.generate],
  tests: [generateTests.generate],
  'shadow-nodes': [
    generateShadowNodeCpp.generate,
    generateShadowNodeH.generate,
  ],
};

const SCHEMAS_GENERATORS = {
  providerIOS: [
    generateThirdPartyFabricComponentsProviderObjCpp.generate,
    generateThirdPartyFabricComponentsProviderH.generate,
  ],
};

type CodeGenFile = {
  name: string,
  content: string,
  outputDir: string,
};

function writeMapToFiles(map: Array<CodeGenFile>) {
  let success = true;
  map.forEach(file => {
    try {
      const location = path.join(file.outputDir, file.name);
      const dirName = path.dirname(location);
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, {recursive: true});
      }
      fs.writeFileSync(location, file.content);
    } catch (error) {
      success = false;
      console.error(`Failed to write ${file.name} to ${file.outputDir}`, error);
    }
  });

  return success;
}

function checkFilesForChanges(generated: Array<CodeGenFile>): boolean {
  let hasChanged = false;

  generated.forEach(file => {
    const location = path.join(file.outputDir, file.name);
    const currentContents = fs.readFileSync(location, 'utf8');
    if (currentContents !== file.content) {
      console.error(`- ${file.name} has changed`);

      hasChanged = true;
    }
  });

  return !hasChanged;
}

function checkOrWriteFiles(
  generatedFiles: Array<CodeGenFile>,
  test: void | boolean,
): boolean {
  if (test === true) {
    return checkFilesForChanges(generatedFiles);
  }
  return writeMapToFiles(generatedFiles);
}

module.exports = {
  generate(
    {
      libraryName,
      schema,
      outputDirectory,
      packageName,
      assumeNonnull,
    }: LibraryOptions,
    {generators, test}: LibraryConfig,
  ): boolean {
    schemaValidator.validate(schema);

    function composePath(intermediate: string) {
      return path.join(outputDirectory, intermediate, libraryName);
    }

    const componentIOSOutput = composePath('react/renderer/components/');
    const modulesIOSOutput = composePath('./');

    const outputFoldersForGenerators = {
      componentsIOS: componentIOSOutput,
      modulesIOS: modulesIOSOutput,
      descriptors: outputDirectory,
      events: outputDirectory,
      props: outputDirectory,
      componentsAndroid: outputDirectory,
      modulesAndroid: outputDirectory,
      modulesCxx: outputDirectory,
      tests: outputDirectory,
      'shadow-nodes': outputDirectory,
    };

    const generatedFiles: Array<CodeGenFile> = [];

    for (const name of generators) {
      for (const generator of LIBRARY_GENERATORS[name]) {
        generator(libraryName, schema, packageName, assumeNonnull).forEach(
          (contents: string, fileName: string) => {
            generatedFiles.push({
              name: fileName,
              content: contents,
              outputDir: outputFoldersForGenerators[name],
            });
          },
        );
      }
    }
    return checkOrWriteFiles(generatedFiles, test);
  },
  generateFromSchemas(
    {schemas, outputDirectory}: SchemasOptions,
    {generators, test}: SchemasConfig,
  ): boolean {
    Object.keys(schemas).forEach(libraryName =>
      schemaValidator.validate(schemas[libraryName]),
    );

    const generatedFiles: Array<CodeGenFile> = [];

    for (const name of generators) {
      for (const generator of SCHEMAS_GENERATORS[name]) {
        generator(schemas).forEach((contents: string, fileName: string) => {
          generatedFiles.push({
            name: fileName,
            content: contents,
            outputDir: outputDirectory,
          });
        });
      }
    }
    return checkOrWriteFiles(generatedFiles, test);
  },
  generateViewConfig({libraryName, schema}: LibraryOptions): string {
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
