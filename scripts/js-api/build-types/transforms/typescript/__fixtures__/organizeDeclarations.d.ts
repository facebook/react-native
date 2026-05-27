/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

declare type Foo =
  | "A"
  | "B"
declare type Bar =
  | null
  | string
  | number;
declare class Baz {
  foo: string;
}
declare function fn(): void;

export declare type ExportedFoo =
  | "A"
  | "B"
export declare type ExportedBar =
  | null
  | string
  | number;
export declare class ExportedBaz {
  foo: string;
}
export declare function exportedFn(): void;
