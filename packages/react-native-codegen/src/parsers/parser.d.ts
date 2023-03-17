/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SchemaType } from '../CodegenSchema';
import type { ParserType } from './errors';

// useful members only for downstream
export interface Parser {
    language(): ParserType;
    parseFile(filename: string): SchemaType;
    parseString(contents: string, filename?: string): SchemaType;
    parseModuleFixture(filename: string): SchemaType;
}
