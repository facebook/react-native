/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use strict';

// $FlowFixMe[untyped-type-import] used as an opaque type
import type {Task} from 'scheduler';
// $FlowFixMe[untyped-type-import] used as an opaque type
import typeof Scheduler from 'scheduler';

import {useCallback, useEffect, useRef} from 'react';

type EffectStatus =
  // The effect is scheduled but has not yet run. The cleanup function is from
  // the last execution, if there was one. If the effect gets rescheduled, the
  // cleanup function must be propagated so that it can run before the updated
  // effect
  | {
      kind: 'scheduled',
      // $FlowFixMe[value-as-type] Task is opaque
      task: Task,
      previousCleanup: null | (() => void),
    }
  // The effect has been executed and returned a cleanup function. If it ran
  // but didn't return a cleanup function, the effect status is set to null.
  | {
      cleanup: () => void,
      kind: 'executed',
    };

/**
 * Similar to `useEffect`, this hook schedules a passive effect (@param fn) to
 * run on mount and whenever the dependency array (@param deps) changes.
 * However, unlike `useEffect` the effect is debounced so that it runs after
 * a delay (idle priority callback), reseting if another render occurs. Another
 * render can occur for example when a layout effect runs and sets state.
 * Updates triggered in layout effects cause the next render to flush
 * synchronously and will by default run passive effects first before the
 * re-render (to flush effects with the original state), and then again after
 * the re-render (to flush effects with the updated state).
 *
 * Instead, this hook will run the effect once per batched render, after it has
 * committed/painted. The effect is scheduled at idle priority, and if another
 * render occurs in the meantime it reschedules the effect. Thus the effect
 * will only run when the component stops re-rendering. When the effect does
 * run, it is guaranteed to be the latest version of the effect.
 *
 * @see https://react.dev/reference/react/useEffect for more on normal passive
 * effect behavior.
 */
export default function useDebouncedEffectImplementation(
  fn: () => void | (() => void),
  deps?: ?$ReadOnlyArray<mixed>,
  // $FlowFixMe[value-as-type] used as an opaque type
  scheduler: Scheduler,
): void {
  const statusRef = useRef<null | EffectStatus>(null);

  const scheduleTask = useCallback(
    (
      effectFn: null | (() => void | (() => void)),
      previousCleanup: null | (() => void),
    ): void => {
      const status = statusRef.current;
      if (status != null && status.kind === 'scheduled') {
        scheduler.unstable_cancelCallback(status.task);
      }
      if (effectFn == null && previousCleanup == null) {
        statusRef.current = null;
        return;
      }
      const task = scheduler.unstable_scheduleCallback(
        scheduler.unstable_IdlePriority,
        () => {
          if (previousCleanup != null) {
            previousCleanup();
          }
          let cleanup = null;
          if (effectFn != null) {
            cleanup = effectFn() ?? null;
          }
          if (cleanup == null) {
            statusRef.current = null;
          } else {
            statusRef.current = {
              kind: 'executed',
              cleanup,
            };
          }
        },
      );
      statusRef.current = {
        kind: 'scheduled',
        task,
        previousCleanup,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const statusInEffect = statusRef.current;
    if (statusInEffect == null) {
      scheduleTask(fn, null);
    } else if (statusInEffect.kind === 'scheduled') {
      // Need to cancel & reschedule, maintaining the same cleanup function.
      scheduleTask(fn, statusInEffect.previousCleanup);
    } else {
      // Already executed, we need to schedule a new task and call the cleanup
      // function from the last execution
      scheduleTask(fn, statusInEffect.cleanup);
    }

    return () => {
      // Rather than immediately run cleanup, we schedule the cleanup task.
      // If the effect is about to update, then we'll cancel this task and
      // reschedule with both the cleanup and the new effect function (see above)
      const statusAtCleanup = statusRef.current;
      if (statusAtCleanup == null) {
        // nothing to do, nothing is scheduled and if the task ran already, it
        // didn't have a cleanup function
        return;
      } else if (statusAtCleanup.kind === 'scheduled') {
        // The task is scheduled but has not yet run. Reschedule just the
        // cleanup function (the effect function portion may be
        // overridden momentarily if the effect is about to update, but that's
        // okay).
        // Note that if cleanup is null, this will just clear the pending task
        // and not schedule a new one
        scheduleTask(null, statusAtCleanup.previousCleanup);
      } else {
        // If kind === executed, then we know there is a cleanup function that
        // still needs to run so schedule it
        scheduleTask(null, statusAtCleanup.cleanup);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
