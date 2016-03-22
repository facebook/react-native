/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const newline = /\r\n?|\n|\u2028|\u2029/g;
const countLines =
  string => (string.match(newline) || []).length + 1; // fastest implementation

function lineToLineSourceMap(source, filename) {
  // The first line mapping in our package is the base64vlq code for zeros (A).
  const firstLine = 'AAAA;';

  // Most other lines in our mappings are all zeros (for module, column etc)
  // except for the lineno mappinp: curLineno - prevLineno = 1; Which is C.
  const line = 'AACA;';

  return {
    version: 3,
    sources: [filename],
    mappings: firstLine + Array(countLines(source)).join(line),
  };
}

const wrapperEnd = wrappedCode => wrappedCode.indexOf('{') + 1;

const Section = (line, column, map) => ({map, offset: {line, column}});

function combineSourceMaps({modules, withCustomOffsets}) {
  let offsets;
  const sections = [];
  const sourceMap = {
    version: 3,
    sections,
  };

  if (withCustomOffsets) {
    offsets = sourceMap.x_facebook_offsets = [];
  }

  let line = 0;
  modules.forEach(({code, id, map, name}) => {
    const hasOffset = withCustomOffsets && id != null;
    const column = hasOffset ? wrapperEnd(code) : 0;
    sections.push(Section(line, column, map || lineToLineSourceMap(code, name)));
    if (hasOffset) {
      offsets[id] = line;
    }
    line += countLines(code);
  });

  return sourceMap;
}

module.exports = {countLines, lineToLineSourceMap, combineSourceMaps};
