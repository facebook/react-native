/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

declare module 'react-native/Libraries/Core/Devtools/parseErrorStack' {
  export type StackFrame = {
    file: string;
    methodName: string;
    lineNumber: number;
    column: number | null;
  };

  export interface ExtendedError extends Error {
    framesToPop?: number | undefined;
  }

  export default function parseErrorStack(error: ExtendedError): StackFrame[];
}

declare module 'react-native/Libraries/Core/Devtools/symbolicateStackTrace' {
  import {StackFrame} from 'react-native/Libraries/Core/Devtools/parseErrorStack';

  export default function symbolicateStackTrace(
    stack: ReadonlyArray<StackFrame>,
    extraData?: any,
  ): Promise<StackFrame[]>;
}
