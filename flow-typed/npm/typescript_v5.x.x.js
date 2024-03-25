/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

declare module 'typescript' {
  declare enum ModuleResolutionKind {
    Classic = 'Classic',
    NodeJs = 'NodeJs',
    Node10 = 'Node10',
    Node16 = 'Node16',
    NodeNext = 'NodeNext',
    Bundler = 'Bundler',
  }

  declare type SourceFile = $ReadOnly<{
    fileName: string,
    text: string,
    ...
  }>;

  declare type Diagnostic = $ReadOnly<{
    file?: SourceFile,
    start?: number,
    messageText: string,
    ...
  }>;

  declare type EmitResult = $ReadOnly<{
    diagnostics: Array<Diagnostic>,
    ...
  }>;

  declare type Program = $ReadOnly<{
    emit: () => EmitResult,
    ...
  }>;

  declare type TypeScriptAPI = {
    createProgram(files: Array<string>, compilerOptions: Object): Program,
    flattenDiagnosticMessageText: (...messageText: Array<string>) => string,
    getLineAndCharacterOfPosition(
      file: SourceFile,
      start?: number,
    ): $ReadOnly<{line: number, character: number}>,
    ModuleResolutionKind: typeof ModuleResolutionKind,
    ...
  };

  declare module.exports: TypeScriptAPI;
}
