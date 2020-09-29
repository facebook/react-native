/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  ReservedFunctionValueTypeName,
  NativeModuleSchema,
} from '../../../../CodegenSchema';
const {parseString} = require('../../index.js');
const {
  FlowGenericNotTypeParameterizedParserError,
  UnrecognizedFlowTypeAnnotationParserError,
  UnrecognizedFlowGenericParserError,
  UnnamedFunctionTypeAnnotationParamError,
} = require('../errors.js');
const invariant = require('invariant');

type PrimitiveTypeAnnotationType =
  | 'StringTypeAnnotation'
  | 'NumberTypeAnnotation'
  | 'Int32TypeAnnotation'
  | 'DoubleTypeAnnotation'
  | 'FloatTypeAnnotation'
  | 'BooleanTypeAnnotation';

const PRIMITIVES: $ReadOnlyArray<[string, PrimitiveTypeAnnotationType]> = [
  ['string', 'StringTypeAnnotation'],
  ['number', 'NumberTypeAnnotation'],
  ['Int32', 'Int32TypeAnnotation'],
  ['Double', 'DoubleTypeAnnotation'],
  ['Float', 'FloatTypeAnnotation'],
  ['boolean', 'BooleanTypeAnnotation'],
];

const RESERVED_FUNCTION_VALUE_TYPE_NAME: $ReadOnlyArray<ReservedFunctionValueTypeName> = [
  'RootTag',
];

const MODULE_NAME = 'Foo';

const TYPE_ALIAS_DECLARATIONS = `
type Animal = {|
  name: string,
|};

type AnimalPointer = Animal;
`;

function expectAnimalTypeAliasToExist(module: NativeModuleSchema) {
  const animalAlias = module.aliases.Animal;

  expect(animalAlias).not.toBe(null);
  invariant(animalAlias != null, '');
  expect(animalAlias.type).toBe('ObjectTypeAnnotation');
  expect(animalAlias.nullable).toBe(false);
  expect(animalAlias.properties.length).toBe(1);
  expect(animalAlias.properties[0].name).toBe('name');
  expect(animalAlias.properties[0].optional).toBe(false);
  expect(animalAlias.properties[0].typeAnnotation.type).toBe(
    'StringTypeAnnotation',
  );
  expect(animalAlias.properties[0].typeAnnotation.nullable).toBe(false);
}

