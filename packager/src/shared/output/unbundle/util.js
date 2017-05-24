/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const invariant = require('fbjs/lib/invariant');

import type {FBIndexMap, IndexMap, MappingsMap, SourceMap} from '../../../lib/SourceMap';
import type {ModuleGroups, ModuleTransportLike} from '../../types.flow';

const newline = /\r\n?|\n|\u2028|\u2029/g;
// fastest implementation
const countLines = (string: string) => (string.match(newline) || []).length + 1;


function lineToLineSourceMap(source: string, filename: string = ''): MappingsMap {
  // The first line mapping in our package is the base64vlq code for zeros (A).
  const firstLine = 'AAAA;';

  // Most other lines in our mappings are all zeros (for module, column etc)
  // except for the lineno mapping: curLineno - prevLineno = 1; Which is C.
  const line = 'AACA;';

  return {
    file: filename,
    mappings: firstLine + Array(countLines(source)).join(line),
    sources: [filename],
    names: [],
    version: 3,
  };
}

const wrapperEnd = wrappedCode => wrappedCode.indexOf('{') + 1;

const Section =
  (line: number, column: number, map: SourceMap) =>
    ({map, offset: {line, column}});

type CombineOptions = {fixWrapperOffset: boolean};

function combineSourceMaps(
  modules: $ReadOnlyArray<ModuleTransportLike>,
  moduleGroups?: ModuleGroups,
  options?: ?CombineOptions,
): IndexMap {
  const sections = combineMaps(modules, null, moduleGroups, options);
  return {sections, version: 3};
}

function combineSourceMapsAddingOffsets(
  modules: $ReadOnlyArray<ModuleTransportLike>,
  moduleGroups?: ?ModuleGroups,
  options?: ?CombineOptions,
): FBIndexMap {
  const x_facebook_offsets = [];
  const sections = combineMaps(modules, x_facebook_offsets, moduleGroups, options);
  return {sections, version: 3, x_facebook_offsets};
}

function combineMaps(modules, offsets: ?Array<number>, moduleGroups, options) {
  const sections = [];

  let line = 0;
  modules.forEach(moduleTransport => {
    const {code, id, name} = moduleTransport;
    let column = 0;
    let group;
    let groupLines = 0;
    let {map} = moduleTransport;

    if (moduleGroups && moduleGroups.modulesInGroups.has(id)) {
      // this is a module appended to another module
      return;
    }


    if (offsets != null) {
      group = moduleGroups && moduleGroups.groups.get(id);
      if (group && moduleGroups) {
        const {modulesById} = moduleGroups;
        const otherModules: $ReadOnlyArray<ModuleTransportLike> =
          Array.from(group || [])
            .map(moduleId => modulesById.get(moduleId))
            .filter(Boolean); // needed to appease flow
        otherModules.forEach(m => {
          groupLines += countLines(m.code);
        });
        map = combineSourceMaps([moduleTransport].concat(otherModules));
      }

      column = options && options.fixWrapperOffset ? wrapperEnd(code) : 0;
    }

    invariant(
      !Array.isArray(map),
      'Random Access Bundle source maps cannot be built from raw mappings',
    );
    sections.push(Section(line, column, map || lineToLineSourceMap(code, name)));
    if (offsets != null && id != null) {
      offsets[id] = line;
      for (const moduleId of group || []) {
        offsets[moduleId] = line;
      }
    }
    line += countLines(code) + groupLines;
  });

  return sections;
}

const joinModules =
  (modules: $ReadOnlyArray<{+code: string}>): string =>
    modules.map(m => m.code).join('\n');

module.exports = {
  combineSourceMaps,
  combineSourceMapsAddingOffsets,
  countLines,
  joinModules,
  lineToLineSourceMap,
};
