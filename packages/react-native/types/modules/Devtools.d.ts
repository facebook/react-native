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

  export default function parseErrorStack(stack: string): StackFrame[];
}

declare module 'react-native/Libraries/Core/Devtools/symbolicateStackTrace' {
  import {StackFrame} from 'react-native/Libraries/Core/Devtools/parseErrorStack';

  export type SymbolicatedStack = {
    stack: StackFrame[];
    codeFrame?: CodeFrame | undefined;
  };

  export type CodeFrame = {
    content: string;
    location?:
      | {
          row: number;
          column: number;
        }
      | undefined;
    fileName: string;
  };

  export default function symbolicateStackTrace(
    stack: ReadonlyArray<StackFrame>,
    extraData?: any,
  ): Promise<SymbolicatedStack>;
}
