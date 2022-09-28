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

import type { TSTypeAnnotation } from '@babel/types';

export type TopLevelType = {
    unions: Array<TSTypeAnnotation>,
    optional: boolean,
    defaultValue?: string | number | boolean | null,
};

function handleUnionAndParen(type: TSTypeAnnotation, result: TopLevelType): void {
    switch (type.type) {
        case 'TSParenthesizedType': {
            handleUnionAndParen(type.typeAnnotation, result);
            break;
        }
        case 'TSUnionType': {
            for (const t of type.types) {
                if (t.type === 'TSNullKeyword' || t.type === 'TSUndefinedKeyword') {
                    result.optional = true;
                } else {
                    handleUnionAndParen(t, result);
                }
            }
            break;
        }
        case 'TSTypeReference':
            if (type.typeName.name === 'WithDefault') {
                if (type.typeParameters.params.length !== 2) {
                    throw new Error(`WithDefault requires two parameters: type and default value.`);
                }
                if (result.defaultValue !== undefined) {
                    throw new Error(`Multiple WithDefault is not allowed in a union type.`);
                }
                result.optional = true;
                handleUnionAndParen(typeParameters.params[0], result);

                const valueType = typeParameters.params[1].type;
                if (valueType === 'TSLiteralType') {
                    const literal = defaultLiteralType.literal;
                    if (literal.type === 'Literal') {
                        if (typeof literal.value === 'string' || typeof literal.value === 'number' || typeof literal.value === 'boolean') {
                            result.defaultValue = literal.value;
                        }
                    } else if (literal.type === 'UnaryExpression' && literal.argument.type === 'Literal' && typeof literal.argument.literal === 'number') {
                        result.defaultValue = -literal.argument.value;
                    }
                } else if (valueType === 'TSNullKeyword' || valueType === 'TSUndefinedKeyword') {
                    result.defaultValue = null;
                }

                if (result.defaultValue === undefined) {
                    throw new Error('The default value in WithDefault must be string, number, boolean or null.');
                }
                break;
            }
        // fall through
        default:
            result.unions.push(type);
    }
}

export function parseTopLevelType(type: TSTypeAnnotation): TopLevelType {
    let result: TopLevelType = { unions: [], optional: false };
    handleUnionAndParen(type, result);
    return result;
}