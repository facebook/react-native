/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type AFoo = unknown;
type BFoo = unknown;
type CFoo = unknown;
type DFoo = unknown;

type A = string | number;
type B = DFoo | CFoo | BFoo | AFoo;
type C = AFoo | BFoo | CFoo | DFoo;
type D = BFoo | string | number | BFoo;
type E = string | number | BFoo | AFoo | { foo: string } | { bar: string };
type F = "D" | "C" | "B" | "A";
type G = 3 | 2 | 1 | 0 | "D" | "C" | "B" | "A";
