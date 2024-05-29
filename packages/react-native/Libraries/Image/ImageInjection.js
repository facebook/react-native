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

import useMergeRefs from '../Utilities/useMergeRefs';
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

export function useWrapRefWithImageAttachedCallbacks(
  forwardedRef: React.RefSetter<ImageInstance>,
): React.RefSetter<ImageInstance> {
  const pendingCleanupCallbacks = useRef<Array<() => void>>([]);

  const imageAttachedCallbacksRef =
    useRef<?(node: ImageInstance | null) => void>(null);

  if (imageAttachedCallbacksRef.current == null) {
    imageAttachedCallbacksRef.current = (node: ImageInstance | null): void => {
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
    };
  }

  // `useMergeRefs` returns a stable ref if its arguments don't change.
  return useMergeRefs<ImageInstance>(
    forwardedRef,
    imageAttachedCallbacksRef.current,
  );
}
