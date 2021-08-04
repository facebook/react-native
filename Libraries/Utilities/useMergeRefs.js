/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {useCallback} from 'react';

type CallbackRef<T> = T => mixed;
type ObjectRef<T> = {current: T, ...};

type Ref<T> = CallbackRef<T> | ObjectRef<T>;

/**
 * Constructs a new ref that forwards new values to each of the given refs. The
 * given refs will always be invoked in the order that they are supplied.
 *
 * WARNING: A known problem of merging refs using this approach is that if any
 * of the given refs change, the returned callback ref will also be changed. If
 * the returned callback ref is supplied as a `ref` to a React element, this may
 * lead to problems with the given refs being invoked more times than desired.
 */
export default function useMergeRefs<T>(
  ...refs: $ReadOnlyArray<?Ref<T>>
): CallbackRef<T> {
  return useCallback(
    (current: T) => {
      for (const ref of refs) {
        if (ref != null) {
          if (typeof ref === 'function') {
            ref(current);
          } else {
            ref.current = current;
          }
        }
      }
    },
    [...refs], // eslint-disable-line react-hooks/exhaustive-deps
  );
}