describe('Flow Module Parser', () => {
  describe('Parameter Parsing', () => {
    it("should fail parsing when a method has an parameter of type 'any'", () => {
      const parser = () =>
        parseModule(`
          import type {TurboModule} from 'RCTExport';
          import * as TurboModuleRegistry from 'TurboModuleRegistry';
          export interface Spec extends TurboModule {
            +useArg(arg: any): void;
          }
          export default TurboModuleRegistry.get<Spec>('Foo');
        `);

      expect(parser).toThrow(
        new UnrecognizedFlowTypeAnnotationParserError(
          MODULE_NAME,
          'AnyTypeAnnotation',
        ),
      );
    });

    it('should fail parsing when a function param type is unamed', () => {
      const parser = () =>
        parseModule(`
          import type {TurboModule} from 'RCTExport';
          import * as TurboModuleRegistry from 'TurboModuleRegistry';
          export interface Spec extends TurboModule {
            +useArg(boolean): void;
          }
          export default TurboModuleRegistry.get<Spec>('Foo');
        `);

      expect(parser).toThrow(
        new UnnamedFunctionTypeAnnotationParamError(MODULE_NAME),
      );
    });

    [
      {nullable: false, optional: false},
      {nullable: false, optional: true},
      {nullable: true, optional: false},
      {nullable: true, optional: true},
    ].forEach(({nullable, optional}) => {
      const PARAM_TYPE_DESCRIPTION =
        nullable && optional
          ? 'a nullable and optional'
          : nullable
          ? 'a nullable'
          : optional
          ? 'an optional'
          : 'a required';

      function annotateArg(paramName: string, paramType: string) {
        if (nullable && optional) {
          return `${paramName}?: ?${paramType}`;
        }
        if (nullable) {
          return `${paramName}: ?${paramType}`;
        }
        if (optional) {
          return `${paramName}?: ${paramType}`;
        }
        return `${paramName}: ${paramType}`;
      }

      function parseParamType(paramName: string, paramType: string) {
        const module = parseModule(`
          import type {TurboModule} from 'RCTExport';
          import * as TurboModuleRegistry from 'TurboModuleRegistry';

          ${TYPE_ALIAS_DECLARATIONS}

          export interface Spec extends TurboModule {
            +useArg(${annotateArg(paramName, paramType)}): void;
          }
          export default TurboModuleRegistry.get<Spec>('Foo');
        `);

        expect(module.properties[0]).not.toBe(null);
        const param = module.properties[0].typeAnnotation.params[0];
        expect(param).not.toBe(null);
        expect(param.name).toBe(paramName);
        expect(param.optional).toBe(optional);
        expect(param.typeAnnotation.nullable).toBe(nullable);

        return [param, module];
      }

      describe(
        (nullable && optional
          ? 'Nullable and Optional'
          : nullable
          ? 'Nullable'
          : optional
          ? 'Optional'
          : 'Required') + ' Parameter',
        () => {
          it(`should not parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of type 'Function'`, () => {
            expect(() => parseParamType('arg', 'Function')).toThrow(
              new UnrecognizedFlowGenericParserError(MODULE_NAME, 'Function'),
            );
          });

          describe('Primitive types', () => {
            PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
              it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} primitive parameter of type '${FLOW_TYPE}'`, () => {
                const [param] = parseParamType('arg', FLOW_TYPE);
                expect(param.typeAnnotation.type).toBe(PARSED_TYPE_NAME);
              });
            });
          });

          it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of type 'Object'`, () => {
            const [param] = parseParamType('arg', 'Object');
            expect(param.typeAnnotation.type).toBe(
              'GenericObjectTypeAnnotation',
            );
          });

          describe('Reserved Types', () => {
            RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
              it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of reserved type '${FLOW_TYPE}'`, () => {
                const [param] = parseParamType('arg', FLOW_TYPE);

                expect(param.typeAnnotation.type).toBe(
                  'ReservedFunctionValueTypeAnnotation',
                );
                invariant(
                  param.typeAnnotation.type ===
                    'ReservedFunctionValueTypeAnnotation',
                  'Param must be a Reserved type',
                );

                expect(param.typeAnnotation.name).toBe(FLOW_TYPE);
              });
            });
          });

          describe('Array Types', () => {
            it(`should not parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of type 'Array'`, () => {
              expect(() => parseParamType('arg', 'Array')).toThrow(
                new FlowGenericNotTypeParameterizedParserError(
                  MODULE_NAME,
                  'Array',
                ),
              );
            });

            function parseParamArrayElementType(
              paramName: string,
              paramType: string,
            ) {
              const [param, module] = parseParamType(
                paramName,
                `Array<${paramType}>`,
              );

              expect(param.typeAnnotation.type).toBe('ArrayTypeAnnotation');
              invariant(
                param.typeAnnotation.type === 'ArrayTypeAnnotation',
                '',
              );

              expect(param.typeAnnotation.elementType).not.toBe(null);
              invariant(param.typeAnnotation.elementType != null, '');
              return [param.typeAnnotation.elementType, module];
            }

            // TODO: Do we support nullable element types?

            describe('Primitive Element Types', () => {
              PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
                it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of type 'Array<${FLOW_TYPE}>'`, () => {
                  const [elementType] = parseParamArrayElementType(
                    'arg',
                    FLOW_TYPE,
                  );
                  expect(elementType.type).toBe(PARSED_TYPE_NAME);
                });
              });
            });

            describe('Reserved Element Types', () => {
              RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
                it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of type 'Array<${FLOW_TYPE}>'`, () => {
                  const [elementType] = parseParamArrayElementType(
                    'arg',
                    FLOW_TYPE,
                  );
                  expect(elementType.type).toBe(
                    'ReservedFunctionValueTypeAnnotation',
                  );
                  invariant(
                    elementType.type === 'ReservedFunctionValueTypeAnnotation',
                    '',
                  );

                  expect(elementType.name).toBe(FLOW_TYPE);
                });
              });
            });

            it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of type 'Array<Object>'`, () => {
              const [elementType] = parseParamArrayElementType('arg', 'Object');
              expect(elementType.type).toBe('GenericObjectTypeAnnotation');
            });

            it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of some array of an alias`, () => {
              const [elementType, module] = parseParamArrayElementType(
                'arg',
                'Animal',
              );
              expect(elementType.type).toBe('TypeAliasTypeAnnotation');
              invariant(elementType.type === 'TypeAliasTypeAnnotation', '');

              expect(elementType.name).toBe('Animal');
              expectAnimalTypeAliasToExist(module);
            });

            it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of type 'Array<{|foo: ?string|}>'`, () => {
              const [elementType] = parseParamArrayElementType(
                'arg',
                '{|foo: ?string|}',
              );
              expect(elementType).not.toBe(null);

              expect(elementType.type).toBe('ObjectTypeAnnotation');
              invariant(elementType.type === 'ObjectTypeAnnotation', '');

              const {properties} = elementType;
              invariant(properties != null, '');

              expect(properties).not.toBe(null);
              expect(properties[0]).not.toBe(null);
              expect(properties[0].name).toBe('foo');
              expect(properties[0].typeAnnotation).not.toBe(null);
              expect(properties[0].typeAnnotation?.type).toBe(
                'StringTypeAnnotation',
              );
              expect(properties[0].typeAnnotation?.nullable).toBe(true);
              expect(properties[0].optional).toBe(false);
            });
          });

          it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of some type alias`, () => {
            const [param, module] = parseParamType('arg', 'Animal');
            expect(param.typeAnnotation.type).toBe('TypeAliasTypeAnnotation');
            invariant(
              param.typeAnnotation.type === 'TypeAliasTypeAnnotation',
              '',
            );

            expect(param.typeAnnotation.name).toBe('Animal');
            expectAnimalTypeAliasToExist(module);
          });

          it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of some type alias that points to another type alias`, () => {
            const [param, module] = parseParamType('arg', 'AnimalPointer');
            expect(param.typeAnnotation.type).toBe('TypeAliasTypeAnnotation');
            invariant(
              param.typeAnnotation.type === 'TypeAliasTypeAnnotation',
              '',
            );

            expect(param.typeAnnotation.name).toBe('Animal');
            expectAnimalTypeAliasToExist(module);
          });

          it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of some type alias that points to another nullable type alias`, () => {
            const module = parseModule(`
              import type {TurboModule} from 'RCTExport';
              import * as TurboModuleRegistry from 'TurboModuleRegistry';

              type Animal = ?{|
                name: string,
              |};

              type AnimalPointer = Animal;

              export interface Spec extends TurboModule {
                +useArg(${annotateArg('arg', 'AnimalPointer')}): void;
              }
              export default TurboModuleRegistry.get<Spec>('Foo');
            `);

            expect(module.properties[0]).not.toBe(null);
            const param = module.properties[0].typeAnnotation.params[0];
            expect(param.name).toBe('arg');
            expect(param.optional).toBe(optional);

            // The TypeAliasAnnotation is called Animal, and is nullable
            expect(param.typeAnnotation.type).toBe('TypeAliasTypeAnnotation');
            invariant(
              param.typeAnnotation.type === 'TypeAliasTypeAnnotation',
              '',
            );
            expect(param.typeAnnotation.name).toBe('Animal');
            expect(param.typeAnnotation.nullable).toBe(true);

            // The Animal type alias RHS is valid, and non-null
            expectAnimalTypeAliasToExist(module);
          });

          [
            {nullable: false, optional: false},
            {nullable: false, optional: true},
            {nullable: true, optional: false},
            {nullable: true, optional: true},
          ].forEach(({nullable: isPropNullable, optional: isPropOptional}) => {
            const PROP_TYPE_DESCRIPTION =
              isPropNullable && isPropOptional
                ? 'a nullable and optional'
                : isPropNullable
                ? 'a nullable'
                : isPropOptional
                ? 'an optional'
                : 'a required';

            function annotateProp(propName: string, propType: string) {
              if (isPropNullable && isPropOptional) {
                return `${propName}?: ?${propType}`;
              }
              if (isPropNullable) {
                return `${propName}: ?${propType}`;
              }
              if (isPropOptional) {
                return `${propName}?: ${propType}`;
              }
              return `${propName}: ${propType}`;
            }

            function parseParamTypeObjectLiteralProp(
              propName: string,
              propType: string,
            ) {
              const [param, module] = parseParamType(
                'arg',
                `{|${annotateProp(propName, propType)}|}`,
              );

              expect(param.typeAnnotation.type).toBe('ObjectTypeAnnotation');
              invariant(
                param.typeAnnotation.type === 'ObjectTypeAnnotation',
                '',
              );

              const {properties} = param.typeAnnotation;

              expect(properties).not.toBe(null);
              invariant(properties != null, '');

              expect(properties.length).toBe(1);
              expect(properties[0].name).toBe(propName);
              expect(properties[0].optional).toBe(isPropOptional);
              expect(properties[0].typeAnnotation).not.toBe(null);
              expect(properties[0].typeAnnotation.nullable).toBe(
                isPropNullable,
              );
              invariant(properties[0].typeAnnotation != null, '');

              return [
                {
                  ...properties[0],
                  typeAnnotation: properties[0].typeAnnotation,
                },
                module,
              ];
            }

            describe(
              (isPropNullable && isPropOptional
                ? 'Nullable and Optional'
                : isPropNullable
                ? 'Nullable'
                : isPropOptional
                ? 'Optional'
                : 'Required') + ' Property',
              () => {
                describe('Props with Primitive Types', () => {
                  PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
                    it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of primitive type '${FLOW_TYPE}'`, () => {
                      const [prop] = parseParamTypeObjectLiteralProp(
                        'prop',
                        FLOW_TYPE,
                      );
                      expect(prop.typeAnnotation.type).toBe(PARSED_TYPE_NAME);
                    });
                  });
                });

                it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Object'`, () => {
                  const [prop] = parseParamTypeObjectLiteralProp(
                    'prop',
                    'Object',
                  );
                  expect(prop.typeAnnotation.type).toBe(
                    'GenericObjectTypeAnnotation',
                  );
                });

                describe('Props with Reserved Types', () => {
                  RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
                    it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of reserved type '${FLOW_TYPE}'`, () => {
                      const [prop] = parseParamTypeObjectLiteralProp(
                        'prop',
                        FLOW_TYPE,
                      );
                      expect(prop.typeAnnotation.type).toBe(
                        'ReservedFunctionValueTypeAnnotation',
                      );
                      invariant(
                        prop.typeAnnotation.type ===
                          'ReservedFunctionValueTypeAnnotation',
                        '',
                      );

                      expect(prop.typeAnnotation.name).toBe(FLOW_TYPE);
                    });
                  });
                });

                describe('Props with Array Types', () => {
                  it(`should not parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Array`, () => {
                    expect(() =>
                      parseParamTypeObjectLiteralProp('prop', 'Array'),
                    ).toThrow(
                      new FlowGenericNotTypeParameterizedParserError(
                        MODULE_NAME,
                        'Array',
                      ),
                    );
                  });

                  function parseArrayElementType(
                    propName: string,
                    arrayElementType: string,
                  ) {
                    const [property, module] = parseParamTypeObjectLiteralProp(
                      'propName',
                      `Array<${arrayElementType}>`,
                    );
                    expect(property.typeAnnotation.type).toBe(
                      'ArrayTypeAnnotation',
                    );
                    invariant(
                      property.typeAnnotation.type === 'ArrayTypeAnnotation',
                      '',
                    );

                    const {elementType} = property.typeAnnotation;
                    expect(elementType).not.toBe(null);
                    invariant(elementType != null, '');
                    return [elementType, module];
                  }

                  PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
                    it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Array<${FLOW_TYPE}>'`, () => {
                      const [elementType] = parseArrayElementType(
                        'prop',
                        FLOW_TYPE,
                      );

                      expect(elementType.type).toBe(PARSED_TYPE_NAME);
                    });
                  });

                  RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
                    it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Array<${FLOW_TYPE}>'`, () => {
                      const [elementType] = parseArrayElementType(
                        'prop',
                        FLOW_TYPE,
                      );

                      expect(elementType.type).toBe(
                        'ReservedFunctionValueTypeAnnotation',
                      );
                      invariant(
                        elementType.type ===
                          'ReservedFunctionValueTypeAnnotation',
                        '',
                      );
                      expect(elementType.name).toBe(FLOW_TYPE);
                    });
                  });

                  it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type  'Array<Object>'`, () => {
                    const [elementType] = parseArrayElementType(
                      'prop',
                      'Object',
                    );
                    expect(elementType.type).toBe(
                      'GenericObjectTypeAnnotation',
                    );
                  });

                  it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type of some array of an alias`, () => {
                    const [elementType, module] = parseArrayElementType(
                      'prop',
                      'Animal',
                    );

                    expect(elementType.type).toBe('TypeAliasTypeAnnotation');
                    invariant(
                      elementType.type === 'TypeAliasTypeAnnotation',
                      '',
                    );

                    expect(elementType.name).toBe('Animal');
                    expectAnimalTypeAliasToExist(module);
                  });

                  it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of 'Array<{|foo: ?string|}>'`, () => {
                    const [elementType] = parseArrayElementType(
                      'prop',
                      '{|foo: ?string|}',
                    );

                    expect(elementType.type).toBe('ObjectTypeAnnotation');
                    invariant(elementType.type === 'ObjectTypeAnnotation', '');

                    const {properties} = elementType;
                    expect(properties).not.toBe(null);
                    invariant(properties != null, '');

                    expect(properties[0]).not.toBe(null);
                    expect(properties[0].name).toBe('foo');
                    expect(properties[0].typeAnnotation).not.toBe(null);
                    expect(properties[0].typeAnnotation?.type).toBe(
                      'StringTypeAnnotation',
                    );
                    expect(properties[0].typeAnnotation?.nullable).toBe(true);
                    expect(properties[0].optional).toBe(false);
                  });
                });

                it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type '{|foo: ?string|}'`, () => {
                  const [property] = parseParamTypeObjectLiteralProp(
                    'prop',
                    '{|foo: ?string|}',
                  );

                  expect(property.typeAnnotation.type).toBe(
                    'ObjectTypeAnnotation',
                  );
                  invariant(
                    property.typeAnnotation.type === 'ObjectTypeAnnotation',
                    '',
                  );

                  const {properties} = property.typeAnnotation;
                  expect(properties).not.toBe(null);
                  invariant(properties != null, '');

                  expect(properties[0]).not.toBe(null);
                  expect(properties[0].name).toBe('foo');
                  expect(properties[0].typeAnnotation).not.toBe(null);
                  expect(properties[0].typeAnnotation?.type).toBe(
                    'StringTypeAnnotation',
                  );
                  expect(properties[0].typeAnnotation?.nullable).toBe(true);
                  expect(properties[0].optional).toBe(false);
                });

                it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of some type alias`, () => {
                  const [property, module] = parseParamTypeObjectLiteralProp(
                    'prop',
                    'Animal',
                  );

                  expect(property.typeAnnotation.type).toBe(
                    'TypeAliasTypeAnnotation',
                  );
                  invariant(
                    property.typeAnnotation.type === 'TypeAliasTypeAnnotation',
                    '',
                  );

                  expect(property.typeAnnotation.name).toBe('Animal');
                  expectAnimalTypeAliasToExist(module);
                });
              },
            );
          });
        },
      );
    });
  });

  describe('Return Parsing', () => {
    it('should parse methods that have a return type of void', () => {
      const module = parseModule(`
        import type {TurboModule} from 'RCTExport';
        import * as TurboModuleRegistry from 'TurboModuleRegistry';
        export interface Spec extends TurboModule {
          +useArg(): void;
        }
        export default TurboModuleRegistry.get<Spec>('Foo');
      `);

      expect(module.properties[0]).not.toBe(null);
      const {returnTypeAnnotation} = module.properties[0].typeAnnotation;
      expect(returnTypeAnnotation).not.toBe(null);
      expect(returnTypeAnnotation.type).toBe('VoidTypeAnnotation');
      expect(returnTypeAnnotation.nullable).toBe(false);
    });

    [true, false].forEach(IS_RETURN_TYPE_NULLABLE => {
      const RETURN_TYPE_DESCRIPTION = IS_RETURN_TYPE_NULLABLE
        ? 'a nullable'
        : 'a non-nullable';
      const annotateRet = retType =>
        IS_RETURN_TYPE_NULLABLE ? `?${retType}` : retType;

      function parseReturnType(flowType: string) {
        const module = parseModule(`
          import type {TurboModule} from 'RCTExport';
          import * as TurboModuleRegistry from 'TurboModuleRegistry';

          ${TYPE_ALIAS_DECLARATIONS}

          export interface Spec extends TurboModule {
            +useArg(): ${annotateRet(flowType)};
          }
          export default TurboModuleRegistry.get<Spec>('Foo');
        `);

        expect(module.properties[0]).not.toBe(null);
        const {returnTypeAnnotation} = module.properties[0].typeAnnotation;
        expect(returnTypeAnnotation).not.toBe(null);
        expect(returnTypeAnnotation.nullable).toBe(IS_RETURN_TYPE_NULLABLE);
        return [returnTypeAnnotation, module];
      }

      describe(
        IS_RETURN_TYPE_NULLABLE ? 'Nullable Returns' : 'Non-Nullable Returns',
        () => {
          ['Promise<void>', 'Promise<{||}>', 'Promise<*>'].forEach(
            promiseFlowType => {
              it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type '${promiseFlowType}'`, () => {
                const [returnTypeAnnotation] = parseReturnType(promiseFlowType);
                expect(returnTypeAnnotation.type).toBe('PromiseTypeAnnotation');
              });
            },
          );

          describe('Primitive Types', () => {
            PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
              it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} primitive return of type '${FLOW_TYPE}'`, () => {
                const [returnTypeAnnotation] = parseReturnType(FLOW_TYPE);
                expect(returnTypeAnnotation.type).toBe(PARSED_TYPE_NAME);
              });
            });
          });

          describe('Reserved Types', () => {
            RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
              it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} reserved return of type '${FLOW_TYPE}'`, () => {
                const [returnTypeAnnotation] = parseReturnType(FLOW_TYPE);
                expect(returnTypeAnnotation.type).toBe(
                  'ReservedFunctionValueTypeAnnotation',
                );
                invariant(
                  returnTypeAnnotation.type ===
                    'ReservedFunctionValueTypeAnnotation',
                  '',
                );
                expect(returnTypeAnnotation.name).toBe(FLOW_TYPE);
              });
            });
          });

          describe('Array Types', () => {
            it(`should not parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type 'Array'`, () => {
              expect(() => parseReturnType('Array')).toThrow(
                new FlowGenericNotTypeParameterizedParserError(
                  MODULE_NAME,
                  'Array',
                ),
              );
            });

            function parseArrayElementReturnType(flowType: string) {
              const [returnTypeAnnotation, module] = parseReturnType(
                'Array' + (flowType != null ? `<${flowType}>` : ''),
              );
              expect(returnTypeAnnotation.type).toBe('ArrayTypeAnnotation');
              invariant(
                returnTypeAnnotation.type === 'ArrayTypeAnnotation',
                '',
              );

              const {elementType} = returnTypeAnnotation;
              expect(elementType).not.toBe(null);
              invariant(elementType != null, '');
              return [elementType, module];
            }

            // TODO: Do we support nullable element types?

            describe('Primitive Element Types', () => {
              PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
                it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type 'Array<${FLOW_TYPE}>'`, () => {
                  const [elementType, module] = parseArrayElementReturnType(
                    FLOW_TYPE,
                  );
                  expect(elementType.type).toBe(PARSED_TYPE_NAME);
                });
              });
            });

            describe('Reserved Element Types', () => {
              RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
                it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type 'Array<${FLOW_TYPE}>'`, () => {
                  const [elementType] = parseArrayElementReturnType(FLOW_TYPE);
                  expect(elementType.type).toBe(
                    'ReservedFunctionValueTypeAnnotation',
                  );
                  invariant(
                    elementType.type === 'ReservedFunctionValueTypeAnnotation',
                    '',
                  );

                  expect(elementType.name).toBe(FLOW_TYPE);
                });
              });
            });

            it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type 'Array<Object>'`, () => {
              const [elementType] = parseArrayElementReturnType('Object');
              expect(elementType.type).toBe('GenericObjectTypeAnnotation');
            });

            it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of some array of an alias`, () => {
              const [elementType, module] = parseArrayElementReturnType(
                'Animal',
              );
              expect(elementType.type).toBe('TypeAliasTypeAnnotation');
              invariant(elementType.type === 'TypeAliasTypeAnnotation', '');
              expect(elementType.name).toBe('Animal');
              expectAnimalTypeAliasToExist(module);
            });

            it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type 'Array<{|foo: ?string|}>'`, () => {
              const [elementType] = parseArrayElementReturnType(
                '{|foo: ?string|}',
              );
              expect(elementType.type).toBe('ObjectTypeAnnotation');
              invariant(elementType.type === 'ObjectTypeAnnotation', '');

              const {properties} = elementType;
              expect(properties).not.toBe(null);
              invariant(properties != null, '');

              expect(properties[0]).not.toBe(null);
              expect(properties[0].name).toBe('foo');
              expect(properties[0].typeAnnotation).not.toBe(null);
              expect(properties[0].typeAnnotation?.type).toBe(
                'StringTypeAnnotation',
              );
              expect(properties[0].typeAnnotation?.nullable).toBe(true);
              expect(properties[0].optional).toBe(false);
            });
          });

          it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of some type alias`, () => {
            const [returnTypeAnnotation, module] = parseReturnType('Animal');
            expect(returnTypeAnnotation.type).toBe('TypeAliasTypeAnnotation');
            invariant(
              returnTypeAnnotation.type === 'TypeAliasTypeAnnotation',
              '',
            );
            expect(returnTypeAnnotation.name).toBe('Animal');
            expectAnimalTypeAliasToExist(module);
          });

          it(`should not parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type 'Function'`, () => {
            expect(() => parseReturnType('Function')).toThrow(
              new UnrecognizedFlowGenericParserError(MODULE_NAME, 'Function'),
            );
          });

          it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type 'Object'`, () => {
            const [returnTypeAnnotation] = parseReturnType('Object');
            expect(returnTypeAnnotation.type).toBe(
              'GenericObjectTypeAnnotation',
            );
          });

          describe('Object Literals Types', () => {
            // TODO: Inexact vs exact object literals?

            it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an empty object literal`, () => {
              const [returnTypeAnnotation] = parseReturnType('{||}');
              expect(returnTypeAnnotation.type).toBe('ObjectTypeAnnotation');
              invariant(
                returnTypeAnnotation.type === 'ObjectTypeAnnotation',
                '',
              );

              // Validate properties of object literal
              expect(returnTypeAnnotation.properties).not.toBe(null);
              expect(returnTypeAnnotation.properties?.length).toBe(0);
            });

            [
              {nullable: false, optional: false},
              {nullable: false, optional: true},
              {nullable: true, optional: false},
              {nullable: true, optional: true},
            ].forEach(({nullable, optional}) => {
              const PROP_TYPE_DESCRIPTION =
                nullable && optional
                  ? 'a nullable and optional'
                  : nullable
                  ? 'a nullable'
                  : optional
                  ? 'an optional'
                  : 'a required';

              function annotateProp(propName, propType) {
                if (nullable && optional) {
                  return `${propName}?: ?${propType}`;
                }
                if (nullable) {
                  return `${propName}: ?${propType}`;
                }
                if (optional) {
                  return `${propName}?: ${propType}`;
                }
                return `${propName}: ${propType}`;
              }

              function parseObjectLiteralReturnTypeProp(
                propName: string,
                propType: string,
              ) {
                const [returnTypeAnnotation, module] = parseReturnType(
                  `{|${annotateProp(propName, propType)}|}`,
                );
                expect(returnTypeAnnotation.type).toBe('ObjectTypeAnnotation');
                invariant(
                  returnTypeAnnotation.type === 'ObjectTypeAnnotation',
                  '',
                );

                const properties = returnTypeAnnotation.properties;
                expect(properties).not.toBe(null);
                invariant(properties != null, '');

                expect(properties.length).toBe(1);

                // Validate property
                const property = properties[0];
                expect(property.name).toBe(propName);
                expect(property.optional).toBe(optional);
                expect(property.typeAnnotation).not.toBe(null);
                expect(property.typeAnnotation?.nullable).toBe(nullable);
                invariant(property.typeAnnotation != null, '');
                return [
                  {
                    ...property,
                    typeAnnotation: property.typeAnnotation,
                  },
                  module,
                ];
              }

              describe(
                (nullable && optional
                  ? 'Nullable and Optional'
                  : nullable
                  ? 'Nullable'
                  : optional
                  ? 'Optional'
                  : 'Required') + ' Property',
                () => {
                  /**
                   * TODO: Fill out props in promise
                   */

                  describe('Props with Primitive Types', () => {
                    PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
                      it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of primitive type '${FLOW_TYPE}'`, () => {
                        const [property] = parseObjectLiteralReturnTypeProp(
                          'prop',
                          FLOW_TYPE,
                        );
                        expect(property.typeAnnotation.type).toBe(
                          PARSED_TYPE_NAME,
                        );
                      });
                    });
                  });

                  it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Object'`, () => {
                    const [property] = parseObjectLiteralReturnTypeProp(
                      'prop',
                      'Object',
                    );

                    expect(property.typeAnnotation.type).toBe(
                      'GenericObjectTypeAnnotation',
                    );
                  });

                  describe('Props with Reserved Types', () => {
                    RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
                      it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of reserved type '${FLOW_TYPE}'`, () => {
                        const [property] = parseObjectLiteralReturnTypeProp(
                          'prop',
                          FLOW_TYPE,
                        );

                        expect(property.typeAnnotation.type).toBe(
                          'ReservedFunctionValueTypeAnnotation',
                        );
                        invariant(
                          property.typeAnnotation.type ===
                            'ReservedFunctionValueTypeAnnotation',
                          '',
                        );

                        expect(property.typeAnnotation.name).toBe(FLOW_TYPE);
                      });
                    });
                  });

                  describe('Props with Array Types', () => {
                    it(`should not parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Array`, () => {
                      expect(() =>
                        parseObjectLiteralReturnTypeProp('prop', 'Array'),
                      ).toThrow(
                        new FlowGenericNotTypeParameterizedParserError(
                          MODULE_NAME,
                          'Array',
                        ),
                      );
                    });

                    function parseArrayElementType(
                      propName: string,
                      arrayElementType: string,
                    ) {
                      const [
                        property,
                        module,
                      ] = parseObjectLiteralReturnTypeProp(
                        propName,
                        `Array<${arrayElementType}>`,
                      );
                      expect(property.name).toBe(propName);
                      expect(property.typeAnnotation.type).toBe(
                        'ArrayTypeAnnotation',
                      );
                      invariant(
                        property.typeAnnotation.type === 'ArrayTypeAnnotation',
                        '',
                      );

                      const {elementType} = property.typeAnnotation;
                      expect(elementType).not.toBe(null);
                      invariant(elementType != null, '');
                      return [elementType, module];
                    }

                    PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
                      it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Array<${FLOW_TYPE}>'`, () => {
                        const [elementType] = parseArrayElementType(
                          'prop',
                          FLOW_TYPE,
                        );
                        expect(elementType.type).toBe(PARSED_TYPE_NAME);
                      });
                    });

                    RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
                      it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Array<${FLOW_TYPE}>'`, () => {
                        const [elementType] = parseArrayElementType(
                          'prop',
                          FLOW_TYPE,
                        );
                        expect(elementType.type).toBe(
                          'ReservedFunctionValueTypeAnnotation',
                        );
                        invariant(
                          elementType.type ===
                            'ReservedFunctionValueTypeAnnotation',
                          '',
                        );

                        expect(elementType.name).toBe(FLOW_TYPE);
                      });
                    });

                    it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type  'Array<Object>'`, () => {
                      const [elementType] = parseArrayElementType(
                        'prop',
                        'Object',
                      );
                      expect(elementType).not.toBe(null);
                      expect(elementType.type).toBe(
                        'GenericObjectTypeAnnotation',
                      );
                    });

                    it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type of some array of an aliase`, () => {
                      const [elementType, module] = parseArrayElementType(
                        'prop',
                        'Animal',
                      );
                      expect(elementType.type).toBe('TypeAliasTypeAnnotation');
                      invariant(
                        elementType.type === 'TypeAliasTypeAnnotation',
                        '',
                      );
                      expect(elementType.name).toBe('Animal');
                      expectAnimalTypeAliasToExist(module);
                    });

                    it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type  'Array<{|foo: ?string|}>'`, () => {
                      const [elementType] = parseArrayElementType(
                        'prop',
                        '{|foo: ?string|}',
                      );
                      expect(elementType.type).toBe('ObjectTypeAnnotation');
                      invariant(
                        elementType.type === 'ObjectTypeAnnotation',
                        '',
                      );

                      const {properties} = elementType;
                      invariant(properties != null, '');
                      expect(properties).not.toBe(null);
                      expect(properties[0]).not.toBe(null);
                      expect(properties[0].name).toBe('foo');
                      expect(properties[0].optional).toBe(false);

                      expect(properties[0].typeAnnotation).not.toBe(null);
                      invariant(properties[0].typeAnnotation != null, '');

                      expect(properties[0].typeAnnotation.type).toBe(
                        'StringTypeAnnotation',
                      );
                      expect(properties[0].typeAnnotation.nullable).toBe(true);
                    });
                  });

                  it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of '{|foo: ?string|}'`, () => {
                    const [property] = parseObjectLiteralReturnTypeProp(
                      'prop',
                      '{|foo: ?string|}',
                    );

                    expect(property.typeAnnotation.type).toBe(
                      'ObjectTypeAnnotation',
                    );
                    invariant(
                      property.typeAnnotation.type === 'ObjectTypeAnnotation',
                      '',
                    );

                    const {properties} = property.typeAnnotation;

                    expect(properties).not.toBe(null);
                    invariant(properties != null, '');

                    expect(properties[0]).not.toBe(null);
                    expect(properties[0].name).toBe('foo');
                    expect(properties[0].optional).toBe(false);

                    expect(properties[0].typeAnnotation).not.toBe(null);
                    invariant(properties[0].typeAnnotation != null, '');

                    expect(properties[0].typeAnnotation.type).toBe(
                      'StringTypeAnnotation',
                    );
                    expect(properties[0].typeAnnotation.nullable).toBe(true);
                  });

                  it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of some type alias`, () => {
                    const [property, module] = parseObjectLiteralReturnTypeProp(
                      'prop',
                      'Animal',
                    );

                    expect(property.typeAnnotation.type).toBe(
                      'TypeAliasTypeAnnotation',
                    );
                    invariant(
                      property.typeAnnotation.type ===
                        'TypeAliasTypeAnnotation',
                      '',
                    );

                    expect(property.typeAnnotation.name).toBe('Animal');
                    expectAnimalTypeAliasToExist(module);
                  });
                },
              );
            });
          });
        },
      );
    });
  });
});

function parseModule(source) {
  const schema = parseString(source, `Native${MODULE_NAME}.js`);
  const {nativeModules} = schema.modules.NativeFoo;
  invariant(
    nativeModules,
    "'nativeModules' in Spec NativeFoo shouldn't be null",
  );
  return nativeModules.Foo;
}
