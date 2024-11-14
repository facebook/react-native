/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {MixedElement} from 'react';

import ReactFabric from '../../../Libraries/Renderer/shims/ReactFabric';

let globalSurfaceIdCounter = 1;

class Root {
  #surfaceId: number;
  #hasRendered: boolean = false;

  constructor() {
    this.#surfaceId = globalSurfaceIdCounter;
    globalSurfaceIdCounter += 10;
  }

  render(element: MixedElement) {
    if (!this.#hasRendered) {
      global.$$JSTesterModuleName$$.startSurface(this.#surfaceId);
      this.#hasRendered = true;
    }
    ReactFabric.render(element, this.#surfaceId);
  }

  destroy() {
    // TODO: check for leaks.
    global.$$JSTesterModuleName$$.stopSurface(this.#surfaceId);
  }

  // TODO: add an API to check if all surfaces were deallocated when tests are finished.
}

// TODO: Add option to define surface props and pass it to startSurface
// Surfacep rops: concurrentRoot, surfaceWidth, surfaceHeight, layoutDirection, pointScaleFactor.
export function createRoot(): Root {
  return new Root();
}
