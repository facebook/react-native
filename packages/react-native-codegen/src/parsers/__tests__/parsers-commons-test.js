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

import {assertGenericTypeAnnotationHasExactlyOneTypeParameter} from '../parsers-commons';
import type {ParserType} from '../errors';
const {
  wrapNullable,
  unwrapNullable,
  emitMixedTypeAnnotation,
  emitUnionTypeAnnotation,
} = require('../parsers-commons.js');
const {UnsupportedUnionTypeAnnotationParserError} = require('../errors');
import type {UnionTypeAnnotationMemberType} from '../../CodegenSchema';

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
      const result = unwrapNullable({
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
      const result = unwrapNullable({
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
        'Flow',
      ),
    ).not.toThrow();
  });

  it('throws an IncorrectlyParameterizedGenericParserError if typeParameters is null', () => {
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
        'Flow',
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have type parameters."`,
    );
  });

  it('throws an error if typeAnnotation.typeParameters.type is not TypeParameterInstantiation when language is Flow', () => {
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
        'Flow',
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type 'TypeParameterInstantiation'"`,
    );
  });

  it('throws an error if typeAnnotation.typeParameters.type is not TSTypeParameterInstantiation when language is TypeScript', () => {
    const typeScriptTypeAnnotation = {
      typeParameters: {
        type: 'wrongType',
        params: [1],
      },
      typeName: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeScriptTypeAnnotation,
        'TypeScript',
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type 'TSTypeParameterInstantiation'"`,
    );
  });

  it("throws an IncorrectlyParameterizedGenericParserError if typeParameters don't have 1 exactly parameter for Flow", () => {
    const language: ParserType = 'Flow';
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
        language,
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
        language,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have exactly one type parameter."`,
    );
  });

  it("throws an IncorrectlyParameterizedGenericParserError if typeParameters don't have 1 exactly parameter for TS", () => {
    const language: ParserType = 'TypeScript';
    const typeAnnotationWithTwoParams = {
      typeParameters: {
        params: [1, 2],
        type: 'TSTypeParameterInstantiation',
      },
      typeName: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotationWithTwoParams,
        language,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have exactly one type parameter."`,
    );

    const typeAnnotationWithNoParams = {
      typeParameters: {
        params: [],
        type: 'TSTypeParameterInstantiation',
      },
      typeName: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotationWithNoParams,
        language,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have exactly one type parameter."`,
    );
  });
});

