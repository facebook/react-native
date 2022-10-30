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

'use strict';

const {
  extractNativeModuleName,
  createParserErrorCapturer,
  verifyPlatforms,
  visit,
  buildSchemaFromConfigType,
  isModuleRegistryCall,
} = require('../utils.js');
const {ParserError} = require('../errors');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('extractnativeModuleName', () => {
  it('return filename when it ends with .js', () => {
    const filename = '/some_folder/NativeModule.js';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .ts', () => {
    const filename = '/some_folder/NativeModule.ts';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .tsx', () => {
    const filename = '/some_folder/NativeModule.tsx';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .android.js', () => {
    const filename = '/some_folder/NativeModule.android.js';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .android.ts', () => {
    const filename = '/some_folder/NativeModule.android.ts';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .android.tsx', () => {
    const filename = '/some_folder/NativeModule.android.tsx';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .ios.js', () => {
    const filename = '/some_folder/NativeModule.ios.ts';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .ios.ts', () => {
    const filename = '/some_folder/NativeModule.ios.ts';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .ios.tsx', () => {
    const filename = '/some_folder/NativeModule.ios.tsx';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .windows.js', () => {
    const filename = '/some_folder/NativeModule.windows.js';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
});

describe('createParserErrorCapturer', () => {
  describe("when function doesn't throw", () => {
    it("returns result and doesn't change errors array", () => {
      const [errors, guard] = createParserErrorCapturer();
      const fn = () => 'result';

      const result = guard(fn);
      expect(result).toBe('result');
      expect(errors).toHaveLength(0);
    });
  });

  describe('when function throws a ParserError', () => {
    it('returns null and adds the error in errors array instead of throwing it', () => {
      const [errors, guard] = createParserErrorCapturer();
      const ErrorThrown = new ParserError(
        'moduleName',
        null,
        'Something went wrong :(',
      );
      const fn = () => {
        throw ErrorThrown;
      };

      const result = guard(fn);
      expect(result).toBe(null);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(ErrorThrown);
      expect(() => guard(fn)).not.toThrow();
    });
  });

  describe('when function throws another error', () => {
    it("throws the error and doesn't change errors array", () => {
      const [errors, guard] = createParserErrorCapturer();
      const errorMessage = 'Something else went wrong :(';
      const fn = () => {
        throw new Error(errorMessage);
      };

      expect(() => guard(fn)).toThrow(errorMessage);
      expect(errors).toHaveLength(0);
    });
  });
});

describe('verifyPlatforms', () => {
  it('exclude android given an iOS only module', () => {
    let result = verifyPlatforms('NativeSampleTurboModule', [
      'SampleTurboModuleIOS',
    ]);

    expect(result.cxxOnly).toBe(false);
    expect(result.excludedPlatforms).toEqual(['android']);

    result = verifyPlatforms('NativeSampleTurboModuleIOS', [
      'SampleTurboModule',
    ]);
    expect(result.cxxOnly).toBe(false);
    expect(result.excludedPlatforms).toEqual(['android']);

    result = verifyPlatforms('NativeSampleTurboModuleIOS', [
      'SampleTurboModuleIOS',
    ]);
    expect(result.cxxOnly).toBe(false);
    expect(result.excludedPlatforms).toEqual(['android']);
  });

  it('exclude iOS given an android only module', () => {
    let result = verifyPlatforms('NativeSampleTurboModule', [
      'SampleTurboModuleAndroid',
    ]);

    expect(result.cxxOnly).toBe(false);
    expect(result.excludedPlatforms).toEqual(['iOS']);

    result = verifyPlatforms('NativeSampleTurboModuleAndroid', [
      'SampleTurboModule',
    ]);
    expect(result.cxxOnly).toBe(false);
    expect(result.excludedPlatforms).toEqual(['iOS']);

    result = verifyPlatforms('NativeSampleTurboModuleAndroid', [
      'SampleTurboModuleAndroid',
    ]);
    expect(result.cxxOnly).toBe(false);
    expect(result.excludedPlatforms).toEqual(['iOS']);
  });

  it('exclude iOS and android given a Cxx only module', () => {
    let result = verifyPlatforms('NativeSampleTurboModule', [
      'SampleTurboModuleCxx',
    ]);

    expect(result.cxxOnly).toBe(true);
    expect(result.excludedPlatforms).toEqual(['iOS', 'android']);

    result = verifyPlatforms('NativeSampleTurboModuleCxx', [
      'SampleTurboModule',
    ]);
    expect(result.cxxOnly).toBe(true);
    expect(result.excludedPlatforms).toEqual(['iOS', 'android']);

    result = verifyPlatforms('NativeSampleTurboModuleCxx', [
      'SampleTurboModuleCxx',
    ]);
    expect(result.cxxOnly).toBe(true);
    expect(result.excludedPlatforms).toEqual(['iOS', 'android']);
  });
});

describe('visit', () => {
  describe('when the astNode is null', () => {
    it("doesn't call the visitor function", () => {
      const visitorFunction = jest.fn();
      const visitor = {
        itemType: visitorFunction,
      };

      const astNode = null;

      visit(astNode, visitor);

      expect(visitorFunction).not.toHaveBeenCalled();
    });
  });

  describe('when the astNode is not an object', () => {
    it("doesn't call the visitor function", () => {
      const visitorFunction = jest.fn();
      const visitor = {
        itemType: visitorFunction,
      };

      const astNode = 'astNode';

      visit(astNode, visitor);

      expect(visitorFunction).not.toHaveBeenCalled();
    });
  });

  describe('when the astNode is an object', () => {
    describe("when the astNode has a string type that doesn't exist in the visitor object", () => {
      it("doesn't call the visitor function", () => {
        const visitorFunction = jest.fn();
        const visitor = {
          itemType: visitorFunction,
        };

        const astNode = {type: 'itemTypeNotInVisitor'};

        visit(astNode, visitor);

        expect(visitorFunction).not.toHaveBeenCalled();
      });
    });

    describe('when the astNode has a string type that exists in the visitor object', () => {
      it("doesn't call the visitor function", () => {
        const visitorFunction = jest.fn();
        const visitor = {
          itemType: visitorFunction,
        };

        const astNode = {type: 'itemType'};

        visit(astNode, visitor);

        expect(visitorFunction).toHaveBeenCalledTimes(1);
      });
    });

    describe("when the astNode doesn't have a string type", () => {
      it('iterates on every values of the astNode', () => {
        const visitorFunction = jest.fn();
        const visitor = {
          itemType1: visitorFunction,
          itemType2: visitorFunction,
        };

        const astNode = {
          firstChildNode: {type: 'itemType1'},
          secondChildNode: {type: 'itemType2'},
          thirdChildNode: {type: 'itemType3'},
        };

        visit(astNode, visitor);

        expect(visitorFunction).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('when the astNode is an array', () => {
    it('iterates on every values of the astNode', () => {
      const visitorFunction = jest.fn();
      const visitor = {
        itemType1: visitorFunction,
        itemType2: visitorFunction,
      };

      const astNode = [
        {type: 'itemType1'},
        {type: 'itemType2'},
        {type: 'itemType3'},
      ];

      visit(astNode, visitor);

      expect(visitorFunction).toHaveBeenCalledTimes(2);
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
    moduleNames: [],
  };

  const wrapComponentSchemaMock = jest.fn();
  const buildComponentSchemaMock = jest.fn(() => componentSchemaMock);
  const wrapModuleSchemaMock = jest.spyOn(
    require('../parsers-commons'),
    'wrapModuleSchema',
  );
  const buildModuleSchemaMock = jest.fn(() => moduleSchemaMock);

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
      expect(wrapModuleSchemaMock).not.toHaveBeenCalled();
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
          );
          expect(wrapModuleSchemaMock).toHaveBeenCalledTimes(1);
          expect(wrapModuleSchemaMock).toHaveBeenCalledWith(
            moduleSchemaMock,
            'filename',
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
