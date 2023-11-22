/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {
  AbstractImageAndroid,
  AbstractImageIOS,
  Image as ImageComponent,
} from './ImageTypes.flow';

import * as React from 'react';
import {useRef} from 'react';

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

type ImageInstance = React.ElementRef<ImageComponent>;

type ImageAttachedCallback = (
  imageInstance: ImageInstance,
) => void | (() => void);

const imageAttachedCallbacks = new Set<ImageAttachedCallback>();

export function unstable_registerImageAttachedCallback(
  callback: ImageAttachedCallback,
): void {
  imageAttachedCallbacks.add(callback);
}

export function unstable_unregisterImageAttachedCallback(
  callback: ImageAttachedCallback,
): void {
  imageAttachedCallbacks.delete(callback);
}

type ProxyRef = (ImageInstance | null) => void;

export function useWrapRefWithImageAttachedCallbacks(
  forwardedRef?: React.Ref<ImageComponent>,
): ProxyRef {
  const pendingCleanupCallbacks = useRef<Array<() => void>>([]);
  const proxyRef = useRef<ProxyRef>(node => {
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (typeof forwardedRef === 'object' && forwardedRef != null) {
      forwardedRef.current = node;
    }

    if (node == null) {
      if (pendingCleanupCallbacks.current.length > 0) {
        pendingCleanupCallbacks.current.forEach(cb => cb());
        pendingCleanupCallbacks.current = [];
      }
    } else {
      imageAttachedCallbacks.forEach(imageAttachedCallback => {
        const maybeCleanupCallback = imageAttachedCallback(node);
        if (maybeCleanupCallback != null) {
          pendingCleanupCallbacks.current.push(maybeCleanupCallback);
        }
      });
    }
  });

  return proxyRef.current;
}
