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

import 'react-native/Libraries/Core/InitializeCore';
import * as ReactNativeTester from '..';

describe('ReactNativeTester', () => {
  describe('runTask', () => {
    it('should run a task synchronously', () => {
      const task = jest.fn();

      ReactNativeTester.runTask(task);

      expect(task).toHaveBeenCalledTimes(1);
    });

    // TODO: fix error handling and make this pass
    it.skip('should re-throw errors from the task synchronously', () => {
      expect(() => {
        ReactNativeTester.runTask(() => {
          throw new Error('test error');
        });
      }).toThrow('test error');
    });

    it('should exhaust the microtask queue synchronously', () => {
      const lastMicrotask = jest.fn();

      ReactNativeTester.runTask(() => {
        queueMicrotask(() => {
          queueMicrotask(() => {
            queueMicrotask(() => {
              queueMicrotask(lastMicrotask);
            });
          });
        });
      });

      expect(lastMicrotask).toHaveBeenCalledTimes(1);
    });

    // TODO: fix error handling and make this pass
    it.skip('should re-throw errors from microtasks synchronously', () => {
      expect(() => {
        ReactNativeTester.runTask(() => {
          queueMicrotask(() => {
            throw new Error('test error');
          });
        });
      }).toThrow('test error');
    });

    it('should run async tasks synchronously', () => {
      let completed = false;

      ReactNativeTester.runTask(async () => {
        await Promise.resolve(6);
        completed = true;
      });

      expect(completed).toBe(true);
    });
  });
});
