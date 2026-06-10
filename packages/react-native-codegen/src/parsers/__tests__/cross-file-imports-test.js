/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {FlowParser} = require('../flow/parser');
const {TypeScriptParser} = require('../typescript/parser');

const SHARED_ENUM_TYPES_FLOW = `
/**
 * @flow strict-local
 * @format
 */

export enum SharedStatusEnum {
  Active = 'active',
  Paused = 'paused',
  Off = 'off',
}

export enum SharedNumEnum {
  One = 1,
  Two = 2,
  Three = 3,
}

export type SharedStateType = {
  status: SharedStatusEnum,
  count: number,
};
`;

const SPEC_WITH_IMPORTS_FLOW = `
/**
 * @flow strict-local
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import type {SharedStatusEnum, SharedNumEnum, SharedStateType} from './SharedEnumTypes';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getStatus: (statusProp: SharedStateType) => SharedStatusEnum;
  +getNum: () => SharedNumEnum;
  +setStatus: (status: SharedStatusEnum) => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'NativeImportedEnumTurboModule',
): Spec);
`;

const SHARED_ENUM_TYPES_TS = `
export enum SharedStatusEnum {
  Active = 'active',
  Paused = 'paused',
  Off = 'off',
}

export enum SharedNumEnum {
  One = 1,
  Two = 2,
  Three = 3,
}

export type SharedStateType = {
  status: SharedStatusEnum;
  count: number;
};
`;

const SPEC_WITH_IMPORTS_TS = `
import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import type {SharedStatusEnum, SharedNumEnum, SharedStateType} from './SharedEnumTypes';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  getStatus(statusProp: SharedStateType): SharedStatusEnum;
  getNum(): SharedNumEnum;
  setStatus(status: SharedStatusEnum): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeImportedEnumTurboModule',
);
`;

function getNativeModule(schema: $FlowFixMe, moduleName: string): $FlowFixMe {
  const module = schema.modules[moduleName];
  if (module == null) {
    throw new Error(`Module ${moduleName} not found in schema`);
  }
  return module;
}

