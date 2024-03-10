/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// flowlint unsafe-getters-setters:off

import type ReadOnlyElement from './ReadOnlyElement';

import {getFabricUIManager} from '../../../../../Libraries/ReactNative/FabricUIManager';
import ReadOnlyNode, {getShadowNode} from './ReadOnlyNode';
import {getElementSibling} from './utilities/Traversal';
import nullthrows from 'nullthrows';

export default class ReadOnlyCharacterData extends ReadOnlyNode {
  get nextElementSibling(): ReadOnlyElement | null {
    return getElementSibling(this, 'next');
  }

  get previousElementSibling(): ReadOnlyElement | null {
    return getElementSibling(this, 'previous');
  }

  get data(): string {
    const shadowNode = getShadowNode(this);

    if (shadowNode != null) {
      return nullthrows(getFabricUIManager()).getTextContent(shadowNode);
    }

    return '';
  }

  get length(): number {
    return this.data.length;
  }

  /**
   * @override
   */
  get textContent(): string | null {
    return this.data;
  }

  /**
   * @override
   */
  get nodeValue(): string {
    return this.data;
  }

  substringData(offset: number, count: number): string {
    const data = this.data;
    if (offset < 0) {
      throw new TypeError(
        `Failed to execute 'substringData' on 'CharacterData': The offset ${offset} is negative.`,
      );
    }
    if (offset > data.length) {
      throw new TypeError(
        `Failed to execute 'substringData' on 'CharacterData': The offset ${offset} is greater than the node's length (${data.length}).`,
      );
    }
    let adjustedCount = count < 0 || count > data.length ? data.length : count;
    return data.slice(offset, offset + adjustedCount);
  }
}
