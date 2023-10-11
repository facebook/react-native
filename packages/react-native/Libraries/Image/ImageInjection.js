/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {AbstractImageAndroid, AbstractImageIOS} from './ImageTypes.flow';

type ImageComponentDecorator = (AbstractImageAndroid => AbstractImageAndroid) &
  (AbstractImageIOS => AbstractImageIOS);

let injectedImageComponentDecorator: ?ImageComponentDecorator;

export function unstable_setImageComponentDecorator(
  imageComponentDecorator: ?ImageComponentDecorator,
): void {
  injectedImageComponentDecorator = imageComponentDecorator;
}

export function unstable_getImageComponentDecorator(): ?ImageComponentDecorator {
  return injectedImageComponentDecorator;
}
