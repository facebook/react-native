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

/*:: import type {ProjectFiles, PbxprojSections} from './spm-types'; */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Deterministic UUID generation
// ---------------------------------------------------------------------------

/**
 * Generate a deterministic 24-hex-character UUID from a seed string.
 * Uses MD5 hash truncated to 24 chars (standard Xcode pbxproj UUID length).
 */
function generateUUID(seed /*: string */) /*: string */ {
  return crypto
    .createHash('md5')
    .update(seed)
    .digest('hex')
    .substring(0, 24)
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// File type mapping
// ---------------------------------------------------------------------------

const FILE_TYPE_MAP /*: {[string]: string} */ = {
  '.m': 'sourcecode.c.objc',
  '.mm': 'sourcecode.cpp.objcpp',
  '.c': 'sourcecode.c.c',
  '.cpp': 'sourcecode.cpp.cpp',
  '.swift': 'sourcecode.swift',
  '.h': 'sourcecode.c.h',
  '.hpp': 'sourcecode.cpp.h',
  '.plist': 'text.plist.xml',
  '.storyboard': 'file.storyboard',
  '.xib': 'file.xib',
  '.xcassets': 'folder.assetcatalog',
  '.bundle': '"wrapper.plug-in"',
  '.xcprivacy': 'text.plist.xml',
  '.png': 'image.png',
  '.jpg': 'image.jpeg',
  '.json': 'text.json',
  '.js': 'sourcecode.javascript',
  '.entitlements': 'text.plist.entitlements',
};

/**
 * Map a file extension to its Xcode file type identifier.
 */
function fileTypeForExtension(ext /*: string */) /*: string */ {
  return FILE_TYPE_MAP[ext] ?? 'file';
}

// ---------------------------------------------------------------------------
// Project file scanner
// ---------------------------------------------------------------------------

/**
 * Scans a source directory and categorizes files for xcodeproj generation.
 * Returns sources (.m, .mm, .swift, .cpp, .c), headers (.h),
 * resources (.xcassets, .storyboard, .bundle, .xcprivacy, .png), and plists (.plist).
 *
 * Paths returned are relative to sourceDir.
 */
function scanProjectFiles(sourceDir /*: string */) /*: ProjectFiles */ {
  const sources /*: Array<string> */ = [];
  const headers /*: Array<string> */ = [];
  const resources /*: Array<string> */ = [];
  const plists /*: Array<string> */ = [];

  const sourceExts = new Set(['.m', '.mm', '.swift', '.cpp', '.c']);
  const headerExts = new Set(['.h', '.hpp']);
  const resourceExts = new Set([
    '.xcassets',
    '.storyboard',
    '.xib',
    '.bundle',
    '.xcprivacy',
    '.png',
    '.jpg',
  ]);

  function walk(dir /*: string */, relBase /*: string */) /*: void */ {
    if (!fs.existsSync(dir)) {
      return;
    }
    // $FlowFixMe[incompatible-type]
    const entries /*: Array<{name: string, isDirectory(): boolean}> */ =
      // $FlowFixMe[unclear-type]
      (fs.readdirSync(dir, {withFileTypes: true}) /*: any */);
    for (const entry of entries) {
      if (entry.name.startsWith('.')) {
        continue;
      }
      const full = path.join(dir, entry.name);
      const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
      const ext = path.extname(entry.name);

      if (entry.isDirectory()) {
        // .xcassets and .bundle are treated as single resources, not walked into
        if (ext === '.xcassets' || ext === '.bundle') {
          resources.push(rel);
        } else {
          walk(full, rel);
        }
      } else {
        if (sourceExts.has(ext)) {
          sources.push(rel);
        } else if (headerExts.has(ext)) {
          headers.push(rel);
        } else if (resourceExts.has(ext)) {
          resources.push(rel);
        } else if (ext === '.plist') {
          plists.push(rel);
        }
      }
    }
  }

  walk(sourceDir, '');
  return {sources, headers, resources, plists};
}

// ---------------------------------------------------------------------------
// pbxproj serializer
// ---------------------------------------------------------------------------

/**
 * Escapes a string for OpenStep plist format if needed.
 */
function quoteIfNeeded(s /*: string */) /*: string */ {
  if (/^[a-zA-Z0-9._/]+$/.test(s)) {
    return s;
  }
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

/**
 * Serialize a sections object into Xcode's OpenStep ASCII plist format.
 *
 * sections is an object mapping section names (e.g. "PBXBuildFile") to
 * arrays of {uuid, comment, fields} entries. fields is an object mapping
 * field names to string values (already formatted for plist output).
 */
function serializePbxproj(
  archiveVersion /*: string */,
  objectVersion /*: string */,
  rootObjectUUID /*: string */,
  sections /*: PbxprojSections */,
) /*: string */ {
  let out = `// !$*UTF8*$!\n{\n`;
  out += `\tarchiveVersion = ${archiveVersion};\n`;
  out += `\tclasses = {\n\t};\n`;
  out += `\tobjectVersion = ${objectVersion};\n`;
  out += `\tobjects = {\n\n`;

  const sectionOrder = [
    'PBXBuildFile',
    'PBXFileReference',
    'PBXFrameworksBuildPhase',
    'PBXGroup',
    'PBXNativeTarget',
    'PBXProject',
    'PBXResourcesBuildPhase',
    'PBXShellScriptBuildPhase',
    'PBXSourcesBuildPhase',
    'XCBuildConfiguration',
    'XCConfigurationList',
    'XCLocalSwiftPackageReference',
    'XCSwiftPackageProductDependency',
  ];

  for (const sectionName of sectionOrder) {
    const entries = sections[sectionName];
    if (!entries || entries.length === 0) {
      continue;
    }

    out += `/* Begin ${sectionName} section */\n`;
    for (const entry of entries) {
      const comment = entry.comment ? ` /* ${entry.comment} */` : '';
      out += `\t\t${entry.uuid}${comment} = {`;

      const fieldKeys = Object.keys(entry.fields);
      if (fieldKeys.length <= 3 && !fieldKeys.some(k => entry.fields[k].includes('\n'))) {
        // Single-line format for short entries
        out += fieldKeys.map(k => `${k} = ${entry.fields[k]};`).join(' ');
        out += `};\n`;
      } else {
        out += '\n';
        for (const key of fieldKeys) {
          const val = entry.fields[key];
          if (val.includes('\n\t\t\t')) {
            // Multi-line value (e.g. buildSettings block) — already indented
            out += `\t\t\t${key} = ${val};\n`;
          } else {
            out += `\t\t\t${key} = ${val};\n`;
          }
        }
        out += `\t\t};\n`;
      }
    }
    out += `/* End ${sectionName} section */\n\n`;
  }

  out += `\t};\n`;
  out += `\trootObject = ${rootObjectUUID};\n`;
  out += `}\n`;

  return out;
}

module.exports = {
  generateUUID,
  fileTypeForExtension,
  scanProjectFiles,
  serializePbxproj,
  quoteIfNeeded,
};
