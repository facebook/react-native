/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SchemaType } from '../CodegenSchema';

export type FilesOutput = Map<string, string>;
export type LibraryGeneratorFunction = (libraryName: string, schema: SchemaType, packageName: string | undefined, assumeNonnull: boolean) => FilesOutput;
export type SchemaGeneratorFunction = (schemas: { [key: string]: SchemaType }) => FilesOutput;
export type ViewGeneratorFunction = (libraryName: string, schema: SchemaType) => FilesOutput;

type LibraryGeneratorNames =
    | 'generateComponentDescriptorH'
    | 'generateComponentDescriptorCpp'
    | 'generateComponentHObjCpp'
    | 'generateEventEmitterCpp'
    | 'generateEventEmitterH'
    | 'generatePropsCpp'
    | 'generatePropsH'
    | 'generateStateCpp'
    | 'generateStateH'
    | 'generateModuleH'
    | 'generateModuleCpp'
    | 'generateModuleObjCpp'
    | 'generateModuleJavaSpec'
    | 'generateModuleJniCpp'
    | 'generateModuleJniH'
    | 'generatePropsJavaInterface'
    | 'generatePropsJavaDelegate'
    | 'generateTests'
    | 'generateShadowNodeCpp'
    | 'generateShadowNodeH'
    ;

type SchemaGeneratorNames =
    | 'generateThirdPartyFabricComponentsProviderObjCpp'
    | 'generateThirdPartyFabricComponentsProviderH'
    ;

type ViewGeneratorNames =
    | 'generateViewConfigJs'
    ;

export type AllGenerators =
    & { readonly [key in LibraryGeneratorNames]: LibraryGeneratorFunction; }
    & { readonly [key in SchemaGeneratorNames]: SchemaGeneratorFunction; }
    & { readonly [key in ViewGeneratorNames]: ViewGeneratorFunction; }
    ;

export type LibraryGenerators =
    | 'componentsAndroid'
    | 'componentsIOS'
    | 'descriptors'
    | 'events'
    | 'props'
    | 'states'
    | 'tests'
    | 'shadow-nodes'
    | 'modulesAndroid'
    | 'modulesCxx'
    | 'modulesIOS'
    ;

export type SchemaGenerators =
    | 'providerIOS'
    ;

export interface LibraryOptions {
    libraryName: string;
    schema: SchemaType;
    outputDirectory: string;
    packageName?: string | undefined;
    assumeNonnull: boolean;
}

export interface LibraryConfig {
    generators: LibraryGenerators[];
    test?: boolean | undefined;
}

export interface SchemasOptions {
    schemas: { [key: string]: SchemaType };
    outputDirectory: string;
}

export interface SchemasConfig {
    generators: SchemaGenerators[];
    test?: boolean | undefined;
}

export declare const allGenerators: AllGenerators;
export declare const libraryGenerators: { readonly [key in LibraryGenerators]: LibraryGeneratorFunction };
export declare const schemaGenerators: { readonly [key in SchemaGenerators]: SchemaGeneratorFunction };
export declare function generate(options: LibraryOptions, config: LibraryConfig): boolean;
export declare function generateFromSchemas(options: SchemasOptions, config: SchemasConfig): boolean;
export declare function generateViewConfig(options: LibraryOptions): string;
