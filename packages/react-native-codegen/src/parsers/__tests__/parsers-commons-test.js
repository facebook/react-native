/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use-strict';

import {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  isObjectProperty,
  parseObjectProperty,
  wrapNullable,
  unwrapNullable,
  buildSchemaFromConfigType,
  buildSchema,
} from '../parsers-commons';
import type {ParserType} from '../errors';

const {Visitor} = require('../flow/Visitor');
const {wrapComponentSchema} = require('../flow/components/schema');
const {buildComponentSchema} = require('../flow/components');
const {buildModuleSchema} = require('../flow/modules');
const {isModuleRegistryCall} = require('../utils.js');
const {
  ParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError,
} = require('../errors');

import {MockedParser} from '../parserMock';

const parser = new MockedParser();

const flowTranslateTypeAnnotation = require('../flow/modules/index');
const typeScriptTranslateTypeAnnotation = require('../typescript/modules/index');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('wrapNullable', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = wrapNullable(true, {
        type: 'BooleanTypeAnnotation',
      });
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'BooleanTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = wrapNullable(false, {
        type: 'BooleanTypeAnnotation',
      });
      const expected = {
        type: 'BooleanTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('unwrapNullable', () => {
  describe('when type annotation is nullable', () => {
    it('returns original type annotation', () => {
      // $FlowFixMe[incompatible-call]
      const result = unwrapNullable<{
        type: 'NullableTypeAnnotation',
        typeAnnotation: {type: 'BooleanTypeAnnotation'},
      }>({
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'BooleanTypeAnnotation',
        },
      });
      const expected = [
        {
          type: 'BooleanTypeAnnotation',
        },
        true,
      ];

      expect(result).toEqual(expected);
    });
  });
  describe('when type annotation is not nullable', () => {
    it('returns original type annotation', () => {
      const result = unwrapNullable<{type: 'BooleanTypeAnnotation'}>({
        type: 'BooleanTypeAnnotation',
      });
      const expected = [
        {
          type: 'BooleanTypeAnnotation',
        },
        false,
      ];

      expect(result).toEqual(expected);
    });
  });
});

describe('assertGenericTypeAnnotationHasExactlyOneTypeParameter', () => {
  const moduleName = 'testModuleName';

  it("doesn't throw any Error when typeAnnotation has exactly one typeParameter", () => {
    const typeAnnotation = {
      typeParameters: {
        type: 'TypeParameterInstantiation',
        params: [1],
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotation,
        parser,
      ),
    ).not.toThrow();
  });

  it('throws a MissingTypeParameterGenericParserError if typeParameters is null', () => {
    const typeAnnotation = {
      typeParameters: null,
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotation,
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have type parameters."`,
    );
  });

  it('throws an error if typeAnnotation.typeParameters.type is not equal to parser.typeParameterInstantiation', () => {
    const flowTypeAnnotation = {
      typeParameters: {
        type: 'wrongType',
        params: [1],
      },
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        flowTypeAnnotation,
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type 'TypeParameterInstantiation'"`,
    );
  });

  it("throws a MoreThanOneTypeParameterGenericParserError if typeParameters don't have 1 exactly parameter", () => {
    const typeAnnotationWithTwoParams = {
      typeParameters: {
        params: [1, 2],
        type: 'TypeParameterInstantiation',
      },
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotationWithTwoParams,
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have exactly one type parameter."`,
    );

    const typeAnnotationWithNoParams = {
      typeParameters: {
        params: [],
        type: 'TypeParameterInstantiation',
      },
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotationWithNoParams,
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have exactly one type parameter."`,
    );
  });
});

