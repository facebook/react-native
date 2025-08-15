/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// Adapted from https://github.com/ChromeDevTools/devtools-protocol/blob/master/types/protocol.d.ts

import type {JSONSerializable} from '../types';

type integer = number;

export interface Debugger {
  GetScriptSourceParams: {
    /**
     * Id of the script to get source for.
     */
    scriptId: string,
  };

  GetScriptSourceResult: {
    /**
     * Script source (empty in case of Wasm bytecode).
     */
    scriptSource: string,

    /**
     * Wasm bytecode. (Encoded as a base64 string when passed over JSON)
     */
    bytecode?: string,
  };

  SetBreakpointByUrlParams: {
    /**
     * Line number to set breakpoint at.
     */
    lineNumber: integer,

    /**
     * URL of the resources to set breakpoint on.
     */
    url?: string,

    /**
     * Regex pattern for the URLs of the resources to set breakpoints on. Either `url` or
     * `urlRegex` must be specified.
     */
    urlRegex?: string,

    /**
     * Script hash of the resources to set breakpoint on.
     */
    scriptHash?: string,

    /**
     * Offset in the line to set breakpoint at.
     */
    columnNumber?: integer,

    /**
     * Expression to use as a breakpoint condition. When specified, debugger will only stop on the
     * breakpoint if this expression evaluates to true.
     */
    condition?: string,
  };

  ScriptParsedEvent: {
    /**
     * Identifier of the script parsed.
     */
    scriptId: string,

    /**
     * URL or name of the script parsed (if any).
     */
    url: string,

    /**
     * URL of source map associated with script (if any).
     */
    sourceMapURL: string,
  };

  ConsoleAPICalled: {
    args: Array<{type: string, value: string}>,
    executionContextId: number,
    stackTrace: {
      timestamp: number,
      type: string,
      callFrames: Array<{
        columnNumber: number,
        lineNumber: number,
        functionName: string,
        scriptId: string,
        url: string,
      }>,
    },
  };
}

export type Events = {
  'Debugger.scriptParsed': Debugger['ScriptParsedEvent'],
  'Runtime.consoleAPICalled': Debugger['ConsoleAPICalled'],
  [method: string]: JSONSerializable,
};

export type Commands = {
  'Debugger.getScriptSource': {
    paramsType: Debugger['GetScriptSourceParams'],
    resultType: Debugger['GetScriptSourceResult'],
  },
  'Debugger.setBreakpointByUrl': {
    paramsType: Debugger['SetBreakpointByUrlParams'],
    resultType: void,
  },
  [method: string]: {
    paramsType: JSONSerializable,
    resultType: JSONSerializable,
  },
};
