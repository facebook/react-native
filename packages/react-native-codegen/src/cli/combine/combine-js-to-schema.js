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
import type {SchemaType} from '../../CodegenSchema.js';

const {FlowParser} = require('../../parsers/flow/parser');
const {TypeScriptParser} = require('../../parsers/typescript/parser');
const {filterJSFile} = require('./combine-utils');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

const flowParser = new FlowParser();
const typescriptParser = new TypeScriptParser();

function combineSchemas(
  files: Array<string>,
  excludeInterfaceOnly?: boolean,
  excludeUnimplemented?: boolean,
): {
  interfaceOnly: SchemaType,
  unimplemented: SchemaType,
  everythingElse: SchemaType,
} {
  let interfaceOnly: SchemaType = {modules: {}};
  let unimplemented: SchemaType = {modules: {}};
  let everythingElse: SchemaType = {modules: {}};

  files.forEach(filename => {
    const contents = fs.readFileSync(filename, 'utf8');

    if (
      contents &&
      (/export\s+default\s+\(?codegenNativeComponent</.test(contents) ||
        /extends TurboModule/.test(contents))
    ) {
      const isTypeScript =
        path.extname(filename) === '.ts' || path.extname(filename) === '.tsx';
      const parser = isTypeScript ? typescriptParser : flowParser;
      const schema = parser.parseFile(filename);

      if (!schema || !schema.modules) {
        return;
      }

      const isInterfaceOnly = /interfaceOnly:\s*true/.test(contents);
      const isUnimplemented =
        /UnimplementedNativeViewNativeComponent\.js$/.test(filename);

      if (isInterfaceOnly) {
        if (excludeInterfaceOnly !== true) {
          interfaceOnly = {
            modules: {...interfaceOnly.modules, ...schema.modules},
          };
        } else {
          console.log(`Excluding interfaceOnly component: ${filename}`);
        }
      } else if (isUnimplemented) {
        if (excludeUnimplemented !== true) {
          unimplemented = {
            modules: {...unimplemented.modules, ...schema.modules},
          };
        } else {
          console.log(`Excluding unimplemented component: ${filename}`);
        }
      } else {
        everythingElse = {
          modules: {...everythingElse.modules, ...schema.modules},
        };
      }
    }
  });

  return {
    interfaceOnly,
    unimplemented,
    everythingElse,
  };
}

function expandDirectoriesIntoFiles(
  fileList: Array<string>,
  platform: ?string,
  exclude: ?RegExp,
): Array<string> {
  return fileList
    .flatMap(file => {
      if (!fs.lstatSync(file).isDirectory()) {
        return [file];
      }
      const filePattern = path.sep === '\\' ? file.replace(/\\/g, '/') : file;
      return glob.sync(`${filePattern}/**/*{,.fb}.{js,ts,tsx}`, {
        nodir: true,
        // TODO: This will remove the need of slash substitution above for Windows,
        // but it requires glob@v9+; with the package currenlty relying on
        // glob@7.1.1; and flow-typed repo not having definitions for glob@9+.
        // windowsPathsNoEscape: true,
      });
    })
    .filter(element => filterJSFile(element, platform, exclude));
}

function combineSchemasInFileList(
  fileList: Array<string>,
  platform: ?string,
  exclude: ?RegExp,
  excludeInterfaceOnly: boolean,
  excludeUnimplemented: boolean,
): {
  interfaceOnly: SchemaType,
  unimplemented: SchemaType,
  everythingElse: SchemaType,
} {
  const expandedFileList = expandDirectoriesIntoFiles(
    fileList,
    platform,
    exclude,
  );
  const combined = combineSchemas(
    expandedFileList,
    excludeInterfaceOnly,
    excludeUnimplemented,
  );
  if (
    Object.keys(combined.interfaceOnly.modules).length === 0 &&
    Object.keys(combined.unimplemented.modules).length === 0 &&
    Object.keys(combined.everythingElse.modules).length === 0
  ) {
    console.error(
      'No modules to process in combine-js-to-schema-cli. If this is unexpected, please check if you set up your NativeComponent correctly. See combine-js-to-schema.js for how codegen finds modules.',
    );
  }
  return combined;
}

function combineSchemasInFileListAndWriteToFile(
  fileList: Array<string>,
  platform: ?string,
  outfile: string,
  exclude: ?RegExp,
  excludeInterfaceOnly: boolean,
  excludeUnimplemented: boolean,
): void {
  const combined = combineSchemasInFileList(
    fileList,
    platform,
    exclude,
    excludeInterfaceOnly,
    excludeUnimplemented,
  );

  // Determine which schema to write based on flags
  let schemaToWrite;
  if (excludeInterfaceOnly && excludeUnimplemented) {
    schemaToWrite = combined.everythingElse;
  } else if (excludeInterfaceOnly) {
    schemaToWrite = combined.unimplemented;
  } else if (excludeUnimplemented) {
    schemaToWrite = combined.interfaceOnly;
  } else {
    // If no exclusions, combine all schemas
    schemaToWrite = {
      modules: {
        ...combined.interfaceOnly.modules,
        ...combined.unimplemented.modules,
        ...combined.everythingElse.modules,
      },
    };
  }
  const formattedSchema = JSON.stringify(schemaToWrite);
  fs.writeFileSync(outfile, formattedSchema);
}

module.exports = {
  combineSchemas,
  combineSchemasInFileList,
  combineSchemasInFileListAndWriteToFile,
};
