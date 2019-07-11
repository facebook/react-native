/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow
 * @format
 */
'use strict';

export function toCppNamespace(domain: string) {
  return domain.substr(0, 1).toLowerCase() + domain.substr(1);
}

export function toCppType(type: string) {
  return type.substr(0, 1).toUpperCase() + type.substr(1);
}

const jsTypeMappings: {[key: string]: string} = {
  any: 'folly::dynamic',
  array: 'folly::dynamic',
  boolean: 'bool',
  integer: 'int',
  number: 'double',
  object: 'folly::dynamic',
  string: 'std::string',
};

export function jsTypeToCppType(jsTypeStr: string): string {
  const cppType = jsTypeMappings[jsTypeStr];
  if (!cppType) {
    throw new TypeError(`${jsTypeStr} is not an expected JS type string`);
  }
  return cppType;
}
