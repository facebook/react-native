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
const generateComponentDescriptorH = require('./GenerateComponentDescriptorH.js');
const generateEventEmitterCpp = require('./GenerateEventEmitterCpp.js');
const generateEventEmitterH = require('./GenerateEventEmitterH.js');
const generatePropsCpp = require('./GeneratePropsCpp.js');
const generatePropsH = require('./GeneratePropsH.js');
const generateTests = require('./GenerateTests.js');
const generateShadowNodeCpp = require('./GenerateShadowNodeCpp.js');
const generateShadowNodeH = require('./GenerateShadowNodeH.js');
const generateViewConfigJs = require('./GenerateViewConfigJs.js');
const path = require('path');
const schemaValidator = require('../SchemaValidator.js');

import type {SchemaType} from '../CodegenSchema';

type Options = $ReadOnly<{|
  libraryName: string,
  schema: SchemaType,
  outputDirectory: string,
|}>;

type Generators =
  | 'descriptors'
  | 'events'
  | 'props'
  | 'tests'
  | 'shadow-nodes'
  | 'view-configs';

type Config = $ReadOnly<{|
  generators: Array<Generators>,
|}>;

const GENERATORS = {
  descriptors: [generateComponentDescriptorH.generate],
  events: [generateEventEmitterCpp.generate, generateEventEmitterH.generate],
  props: [generatePropsCpp.generate, generatePropsH.generate],
  tests: [generateTests.generate],
  'shadow-nodes': [
    generateShadowNodeCpp.generate,
    generateShadowNodeH.generate,
  ],
  'view-configs': [generateViewConfigJs.generate],
};

function writeMapToFiles(map: Map<string, string>, outputDirectory: string) {
  map.forEach((contents: string, fileName: string) => {
    const location = path.join(outputDirectory, fileName);
    fs.writeFileSync(location, contents);
  });
}

module.exports = {
  generate(
    {libraryName, schema, outputDirectory}: Options,
    {generators}: Config,
  ) {
    schemaValidator.validate(schema);

    const generatedFiles = [];
    for (const name of generators) {
      for (const generator of GENERATORS[name]) {
        generatedFiles.push(...generator(libraryName, schema));
      }
    }

    writeMapToFiles(new Map([...generatedFiles]), outputDirectory);
  },
};
