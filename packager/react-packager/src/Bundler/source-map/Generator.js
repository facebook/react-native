/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const B64Builder = require('./B64Builder');

import type {SourceMap} from 'babel-core';

/**
 * Generates a source map from raw mappings.
 *
 * Raw mappings are a set of 2, 4, or five elements:
 *
 * - line and column number in the generated source
 * - line and column number in the original source
 * - symbol name in the original source
 *
 * Mappings have to be passed in the order appearance in the generated source.
 */
class Generator {
  builder: B64Builder;
  last: {|
    generatedColumn: number,
    generatedLine: number,
    name: number,
    source: number,
    sourceColumn: number,
    sourceLine: number,
  |};
  names: IndexedSet;
  source: number;
  sources: Array<string>;
  sourcesContent: Array<string>;

  constructor() {
    this.builder = new B64Builder();
    this.last = {
      generatedColumn: 0,
      generatedLine: 1, // lines are passed in 1-indexed
      name: 0,
      source: 0,
      sourceColumn: 0,
      sourceLine: 1,
    };
    this.names = new IndexedSet();
    this.source = -1;
    this.sources = [];
    this.sourcesContent = [];
  }

  /**
   * Mark the beginning of a new source file.
   */
  startFile(file: string, code: string) {
    this.source = this.sources.push(file) - 1;
    this.sourcesContent.push(code);
  }

  /**
   * Mark the end of the current source file
   */
  endFile() {
    this.source = -1;
  }

  /**
   * Adds a mapping for generated code without a corresponding source location.
   */
  addSimpleMapping(generatedLine: number, generatedColumn: number): void {
    const last = this.last;
    if (this.source === -1 ||
        generatedLine === last.generatedLine &&
        generatedColumn < last.generatedColumn ||
        generatedLine < last.generatedLine) {
      const msg = this.source === -1
        ? 'Cannot add mapping before starting a file with `addFile()`'
        : 'Mapping is for a position preceding an earlier mapping';
      throw new Error(msg);
    }

    if (generatedLine > last.generatedLine) {
      this.builder.markLines(generatedLine - last.generatedLine);
      last.generatedLine = generatedLine;
      last.generatedColumn = 0;
    }

    this.builder.startSegment(generatedColumn - last.generatedColumn);
    last.generatedColumn = generatedColumn;
  }

  /**
   * Adds a mapping for generated code with a corresponding source location.
   */
  addSourceMapping(
    generatedLine: number,
    generatedColumn: number,
    sourceLine: number,
    sourceColumn: number,
  ): void {
    this.addSimpleMapping(generatedLine, generatedColumn);

    const last = this.last;
    this.builder
      .append(this.source - last.source)
      .append(sourceLine - last.sourceLine)
      .append(sourceColumn - last.sourceColumn);

    last.source = this.source;
    last.sourceColumn = sourceColumn;
    last.sourceLine = sourceLine;
  }

  /**
   * Adds a mapping for code with a corresponding source location + symbol name.
   */
  addNamedSourceMapping(
    generatedLine: number,
    generatedColumn: number,
    sourceLine: number,
    sourceColumn: number,
    name: string,
  ): void {
    this.addSourceMapping(
      generatedLine, generatedColumn, sourceLine, sourceColumn);

    const last = this.last;
    const nameIndex = this.names.indexFor(name);
    this.builder.append(nameIndex - last.name);
    last.name = nameIndex;
  }

  /**
   * Return the source map as object.
   */
  toMap(file?: string): SourceMap {
    return {
      version: 3,
      file,
      sources: this.sources.slice(),
      sourcesContent: this.sourcesContent.slice(),
      names: this.names.items(),
      mappings: this.builder.toString(),
    };
  }

  /**
   * Return the source map as string.
   *
   * This is ~2.5x faster than calling `JSON.stringify(generator.toMap())`
   */
  toString(file?: string): string {
    return ('{' +
      '"version":3,' +
      (file ? `"file":${JSON.stringify(file)},` : '') +
      `"sources":${JSON.stringify(this.sources)},` +
      `"sourcesContent":${JSON.stringify(this.sourcesContent)},` +
      `"names":${JSON.stringify(this.names.items())},` +
      `"mappings":"${this.builder.toString()}"` +
    '}');
  }
}

class IndexedSet {
  map: Map<string, number>;
  nextIndex: number;

  constructor() {
    this.map = new Map();
    this.nextIndex = 0;
  }

  indexFor(x: string) {
    let index = this.map.get(x);
    if (index == null) {
      index = this.nextIndex++;
      this.map.set(x, index);
    }
    return index;
  }

  items() {
    return Array.from(this.map.keys());
  }
}

module.exports = Generator;
