/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 */

'use-strict';

const SINGLE_LIBRARY_CODEGEN_CONFIG = {
  codegenConfig: {
    libraries: [
      {
        name: 'react-native',
        type: 'all',
        jsSrcsDir: '.',
      },
    ],
  },
};

const MULTIPLE_LIBRARIES_CODEGEN_CONFIG = {
  codegenConfig: {
    libraries: [
      {
        name: 'react-native',
        type: 'all',
        jsSrcsDir: '.',
      },
      {
        name: 'my-component',
        type: 'components',
        jsSrcsDir: 'component/js',
      },
      {
        name: 'my-module',
        type: 'module',
        jsSrcsDir: 'module/js',
      },
    ],
  },
};

const NO_LIBRARIES_CONFIG_FILE = {
  codegenConfig: {
    name: 'AppModules',
    type: 'all',
    jsSrcsDir: '.',
  },
};

const SCHEMA_TEXT = `
    {
  "modules": {
    "ColoredView": {
      "type": "Component",
      "components": {
        "ColoredView": {
          "extendsProps": [
            {
              "type": "ReactNativeBuiltInType",
              "knownTypeName": "ReactNativeCoreViewProps"
            }
          ],
          "events": [],
          "props": [
            {
              "name": "color",
              "optional": false,
              "typeAnnotation": {
                "type": "StringTypeAnnotation",
                "default": null
              }
            }
          ],
          "commands": []
        }
      }
    },
    "NativeCalculator": {
      "type": "NativeModule",
      "aliases": {},
      "spec": {
        "properties": [
          {
            "name": "add",
            "optional": false,
            "typeAnnotation": {
              "type": "FunctionTypeAnnotation",
              "returnTypeAnnotation": {
                "type": "PromiseTypeAnnotation"
              },
              "params": [
                {
                  "name": "a",
                  "optional": false,
                  "typeAnnotation": {
                    "type": "NumberTypeAnnotation"
                  }
                },
                {
                  "name": "b",
                  "optional": false,
                  "typeAnnotation": {
                    "type": "NumberTypeAnnotation"
                  }
                }
              ]
            }
          }
        ]
      },
      "moduleNames": [
        "Calculator"
      ]
    }
  }
}
`;

const SCHEMA = JSON.parse(SCHEMA_TEXT);

module.exports = {
  schemaText: SCHEMA_TEXT,
  schema: SCHEMA,
  noLibrariesConfigFile: NO_LIBRARIES_CONFIG_FILE,
  singleLibraryCodegenConfig: SINGLE_LIBRARY_CODEGEN_CONFIG,
  multipleLibrariesCodegenConfig: MULTIPLE_LIBRARIES_CODEGEN_CONFIG,
};
