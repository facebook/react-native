/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as assert from 'assert';
import type { SchemaType } from '@react-native/codegen/src/CodegenSchema';
import { TypeScriptParser } from '@react-native/codegen/src/parsers/typescript/parser';

test(`@rn/codegen should parse an empty TypeScript module`, () => {
    const tsInput = `
import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {}
export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;
    const parser = new TypeScriptParser();
    const actual = parser.parseString(tsInput, 'SampleTurboModule.ts');
    const expected: SchemaType = { modules: {} };
    assert.deepStrictEqual(actual, expected);
});

test(`@rn/codegen should parse an empty TypeScript component`, () => {
    const tsInput = `
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

export interface ModuleProps extends ViewProps {}
export default codegenNativeComponent<ModuleProps>('Module', {
  interfaceOnly: true,
  paperComponentName: 'RCTModule',
}) as HostComponent<ModuleProps>;
`;
    const parser = new TypeScriptParser();
    const actual = parser.parseString(tsInput, 'SampleNativeComponent.ts');
    const expected: SchemaType = { modules: {} };
    assert.deepStrictEqual(actual, expected);
});
