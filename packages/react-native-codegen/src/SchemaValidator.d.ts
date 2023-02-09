/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SchemaType } from "./CodegenSchema";

export function getErrors(schema: SchemaType): readonly string[];
export function validate(schema: SchemaType): void;