describe('isObjectProperty', () => {
  const propertyStub = {
    /* type: 'notObjectTypeProperty', */
    typeAnnotation: {
      typeAnnotation: 'wrongTypeAnnotation',
    },
    value: 'wrongValue',
    name: 'wrongName',
  };

  describe("when 'language' is 'Flow'", () => {
    const language: ParserType = 'Flow';
    it("returns 'true' if 'property.type' is 'ObjectTypeProperty'", () => {
      const result = isObjectProperty(
        {
          type: 'ObjectTypeProperty',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(true);
    });

    it("returns 'false' if 'property.type' is not 'ObjectTypeProperty'", () => {
      const result = isObjectProperty(
        {
          type: 'notObjectTypeProperty',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(false);
    });
  });

  describe("when 'language' is 'TypeScript'", () => {
    const language: ParserType = 'TypeScript';
    it("returns 'true' if 'property.type' is 'TSPropertySignature'", () => {
      const result = isObjectProperty(
        {
          type: 'TSPropertySignature',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(true);
    });

    it("returns 'false' if 'property.type' is not 'TSPropertySignature'", () => {
      const result = isObjectProperty(
        {
          type: 'notTSPropertySignature',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(false);
    });
  });
});

describe('parseObjectProperty', () => {
  const moduleName = 'testModuleName';
  const types = {['wrongName']: 'wrongType'};
  const aliasMap = {};
  const tryParse = () => null;
  const cxxOnly = false;
  const nullable = true;

  describe("when 'language' is 'Flow'", () => {
    const language: ParserType = 'Flow';
    it("throws an 'UnsupportedObjectPropertyTypeAnnotationParserError' error if 'property.type' is not 'ObjectTypeProperty'.", () => {
      const property = {
        type: 'notObjectTypeProperty',
        typeAnnotation: {
          type: 'notObjectTypeProperty',
          typeAnnotation: 'wrongTypeAnnotation',
        },
        value: 'wrongValue',
        name: 'wrongName',
      };
      const expected = new UnsupportedObjectPropertyTypeAnnotationParserError(
        moduleName,
        property,
        property.type,
        language,
      );
      expect(() =>
        parseObjectProperty(
          property,
          moduleName,
          types,
          aliasMap,
          tryParse,
          cxxOnly,
          nullable,
          flowTranslateTypeAnnotation,
          parser,
        ),
      ).toThrow(expected);
    });
  });

  describe("when 'language' is 'TypeScript'", () => {
    const language: ParserType = 'TypeScript';
    it("throws an 'UnsupportedObjectPropertyTypeAnnotationParserError' error if 'property.type' is not 'TSPropertySignature'.", () => {
      const property = {
        type: 'notTSPropertySignature',
        typeAnnotation: {
          typeAnnotation: 'wrongTypeAnnotation',
        },
        value: 'wrongValue',
        name: 'wrongName',
      };
      const expected = new UnsupportedObjectPropertyTypeAnnotationParserError(
        moduleName,
        property,
        property.type,
        language,
      );
      expect(() =>
        parseObjectProperty(
          property,
          moduleName,
          types,
          aliasMap,
          tryParse,
          cxxOnly,
          nullable,
          typeScriptTranslateTypeAnnotation,
          parser,
        ),
      ).toThrow(expected);
    });
  });
});

describe('buildSchemaFromConfigType', () => {
  const astMock = {
    type: 'Program',
    loc: {
      source: null,
      start: {line: 2, column: 10},
      end: {line: 16, column: 62},
    },
    range: [11, 373],
    body: [],
    comments: [],
    errors: [],
  };

  const componentSchemaMock = {
    filename: 'filename',
    componentName: 'componentName',
    extendsProps: [],
    events: [],
    props: [],
    commands: [],
  };

  const moduleSchemaMock = {
    type: 'NativeModule',
    aliases: {},
    spec: {properties: []},
    moduleName: '',
  };

  const wrapComponentSchemaMock = jest.fn();
  const buildComponentSchemaMock = jest.fn(_ => componentSchemaMock);
  const buildModuleSchemaMock = jest.fn((_0, _1, _2, _3) => moduleSchemaMock);

  const buildSchemaFromConfigTypeHelper = (
    configType: 'module' | 'component' | 'none',
    filename: ?string,
  ) =>
    buildSchemaFromConfigType(
      configType,
      filename,
      astMock,
      wrapComponentSchemaMock,
      buildComponentSchemaMock,
      buildModuleSchemaMock,
      parser,
    );

  describe('when configType is none', () => {
    it('returns an empty schema', () => {
      const schema = buildSchemaFromConfigTypeHelper('none');

      expect(schema).toEqual({modules: {}});
    });
  });

  describe('when configType is component', () => {
    it('calls buildComponentSchema with ast and wrapComponentSchema with the result', () => {
      buildSchemaFromConfigTypeHelper('component');

      expect(buildComponentSchemaMock).toHaveBeenCalledTimes(1);
      expect(buildComponentSchemaMock).toHaveBeenCalledWith(astMock);
      expect(wrapComponentSchemaMock).toHaveBeenCalledTimes(1);
      expect(wrapComponentSchemaMock).toHaveBeenCalledWith(componentSchemaMock);

      expect(buildModuleSchemaMock).not.toHaveBeenCalled();
    });
  });

  describe('when configType is module', () => {
    describe('when filename is undefined', () => {
      it('throws an error', () => {
        expect(() => buildSchemaFromConfigTypeHelper('module')).toThrow(
          'Filepath expected while parasing a module',
        );
      });
    });

    describe('when filename is null', () => {
      it('throws an error', () => {
        expect(() => buildSchemaFromConfigTypeHelper('module', null)).toThrow(
          'Filepath expected while parasing a module',
        );
      });
    });

    describe('when filename is defined and not null', () => {
      describe('when buildModuleSchema throws', () => {
        it('throws the error', () => {
          const parserError = new ParserError(
            'moduleName',
            astMock,
            'Something went wrong',
          );
          buildModuleSchemaMock.mockImplementationOnce(() => {
            throw parserError;
          });

          expect(() =>
            buildSchemaFromConfigTypeHelper('module', 'filename'),
          ).toThrow(parserError);
        });
      });

      describe('when buildModuleSchema returns null', () => {
        it('throws an error', () => {
          // $FlowIgnore[incompatible-call] - This is to test an invariant
          buildModuleSchemaMock.mockReturnValueOnce(null);

          expect(() =>
            buildSchemaFromConfigTypeHelper('module', 'filename'),
          ).toThrow(
            'When there are no parsing errors, the schema should not be null',
          );
        });
      });

      describe('when buildModuleSchema returns a schema', () => {
        it('calls buildModuleSchema with ast and wrapModuleSchema with the result', () => {
          buildSchemaFromConfigTypeHelper('module', 'filename');

          expect(buildModuleSchemaMock).toHaveBeenCalledTimes(1);
          expect(buildModuleSchemaMock).toHaveBeenCalledWith(
            'filename',
            astMock,
            expect.any(Function),
            parser,
          );

          expect(buildComponentSchemaMock).not.toHaveBeenCalled();
          expect(wrapComponentSchemaMock).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('isModuleRegistryCall', () => {
    describe('when node is not of CallExpression type', () => {
      it('returns false', () => {
        const node = {
          type: 'NotCallExpression',
        };
        expect(isModuleRegistryCall(node)).toBe(false);
      });
    });

    describe('when node is of CallExpressionType', () => {
      describe('when callee type is not of MemberExpression type', () => {
        it('returns false', () => {
          const node = {
            type: 'CallExpression',
            callee: {
              type: 'NotMemberExpression',
            },
          };
          expect(isModuleRegistryCall(node)).toBe(false);
        });
      });

      describe('when callee type is of MemberExpression type', () => {
        describe('when memberExpression has an object of type different than "Identifier"', () => {
          it('returns false', () => {
            const node = {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                object: {
                  type: 'NotIdentifier',
                  name: 'TurboModuleRegistry',
                },
              },
            };
            expect(isModuleRegistryCall(node)).toBe(false);
          });
        });

        describe('when memberExpression has an object of name different than "TurboModuleRegistry"', () => {
          it('returns false', () => {
            const node = {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                object: {
                  type: 'Identifier',
                  name: 'NotTurboModuleRegistry',
                },
              },
            };
            expect(isModuleRegistryCall(node)).toBe(false);
          });
        });

        describe('when memberExpression has an object of type "Identifier" and name "TurboModuleRegistry', () => {
          describe('when memberExpression has a property of type different than "Identifier"', () => {
            it('returns false', () => {
              const node = {
                type: 'CallExpression',
                callee: {
                  type: 'MemberExpression',
                  object: {
                    type: 'Identifier',
                    name: 'TurboModuleRegistry',
                  },
                  property: {
                    type: 'NotIdentifier',
                    name: 'get',
                  },
                },
              };
              expect(isModuleRegistryCall(node)).toBe(false);
            });
          });

          describe('when memberExpression has a property of name different than "get" or "getEnforcing', () => {
            it('returns false', () => {
              const node = {
                type: 'CallExpression',
                callee: {
                  type: 'MemberExpression',
                  object: {
                    type: 'Identifier',
                    name: 'TurboModuleRegistry',
                  },
                  property: {
                    type: 'Identifier',
                    name: 'NotGet',
                  },
                },
              };
              expect(isModuleRegistryCall(node)).toBe(false);
            });
          });

          describe('when memberExpression has a property of type "Identifier" and of name "get" or "getEnforcing', () => {
            describe('when memberExpression is computed', () => {
              it('returns false', () => {
                const node = {
                  type: 'CallExpression',
                  callee: {
                    type: 'MemberExpression',
                    object: {
                      type: 'Identifier',
                      name: 'TurboModuleRegistry',
                    },
                    property: {
                      type: 'Identifier',
                      name: 'get',
                    },
                    computed: true,
                  },
                };
                expect(isModuleRegistryCall(node)).toBe(false);
              });
            });

            describe('when memberExpression is not computed', () => {
              it('returns true', () => {
                const node = {
                  type: 'CallExpression',
                  callee: {
                    type: 'MemberExpression',
                    object: {
                      type: 'Identifier',
                      name: 'TurboModuleRegistry',
                    },
                    property: {
                      type: 'Identifier',
                      name: 'get',
                    },
                    computed: false,
                  },
                };
                expect(isModuleRegistryCall(node)).toBe(true);
              });
            });
          });
        });
      });
    });
  });
});

describe('buildSchema', () => {
  const getConfigTypeSpy = jest.spyOn(require('../utils'), 'getConfigType');

  describe('when there is no codegenNativeComponent and no TurboModule', () => {
    const contents = '';

    it('returns an empty module', () => {
      const schema = buildSchema(
        contents,
        'fileName',
        wrapComponentSchema,
        buildComponentSchema,
        buildModuleSchema,
        Visitor,
        parser,
      );

      expect(getConfigTypeSpy).not.toHaveBeenCalled();
      expect(schema).toEqual({modules: {}});
    });
  });

  describe('when there is a codegenNativeComponent', () => {
    const contents = `
      import type {ViewProps} from 'ViewPropTypes';
      import type {HostComponent} from 'react-native';
      
      const codegenNativeComponent = require('codegenNativeComponent');
      
      export type ModuleProps = $ReadOnly<{|
        ...ViewProps,
      |}>;
      
      export default (codegenNativeComponent<ModuleProps>(
        'Module',
      ): HostComponent<ModuleProps>);
    `;

    it('returns a module with good properties', () => {
      const schema = buildSchema(
        contents,
        'fileName',
        wrapComponentSchema,
        buildComponentSchema,
        buildModuleSchema,
        Visitor,
        parser,
      );

      expect(getConfigTypeSpy).toHaveBeenCalledTimes(1);
      expect(getConfigTypeSpy).toHaveBeenCalledWith(
        parser.getAst(contents),
        Visitor,
      );
      expect(schema).toEqual({
        modules: {
          Module: {
            type: 'Component',
            components: {
              Module: {
                extendsProps: [
                  {
                    type: 'ReactNativeBuiltInType',
                    knownTypeName: 'ReactNativeCoreViewProps',
                  },
                ],
                events: [],
                props: [],
                commands: [],
              },
            },
          },
        },
      });
    });
  });

  describe('when there is a TurboModule', () => {
    const contents = `
      import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
      import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
      
      export interface Spec extends TurboModule {
        +getArray: (a: Array<any>) => Array<string>;
      }
      
      export default (TurboModuleRegistry.getEnforcing<Spec>(
        'SampleTurboModule',
      ): Spec);
    `;

    it('returns a module with good properties', () => {
      const schema = buildSchema(
        contents,
        'fileName',
        wrapComponentSchema,
        buildComponentSchema,
        buildModuleSchema,
        Visitor,
        parser,
      );

      expect(getConfigTypeSpy).toHaveBeenCalledTimes(1);
      expect(getConfigTypeSpy).toHaveBeenCalledWith(
        parser.getAst(contents),
        Visitor,
      );
      expect(schema).toEqual({
        modules: {
          fileName: {
            type: 'NativeModule',
            aliases: {},
            spec: {
              properties: [
                {
                  name: 'getArray',
                  optional: false,
                  typeAnnotation: {
                    type: 'FunctionTypeAnnotation',
                    returnTypeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      elementType: {type: 'StringTypeAnnotation'},
                    },
                    params: [
                      {
                        name: 'a',
                        optional: false,
                        typeAnnotation: {type: 'ArrayTypeAnnotation'},
                      },
                    ],
                  },
                },
              ],
            },
            moduleName: 'SampleTurboModule',
            excludedPlatforms: undefined,
          },
        },
      });
    });
  });
});