describe('emitMixedTypeAnnotation', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitMixedTypeAnnotation(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'MixedTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitMixedTypeAnnotation(false);
      const expected = {
        type: 'MixedTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitUnionTypeAnnotation', () => {
  const hasteModuleName = 'SampleTurboModule';

  describe('when language is flow', () => {
    const language: ParserType = 'Flow';

    describe('when members type is numeric', () => {
      const typeAnnotation = {
        type: 'UnionTypeAnnotation',
        types: [
          {type: 'NumberLiteralTypeAnnotation'},
          {type: 'NumberLiteralTypeAnnotation'},
        ],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            true,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              memberType: 'NumberTypeAnnotation',
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            false,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            memberType: 'NumberTypeAnnotation',
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is string', () => {
      const typeAnnotation = {
        type: 'UnionTypeAnnotation',
        types: [
          {type: 'StringLiteralTypeAnnotation'},
          {type: 'StringLiteralTypeAnnotation'},
        ],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            true,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              memberType: 'StringTypeAnnotation',
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            false,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            memberType: 'StringTypeAnnotation',
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is object', () => {
      const typeAnnotation = {
        type: 'UnionTypeAnnotation',
        types: [{type: 'ObjectTypeAnnotation'}, {type: 'ObjectTypeAnnotation'}],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            true,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              memberType: 'ObjectTypeAnnotation',
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            false,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            memberType: 'ObjectTypeAnnotation',
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is mixed', () => {
      const typeAnnotation = {
        type: 'UnionTypeAnnotation',
        types: [
          {type: 'NumberLiteralTypeAnnotation'},
          {type: 'StringLiteralTypeAnnotation'},
          {type: 'ObjectTypeAnnotation'},
        ],
      };
      const unionTypes: UnionTypeAnnotationMemberType[] = [
        'NumberTypeAnnotation',
        'StringTypeAnnotation',
        'ObjectTypeAnnotation',
      ];
      describe('when nullable is true', () => {
        it('throws an excpetion', () => {
          const expected = new UnsupportedUnionTypeAnnotationParserError(
            hasteModuleName,
            typeAnnotation,
            unionTypes,
            language,
          );

          expect(() => {
            emitUnionTypeAnnotation(
              true,
              hasteModuleName,
              typeAnnotation,
              language,
            );
          }).toThrow(expected);
        });
      });

      describe('when nullable is false', () => {
        it('throws an excpetion', () => {
          const expected = new UnsupportedUnionTypeAnnotationParserError(
            hasteModuleName,
            typeAnnotation,
            unionTypes,
            language,
          );

          expect(() => {
            emitUnionTypeAnnotation(
              false,
              hasteModuleName,
              typeAnnotation,
              language,
            );
          }).toThrow(expected);
        });
      });
    });
  });

  describe('when language is typescript', () => {
    const language: ParserType = 'TypeScript';

    describe('when members type is numeric', () => {
      const typeAnnotation = {
        type: 'TSUnionType',
        types: [
          {
            type: 'TSLiteralType',
            literal: {type: 'NumericLiteral'},
          },
          {
            type: 'TSLiteralType',
            literal: {type: 'NumericLiteral'},
          },
        ],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            true,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              memberType: 'NumberTypeAnnotation',
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            false,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            memberType: 'NumberTypeAnnotation',
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is string', () => {
      const typeAnnotation = {
        type: 'TSUnionType',
        types: [
          {
            type: 'TSLiteralType',
            literal: {type: 'StringLiteral'},
          },
          {
            type: 'TSLiteralType',
            literal: {type: 'StringLiteral'},
          },
        ],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            true,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              memberType: 'StringTypeAnnotation',
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            false,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            memberType: 'StringTypeAnnotation',
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is object', () => {
      const typeAnnotation = {
        type: 'TSUnionType',
        types: [
          {
            type: 'TSLiteralType',
          },
          {
            type: 'TSLiteralType',
          },
        ],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            true,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              memberType: 'ObjectTypeAnnotation',
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            false,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            memberType: 'ObjectTypeAnnotation',
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is mixed', () => {
      const typeAnnotation = {
        type: 'TSUnionType',
        types: [
          {
            type: 'TSLiteralType',
            literal: {type: 'NumericLiteral'},
          },
          {
            type: 'TSLiteralType',
            literal: {type: 'StringLiteral'},
          },
          {
            type: 'TSLiteralType',
          },
        ],
      };
      const unionTypes = [
        'NumberTypeAnnotation',
        'StringTypeAnnotation',
        'ObjectTypeAnnotation',
      ];
      describe('when nullable is true', () => {
        it('throws an excpetion', () => {
          const expected = new UnsupportedUnionTypeAnnotationParserError(
            hasteModuleName,
            typeAnnotation,
            unionTypes,
            language,
          );

          expect(() => {
            emitUnionTypeAnnotation(
              true,
              hasteModuleName,
              typeAnnotation,
              language,
            );
          }).toThrow(expected);
        });
      });

      describe('when nullable is false', () => {
        it('throws an excpetion', () => {
          const expected = new UnsupportedUnionTypeAnnotationParserError(
            hasteModuleName,
            typeAnnotation,
            unionTypes,
            language,
          );

          expect(() => {
            emitUnionTypeAnnotation(
              false,
              hasteModuleName,
              typeAnnotation,
              language,
            );
          }).toThrow(expected);
        });
      });
    });
  });
});
