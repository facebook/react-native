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

declare var jest: any;
jest.disableAutomock();

const indexedRamBundle = require('../indexed-ram-bundle');

declare var describe: any;
declare var expect: any;
declare var it: (string, () => ?Promise<any>) => void;
declare var beforeAll: (() => ?Promise<any>) => void;

let code: Buffer;
let map;
let ids, modules, requireCall;
const idForPath = ({path}) => getId(path);
beforeAll(() => {
  modules = [
    makeModule('a', [], 'script'),
    makeModule('b', ['c']),
    makeModule('c', ['f']),
    makeModule('d', ['e']),
    makeModule('e'),
    makeModule('f'),
  ];
  requireCall = makeModule('r', [], 'script', 'require(1);');

  ids = new Map(modules.map(({file}, i) => [file.path, i]));
  ({code, map} = createRamBundle());
});

it('starts the bundle file with the magic number', () => {
  expect(code.readUInt32LE(0)).toBe(0xFB0BD1E5);
});

it('contains the number of modules in the module table', () => {
  expect(code.readUInt32LE(SIZEOF_INT32)).toBe(modules.length);
});

it('has the length correct of the startup section', () => {
  expect(code.readUInt32LE(SIZEOF_INT32 * 2))
    .toBe(requireCall.file.code.length + 1);
});

it('contains the code after the offset table', () => {
  const {codeOffset, startupSectionLength, table} = parseOffsetTable(code);

  const startupSection =
    code.slice(codeOffset, codeOffset + startupSectionLength - 1);
  expect(startupSection.toString()).toBe(requireCall.file.code);

  table.forEach(([offset, length], i) => {
    const moduleCode =
      code.slice(codeOffset + offset, codeOffset + offset + length - 1);
    expect(moduleCode.toString()).toBe(modules[i].file.code);
  });
});

it('creates a source map', () => {
  let line = countLines(requireCall);
  expect(map.sections.slice(1)).toEqual(modules.map(m => {
    const section = {
      map: m.file.map || lineByLineMap(m.file.path),
      offset: {column: 0, line},
    };
    line += countLines(m);
    return section;
  }));
  expect(map.x_facebook_offsets).toEqual([1, 2, 3, 4, 5, 6]);
});

describe('Startup section optimization', () => {
  let last, preloaded;
  beforeAll(() => {
    last = modules[modules.length - 1];
    preloaded = [modules[2], modules[3], last];
    ({code, map} = createRamBundle(new Set(preloaded.map(getPath))));
  });

  it('supports additional modules in the startup section', () => {
    const {codeOffset, startupSectionLength, table} = parseOffsetTable(code);

    const startupSection =
      code.slice(codeOffset, codeOffset + startupSectionLength - 1);
    expect(startupSection.toString())
      .toBe(preloaded.concat([requireCall]).map(getCode).join('\n'));


    preloaded.forEach(m => {
      const idx = idForPath(m.file);
      expect(table[idx]).toEqual(m === last ? undefined : [0, 0]);
    });

    table.forEach(([offset, length], i) => {
      if (offset !== 0 && length !== 0) {
        const moduleCode =
          code.slice(codeOffset + offset, codeOffset + offset + length - 1);
        expect(moduleCode.toString()).toBe(modules[i].file.code);
      }
    });
  });

  it('reflects additional sources in the startup section in the source map', () => {
    let line = preloaded.reduce(
      (l, m) => l + countLines(m),
      countLines(requireCall),
    );

    expect(map.x_facebook_offsets).toEqual([4, 5,,, 6]); // eslint-disable-line no-sparse-arrays

    expect(map.sections.slice(1)).toEqual(
      modules
        .filter(not(Set.prototype.has), new Set(preloaded))
        .map(m => {
          const section = {
            map: m.file.map || lineByLineMap(m.file.path),
            offset: {column: 0, line},
          };
          line += countLines(m);
          return section;
        }
    ));
  });
});

