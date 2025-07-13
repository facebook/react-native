/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  DiffSummary,
  ExportableSchemaDiff,
  FormattedDiffSummary,
  SchemaDiff,
} from './DiffResults';
import type {SchemaType} from '@react-native/codegen/src/CodegenSchema';

import {schemaDiffExporter} from './DiffResults.js';
import {formatDiffSet} from './ErrorFormatting.js';
import {buildSchemaDiff, summarizeDiffSet} from './VersionDiffing.js';

class CompatCheckResult {
  #schemaDiff: Set<SchemaDiff>;
  #summary: ?DiffSummary;

  constructor(schemaDiff: Set<SchemaDiff>) {
    this.#schemaDiff = schemaDiff;
  }

  getSummary(): DiffSummary {
    if (this.#summary == null) {
      this.#summary = summarizeDiffSet(this.#schemaDiff);
    }

    return this.#summary;
  }

  getErrors(): FormattedDiffSummary {
    return formatDiffSet(this.getSummary());
  }

  getDebugInfo(): Array<ExportableSchemaDiff> {
    return Array.from(this.#schemaDiff, schemaDiffExporter);
  }
}

export function compareSchemas(
  newSchema: SchemaType,
  oldSchema: SchemaType,
): CompatCheckResult {
  return new CompatCheckResult(buildSchemaDiff(newSchema, oldSchema));
}
