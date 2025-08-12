/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type A = {
  bFn: () => void,
  aFn: () => void,
  bMethod(): void;
  aMethod(): void;
  b: string,
  a: string,
  "ba": string,
  "ab": string,
}

interface B {
  bFn: () => void,
  aFn: () => void,
  bMethod(): void;
  aMethod(): void;
  b: string,
  a: string,
}

declare class C {
  bFn: () => void;
  aFn: () => void;
  bMethod(): void;
  aMethod(): void;
  b: string;
  a: string;
  #d: string;
  #c: string;
}

type Fn = (arg: {
  bFn: () => void,
  aFn: () => void,
  bMethod(): void;
  aMethod(): void;
  b: string,
  a: string,
}) => void;

enum E {
  C,
  B,
  A,
}

enum F {
  C = 3,
  B = 2,
  A = 1,
}
