import type { SchemaType } from "../CodegenSchema";

export type FilesOutput = Map<string, string>;

export type GeneratorFunction = (libraryName: string, schema: SchemaType, packageName: string, assumeNonnull: boolean) => FilesOutput;

export interface GeneratorInterface {
    readonly generate: GeneratorFunction;
}

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

export type SchemaGenerators = 'providerIOS';

export interface LibraryOptions {
    libraryName: string;
    schema: SchemaType;
    outputDirectory: string;
    packageName?: string;
    assumeNonnull: boolean;
}

export interface LibraryConfig {
    generators: LibraryGenerators[];
    test?: boolean;
}

export interface SchemasOptions {
    schemas: { [key: string]: SchemaType };
    outputDirectory: string;
}

export interface SchemasConfig {
    generators: SchemaGenerators[];
    test?: boolean;
}

export declare const libraryGenerators: { readonly [key in LibraryGenerators]: GeneratorFunction };
export declare const schemaGenerators: { readonly [key in SchemaGenerators]: GeneratorFunction };
export declare function generate(options: LibraryOptions, config: LibraryConfig): boolean;
export declare function generateFromSchemas(options: SchemasOptions, config: SchemasConfig): boolean;
export declare function generateViewConfig(options: LibraryOptions): string;