describe('Cross-file type imports', () => {
  describe('FlowParser', () => {
    const parser = new FlowParser();

    it('should parse a spec with imported enums via parseString with importedTypes', () => {
      // First, parse the shared types file to get its TypeDeclarationMap
      const sharedAst = parser.getAst(SHARED_ENUM_TYPES_FLOW);
      const sharedTypes = parser.getTypes(sharedAst);

      // Verify we got the shared types
      expect(sharedTypes.SharedStatusEnum).toBeDefined();
      expect(sharedTypes.SharedNumEnum).toBeDefined();
      expect(sharedTypes.SharedStateType).toBeDefined();

      // Now parse the spec file, passing the shared types as importedTypes
      const importedTypeSourceMap = {
        SharedStatusEnum: 'SharedEnumTypes',
        SharedNumEnum: 'SharedEnumTypes',
        SharedStateType: 'SharedEnumTypes',
      };
      const schema = parser.parseString(
        SPEC_WITH_IMPORTS_FLOW,
        'NativeImportedEnumTurboModule.js',
        sharedTypes,
        importedTypeSourceMap,
      );

      // Verify the schema was generated correctly
      const module = getNativeModule(schema, 'NativeImportedEnumTurboModule');
      expect(module.type).toBe('NativeModule');

      // Verify enum map contains the imported enums
      expect(module.enumMap).toBeDefined();
      expect(module.enumMap.SharedStatusEnum).toBeDefined();
      expect(module.enumMap.SharedNumEnum).toBeDefined();

      // Verify enum member types
      expect(module.enumMap.SharedStatusEnum.type).toBe(
        'EnumDeclarationWithMembers',
      );
      expect(module.enumMap.SharedStatusEnum.memberType).toBe(
        'StringTypeAnnotation',
      );
      expect(module.enumMap.SharedNumEnum.memberType).toBe(
        'NumberTypeAnnotation',
      );

      // Verify methods exist
      expect(module.spec.methods.length).toBe(3);

      // Verify imported type tracking
      expect(module.importedEnumNames).toEqual(
        expect.objectContaining({
          SharedNumEnum: 'SharedEnumTypes',
          SharedStatusEnum: 'SharedEnumTypes',
        }),
      );
    });

    it('should not break when importedTypes is undefined', () => {
      // Existing behavior: parse a self-contained spec
      const selfContainedSpec = `
/**
 * @flow strict-local
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export enum LocalEnum {
  A = 'a',
  B = 'b',
}

export interface Spec extends TurboModule {
  +getEnum: () => LocalEnum;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'NativeSelfContainedModule',
): Spec);
`;
      const schema = parser.parseString(
        selfContainedSpec,
        'NativeSelfContainedModule.js',
      );

      const module = getNativeModule(schema, 'NativeSelfContainedModule');
      expect(module.enumMap.LocalEnum).toBeDefined();
    });

    it('should give local types precedence over imported types', () => {
      // Define a shared type
      const sharedAst = parser.getAst(SHARED_ENUM_TYPES_FLOW);
      const sharedTypes = parser.getTypes(sharedAst);

      // Spec that defines a local type with the same name as an imported one
      const specWithLocalOverride = `
/**
 * @flow strict-local
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export enum SharedStatusEnum {
  LocalA = 'local_a',
  LocalB = 'local_b',
}

export interface Spec extends TurboModule {
  +getStatus: () => SharedStatusEnum;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'NativeLocalOverrideModule',
): Spec);
`;
      const schema = parser.parseString(
        specWithLocalOverride,
        'NativeLocalOverrideModule.js',
        sharedTypes,
      );

      const module = getNativeModule(schema, 'NativeLocalOverrideModule');
      expect(module.enumMap.SharedStatusEnum).toBeDefined();

      // Local definition should win - it has LocalA and LocalB members
      const members = module.enumMap.SharedStatusEnum.members;
      expect(members).toEqual(
        expect.arrayContaining([
          expect.objectContaining({name: 'LocalA'}),
          expect.objectContaining({name: 'LocalB'}),
        ]),
      );

      // SharedStatusEnum is defined locally, so should NOT be in importedEnumNames
      expect(module.importedEnumNames ?? []).not.toContain('SharedStatusEnum');
    });
  });

  describe('TypeScriptParser', () => {
    const parser = new TypeScriptParser();

    it('should parse a spec with imported enums via parseString with importedTypes', () => {
      // First, parse the shared types file to get its TypeDeclarationMap
      const sharedAst = parser.getAst(SHARED_ENUM_TYPES_TS);
      const sharedTypes = parser.getTypes(sharedAst);

      // Verify we got the shared types
      expect(sharedTypes.SharedStatusEnum).toBeDefined();
      expect(sharedTypes.SharedNumEnum).toBeDefined();
      expect(sharedTypes.SharedStateType).toBeDefined();

      // Now parse the spec file, passing the shared types as importedTypes
      const importedTypeSourceMap = {
        SharedStatusEnum: 'SharedEnumTypes',
        SharedNumEnum: 'SharedEnumTypes',
        SharedStateType: 'SharedEnumTypes',
      };
      const schema = parser.parseString(
        SPEC_WITH_IMPORTS_TS,
        'NativeImportedEnumTurboModule.ts',
        sharedTypes,
        importedTypeSourceMap,
      );

      // Verify the schema was generated correctly
      const module = getNativeModule(schema, 'NativeImportedEnumTurboModule');
      expect(module.type).toBe('NativeModule');

      // Verify enum map contains the imported enums
      expect(module.enumMap).toBeDefined();
      expect(module.enumMap.SharedStatusEnum).toBeDefined();
      expect(module.enumMap.SharedNumEnum).toBeDefined();

      // Verify enum member types
      expect(module.enumMap.SharedStatusEnum.type).toBe(
        'EnumDeclarationWithMembers',
      );
      expect(module.enumMap.SharedStatusEnum.memberType).toBe(
        'StringTypeAnnotation',
      );
      expect(module.enumMap.SharedNumEnum.memberType).toBe(
        'NumberTypeAnnotation',
      );

      // Verify methods exist
      expect(module.spec.methods.length).toBe(3);

      // Verify imported type tracking
      expect(module.importedEnumNames).toEqual(
        expect.objectContaining({
          SharedNumEnum: 'SharedEnumTypes',
          SharedStatusEnum: 'SharedEnumTypes',
        }),
      );
    });

    it('should give local types precedence over imported types', () => {
      // Define a shared type
      const sharedAst = parser.getAst(SHARED_ENUM_TYPES_TS);
      const sharedTypes = parser.getTypes(sharedAst);

      // Spec that defines a local type with the same name as an imported one
      const specWithLocalOverride = `
import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export enum SharedStatusEnum {
  LocalA = 'local_a',
  LocalB = 'local_b',
}

export interface Spec extends TurboModule {
  getStatus(): SharedStatusEnum;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeLocalOverrideModule',
);
`;
      const schema = parser.parseString(
        specWithLocalOverride,
        'NativeLocalOverrideModule.ts',
        sharedTypes,
      );

      const module = getNativeModule(schema, 'NativeLocalOverrideModule');
      expect(module.enumMap.SharedStatusEnum).toBeDefined();

      // Local definition should win - it has LocalA and LocalB members
      const members = module.enumMap.SharedStatusEnum.members;
      expect(members).toEqual(
        expect.arrayContaining([
          expect.objectContaining({name: 'LocalA'}),
          expect.objectContaining({name: 'LocalB'}),
        ]),
      );

      // SharedStatusEnum is defined locally, so should NOT be in importedEnumNames
      expect(module.importedEnumNames ?? []).not.toContain('SharedStatusEnum');
    });
  });

  describe('getImportsFromAST', () => {
    const {getImportsFromAST} = require('../utils');
    const flowParser = new FlowParser();
    const tsParser = new TypeScriptParser();

    it('should extract type-only named imports from Flow import declarations', () => {
      const ast = flowParser.getAst(`
        import type {Foo, Bar} from './MyTypes';
        import type {Baz} from 'some-module';
      `);

      const imports = getImportsFromAST(ast);
      expect(imports).toEqual({
        Foo: './MyTypes',
        Bar: './MyTypes',
        Baz: 'some-module',
      });
    });

    it('should skip value-only imports', () => {
      const ast = flowParser.getAst(`
        import {someFunction} from './utils';
        import type {Foo} from './MyTypes';
      `);

      const imports = getImportsFromAST(ast);
      expect(imports).toEqual({
        Foo: './MyTypes',
      });
    });

    it('should ignore namespace imports', () => {
      const ast = flowParser.getAst(`
        import * as React from 'react';
        import type {Foo} from './MyTypes';
      `);

      const imports = getImportsFromAST(ast);
      expect(imports).toEqual({
        Foo: './MyTypes',
      });
    });

    it('should return empty object for files with no imports', () => {
      const ast = flowParser.getAst(`
        const x = 1;
      `);

      const imports = getImportsFromAST(ast);
      expect(imports).toEqual({});
    });

    it('should work with TypeScript ASTs', () => {
      const ast = tsParser.getAst(`
        import type {Foo, Bar} from './MyTypes';
        import {someValue} from './values';
      `);

      const imports = getImportsFromAST(ast);
      expect(imports).toEqual({
        Foo: './MyTypes',
        Bar: './MyTypes',
      });
    });
  });
});
