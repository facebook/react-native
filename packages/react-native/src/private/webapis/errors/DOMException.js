/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * This module implements the `DOMException` interface from WebIDL.
 * See https://webidl.spec.whatwg.org/#idl-DOMException.
 */

// flowlint unsafe-getters-setters:off

import {setPlatformObject} from '../webidl/PlatformObjects';

const ERROR_NAME_TO_ERROR_CODE_MAP: {[string]: number} = {
  IndexSizeError: 1,
  HierarchyRequestError: 3,
  WrongDocumentError: 4,
  InvalidCharacterError: 5,
  NoModificationAllowedError: 7,
  NotFoundError: 8,
  NotSupportedError: 9,
  InUseAttributeError: 10,
  InvalidStateError: 11,
  SyntaxError: 12,
  InvalidModificationError: 13,
  NamespaceError: 14,
  InvalidAccessError: 15,
  TypeMismatchError: 17,
  SecurityError: 18,
  NetworkError: 19,
  AbortError: 20,
  URLMismatchError: 21,
  QuotaExceededError: 22,
  TimeoutError: 23,
  InvalidNodeTypeError: 24,
  DataCloneError: 25,
};

const ERROR_CODES: {[string]: number} = {
  INDEX_SIZE_ERR: 1,
  DOMSTRING_SIZE_ERR: 2,
  HIERARCHY_REQUEST_ERR: 3,
  WRONG_DOCUMENT_ERR: 4,
  INVALID_CHARACTER_ERR: 5,
  NO_DATA_ALLOWED_ERR: 6,
  NO_MODIFICATION_ALLOWED_ERR: 7,
  NOT_FOUND_ERR: 8,
  NOT_SUPPORTED_ERR: 9,
  INUSE_ATTRIBUTE_ERR: 10,
  INVALID_STATE_ERR: 11,
  SYNTAX_ERR: 12,
  INVALID_MODIFICATION_ERR: 13,
  NAMESPACE_ERR: 14,
  INVALID_ACCESS_ERR: 15,
  VALIDATION_ERR: 16,
  TYPE_MISMATCH_ERR: 17,
  SECURITY_ERR: 18,
  NETWORK_ERR: 19,
  ABORT_ERR: 20,
  URL_MISMATCH_ERR: 21,
  QUOTA_EXCEEDED_ERR: 22,
  TIMEOUT_ERR: 23,
  INVALID_NODE_TYPE_ERR: 24,
  DATA_CLONE_ERR: 25,
};

/* eslint-disable @react-native/monorepo/require-extends-error */
// $FlowExpectedError[incompatible-variance] name is writable in Error but not in DOMException, but this is how it works on Web.
export default class DOMException extends Error {
  static +INDEX_SIZE_ERR: 1;
  static +DOMSTRING_SIZE_ERR: 2;
  static +HIERARCHY_REQUEST_ERR: 3;
  static +WRONG_DOCUMENT_ERR: 4;
  static +INVALID_CHARACTER_ERR: 5;
  static +NO_DATA_ALLOWED_ERR: 6;
  static +NO_MODIFICATION_ALLOWED_ERR: 7;
  static +NOT_FOUND_ERR: 8;
  static +NOT_SUPPORTED_ERR: 9;
  static +INUSE_ATTRIBUTE_ERR: 10;
  static +INVALID_STATE_ERR: 11;
  static +SYNTAX_ERR: 12;
  static +INVALID_MODIFICATION_ERR: 13;
  static +NAMESPACE_ERR: 14;
  static +INVALID_ACCESS_ERR: 15;
  static +VALIDATION_ERR: 16;
  static +TYPE_MISMATCH_ERR: 17;
  static +SECURITY_ERR: 18;
  static +NETWORK_ERR: 19;
  static +ABORT_ERR: 20;
  static +URL_MISMATCH_ERR: 21;
  static +QUOTA_EXCEEDED_ERR: 22;
  static +TIMEOUT_ERR: 23;
  static +INVALID_NODE_TYPE_ERR: 24;
  static +DATA_CLONE_ERR: 25;

  +INDEX_SIZE_ERR: 1;
  +DOMSTRING_SIZE_ERR: 2;
  +HIERARCHY_REQUEST_ERR: 3;
  +WRONG_DOCUMENT_ERR: 4;
  +INVALID_CHARACTER_ERR: 5;
  +NO_DATA_ALLOWED_ERR: 6;
  +NO_MODIFICATION_ALLOWED_ERR: 7;
  +NOT_FOUND_ERR: 8;
  +NOT_SUPPORTED_ERR: 9;
  +INUSE_ATTRIBUTE_ERR: 10;
  +INVALID_STATE_ERR: 11;
  +SYNTAX_ERR: 12;
  +INVALID_MODIFICATION_ERR: 13;
  +NAMESPACE_ERR: 14;
  +INVALID_ACCESS_ERR: 15;
  +VALIDATION_ERR: 16;
  +TYPE_MISMATCH_ERR: 17;
  +SECURITY_ERR: 18;
  +NETWORK_ERR: 19;
  +ABORT_ERR: 20;
  +URL_MISMATCH_ERR: 21;
  +QUOTA_EXCEEDED_ERR: 22;
  +TIMEOUT_ERR: 23;
  +INVALID_NODE_TYPE_ERR: 24;
  +DATA_CLONE_ERR: 25;

  #name: string;
  #code: number;

  constructor(message?: string, name?: string) {
    super(message);

    if (typeof name === 'undefined') {
      this.#name = 'Error';
      this.#code = 0;
    } else {
      this.#name = String(name);
      this.#code = ERROR_NAME_TO_ERROR_CODE_MAP[this.name] ?? 0;
    }
  }

  get name(): string {
    return this.#name;
  }

  get code(): number {
    return this.#code;
  }
}

for (const code in ERROR_CODES) {
  Object.defineProperty(DOMException, code, {
    enumerable: true,
    value: ERROR_CODES[code],
  });

  Object.defineProperty(DOMException.prototype, code, {
    enumerable: true,
    value: ERROR_CODES[code],
  });
}

setPlatformObject(DOMException, {
  clone: exception => new DOMException(exception.message, exception.name),
});
