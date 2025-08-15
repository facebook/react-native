/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// flowlint unsafe-getters-setters:off

import ReadOnlyCharacterData from './ReadOnlyCharacterData';
import ReadOnlyNode from './ReadOnlyNode';

export default class ReadOnlyText extends ReadOnlyCharacterData {
  /**
   * @override
   */
  get nodeName(): string {
    return '#text';
  }

  /**
   * @override
   */
  get nodeType(): number {
    return ReadOnlyNode.TEXT_NODE;
  }
}