describe('RAM groups / common sections', () => {
  let groups, groupHeads;
  beforeAll(() => {
    groups = [
      [modules[1], modules[2], modules[5]],
      [modules[3], modules[4]],
    ];
    groupHeads = groups.map(g => g[0]);
    ({code, map} = createRamBundle(undefined, groupHeads.map(getPath)));
  });

  it('supports grouping the transitive dependencies of files into common sections', () => {
    const {codeOffset, table} = parseOffsetTable(code);

    groups.forEach(group => {
      const [head, ...deps] = group.map(x => idForPath(x.file));
      const groupEntry = table[head];
      deps.forEach(id => expect(table[id]).toEqual(groupEntry));

      const [offset, length] = groupEntry;
      const groupCode = code.slice(codeOffset + offset, codeOffset + offset + length - 1);
      expect(groupCode.toString())
        .toEqual(group.map(m => m.file.code).join('\n'));
    });
  });

  it('reflects section groups in the source map', () => {
    expect(map.x_facebook_offsets).toEqual([1, 2, 2, 5, 5, 2]);
    const maps = map.sections.slice(-2);
    const toplevelOffsets = [2, 5];

    maps.map((groupMap, i) => [groups[i], groupMap]).forEach(([group, groupMap], i) => {
      const offsets = group.reduce(moduleLineOffsets, [])[0];
      expect(groupMap).toEqual({
        map: {
          version: 3,
          sections: group.map((module, j) => ({
            map: module.file.map,
            offset: {line: offsets[j], column: 0},
          })),
        },
        offset: {line: toplevelOffsets[i], column: 0},
      });
    });
  });

  function moduleLineOffsets([offsets = [], line = 0], module) {
    return [[...offsets, line], line + countLines(module)];
  }
});

function createRamBundle(preloadedModules = new Set(), ramGroups) {
  const build = indexedRamBundle.createBuilder(preloadedModules, ramGroups);
  const result = build({
    filename: 'arbitrary/filename.js',
    idForPath,
    modules,
    requireCalls: [requireCall],
  });

  if (typeof result.code === 'string') {
    throw new Error('Expected a buffer, not a string');
  }
  return {code: result.code, map: result.map};
}

function makeModule(name, deps = [], type = 'module', moduleCode = `var ${name};`) {
  const path = makeModulePath(name);
  return {
    dependencies: deps.map(makeDependency),
    file: {
      code: type === 'module' ? makeModuleCode(moduleCode) : moduleCode,
      map: type !== 'module'
        ? null
        : makeModuleMap(name, path),
      path,
      type,
    },
  };
}

function makeModuleMap(name, path) {
  return {
    version: 3,
    mappings: Array(parseInt(name, 36) + 1).join(','),
    names: [name],
    sources: [path],
  };
}

function makeModuleCode(moduleCode) {
  return `__d(() => {${moduleCode}})`;
}

function makeModulePath(name) {
  return `/${name}.js`;
}

function makeDependency(name) {
  const path = makeModulePath(name);
  return {
    id: name,
    path,
  };
}

function getId(path) {
  if (path === requireCall.file.path) {
    return -1;
  }

  const id = ids.get(path);
  if (id == null) {
    throw new Error(`Unknown file: ${path}`);
  }
  return id;
}

function getCode(module) {
  return module.file.code;
}

function getPath(module) {
  return module.file.path;
}

const SIZEOF_INT32 = 4;
function parseOffsetTable(buffer) {
  const n = buffer.readUInt32LE(SIZEOF_INT32);
  const startupSectionLength = buffer.readUInt32LE(SIZEOF_INT32 * 2);
  const baseOffset = SIZEOF_INT32 * 3;
  const table = Array(n);
  for (let i = 0; i < n; ++i) {
    const offset = baseOffset + i * 2 * SIZEOF_INT32;
    table[i] = [buffer.readUInt32LE(offset), buffer.readUInt32LE(offset + SIZEOF_INT32)];
  }
  return {
    codeOffset: baseOffset + n * 2 * SIZEOF_INT32,
    startupSectionLength,
    table,
  };
}

function countLines(module) {
  return module.file.code.split('\n').length;
}

function lineByLineMap(file) {
  return {
    file: file,
    mappings: 'AAAA;',
    names: [],
    sources: [file],
    version: 3,
  };
}

const not = fn => function() { return !fn.apply(this, arguments); };
