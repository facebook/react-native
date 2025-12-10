/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const PodSpecConfigurations = require('./headers-config');
const utils = require('./utils');
const path = require('path');
const {globSync} = require('tinyglobby');

const {createLogger} = utils;
const headersLog = createLogger('headers');

/*::
import type {PodSpecConfiguration} from './headers-config';
type HeaderMap = { headerDir: string, specName: string, headers: {source: string, target: string}[]};
*/

/**
 * Enumerates all podspec files in the PodSpecConfigurations structure above and maps them to
 * their header files based on the configuration.
 * @param {*} rootFolder Root folder to search for podspec files
 * @param {*} testHeadersFlag Flag to indicate whether to test headers against a test directory
 * @param {*} targetTestFolder Target folder to test headers against
 * @returns
 */
function getHeaderFilesFromPodspecs(
  rootFolder /*:string*/,
) /*: { [key: string]: HeaderMap[] }*/ {
  // Get podspec files in the configuration mapped to configurations
  const podSpecFiles = Object.keys(PodSpecConfigurations).map(podspecPath =>
    path.resolve(rootFolder, podspecPath),
  );

  headersLog('🔍 Collecting header files from podspec configurations...');

  const headerMaps /*: { [key: string]: HeaderMap[] }*/ = {};

  podSpecFiles.forEach(podspecPath => {
    const key = path.relative(rootFolder, podspecPath);
    const podSpecConfig = PodSpecConfigurations[key];
    if (
      !podSpecConfig ||
      'name' in podSpecConfig === false ||
      podSpecConfig.name === ''
    ) {
      headersLog(
        `⚠️ Skipping podspec at ${podspecPath} due to missing or invalid configuration.`,
      );
      return;
    }

    const podSpecDirectory = path.dirname(podspecPath);

    // Now we can start collecting header files
    const processConfig = (
      config /*: PodSpecConfiguration */,
      parents /*: Array<PodSpecConfiguration>*/,
    ) => {
      const {headerDir, headerPatterns, excludePatterns, subSpecs} = config;

      // Find header files for configuration
      const foundHeaderFiles = headerPatterns
        .map(pattern =>
          globSync(pattern, {
            cwd: podSpecDirectory,
            absolute: true,
            ignore: excludePatterns || [],
          }),
        )
        .flat();

      let resolvedHeaderDir /*:string */ = headerDir || '';

      // If headerDir is not set, we need to resolve it against parent specs
      if (parents.length > 0 && !headerDir) {
        for (let i = parents.length - 1; i >= 0; i--) {
          const parentHeaderDir = parents[i].headerDir;
          if (parentHeaderDir) {
            resolvedHeaderDir = parentHeaderDir;
            break;
          }
        }
      }

      // If still not resolved, default to spec name
      if (!resolvedHeaderDir) {
        resolvedHeaderDir = '';
      }

      // Resolve preservePaths from parent specs too
      let resolvedPreservePaths = config.preservePaths || [];
      if (resolvedPreservePaths.length === 0 && parents.length > 0) {
        for (let i = parents.length - 1; i >= 0; i--) {
          const parentPreservePaths = parents[i].preservePaths;
          if (parentPreservePaths && parentPreservePaths.length > 0) {
            resolvedPreservePaths = parentPreservePaths;
            break;
          }
        }
      }

      headerMaps[podspecPath] = (headerMaps[podspecPath] || []).concat({
        headerDir: resolvedHeaderDir,
        specName: podSpecConfig.name,
        headers: foundHeaderFiles.map(headerFile => {
          // Check if we have preservePath set for this file - then we need to get the subfolder structure too
          // and not just copy to the root of headerDir - we should also ignore the headerDir part of the path
          const isPreserved = resolvedPreservePaths.some(preservePattern => {
            return globSync(preservePattern, {
              cwd: podSpecDirectory,
              absolute: true,
              ignore: excludePatterns || [],
            }).includes(headerFile);
          });

          if (isPreserved) {
            // Get the subfolder for the header file
            const relativePath = path.dirname(
              path.relative(podSpecDirectory, headerFile),
            );
            return {
              source: headerFile,
              target: path.join(relativePath, path.basename(headerFile)),
            };
          }
          return {
            source: headerFile,
            target: path.join(resolvedHeaderDir, path.basename(headerFile)),
          };
        }),
      });

      // Process subSpecs recursively
      if (subSpecs && subSpecs.length > 0) {
        subSpecs.forEach(subSpecConfig => {
          processConfig(subSpecConfig, [config, ...parents]);
        });
      }
    };

    processConfig(podSpecConfig, []);
  });

  return headerMaps;
}

module.exports = {
  getHeaderFilesFromPodspecs,
};
