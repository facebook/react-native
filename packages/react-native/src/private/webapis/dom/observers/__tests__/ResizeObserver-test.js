/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import ResizeObserver, {ResizeObserverEntry} from '../ResizeObserver';
import {
  roundToDevicePixel,
  computeContentBoxSize,
  computeBorderBoxSize,
  computeDevicePixelContentBoxSize,
} from '../ResizeObserverUtils';

describe('ResizeObserver', () => {
  describe('constructor(callback)', () => {
    it('should throw if callback is not provided', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        return new ResizeObserver();
      }).toThrow(
        "Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.",
      );
    });

    it('should throw if callback is not a function', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        return new ResizeObserver('not a function');
      }).toThrow(
        "Failed to construct 'ResizeObserver': parameter 1 is not of type 'Function'.",
      );
    });

    it('should throw if callback is null', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        return new ResizeObserver(null);
      }).toThrow(
        "Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.",
      );
    });

    it('should create an observer with a valid callback', () => {
      const observer = new ResizeObserver(() => {});
      expect(observer).toBeInstanceOf(ResizeObserver);
    });
  });

  describe('observe(target, options)', () => {
    it('should throw if target is null', () => {
      const observer = new ResizeObserver(() => {});
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        observer.observe(null);
      }).toThrow(
        "Failed to execute 'observe' on 'ResizeObserver': parameter 1 is null or undefined.",
      );
    });

    it('should throw if target is undefined', () => {
      const observer = new ResizeObserver(() => {});
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        observer.observe(undefined);
      }).toThrow(
        "Failed to execute 'observe' on 'ResizeObserver': parameter 1 is null or undefined.",
      );
    });

    it('should throw for invalid box option', () => {
      const observer = new ResizeObserver(() => {});
      const mockTarget = createMockTarget(100, 50);
      expect(() => {
        // $FlowExpectedError[incompatible-call]
        observer.observe(mockTarget, {box: 'invalid-box'});
      }).toThrow("is not a valid enum value of type ResizeObserverBoxOptions");
    });

    it('should accept valid box options', () => {
      const observer = new ResizeObserver(() => {});
      const target1 = createMockTarget(100, 50);
      const target2 = createMockTarget(200, 100);
      const target3 = createMockTarget(300, 150);

      expect(() => {
        observer.observe(target1, {box: 'content-box'});
        observer.observe(target2, {box: 'border-box'});
        observer.observe(target3, {box: 'device-pixel-content-box'});
      }).not.toThrow();
    });

    it('should default to content-box when no options provided', () => {
      const observer = new ResizeObserver(() => {});
      const target = createMockTarget(100, 50);

      expect(() => {
        observer.observe(target);
      }).not.toThrow();
    });
  });

  describe('unobserve(target)', () => {
    it('should throw if target is null', () => {
      const observer = new ResizeObserver(() => {});
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        observer.unobserve(null);
      }).toThrow(
        "Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is null or undefined.",
      );
    });

    it('should not throw when unobserving a target that was never observed', () => {
      const observer = new ResizeObserver(() => {});
      const target = createMockTarget(100, 50);

      expect(() => {
        observer.unobserve(target);
      }).not.toThrow();
    });

    it('should remove the target from observations', () => {
      const observer = new ResizeObserver(() => {});
      const target = createMockTarget(100, 50);

      observer.observe(target);
      expect(observer._observations.length).toBe(1);

      observer.unobserve(target);
      expect(observer._observations.length).toBe(0);
    });
  });

  describe('disconnect()', () => {
    it('should clear all observations', () => {
      const observer = new ResizeObserver(() => {});
      const target1 = createMockTarget(100, 50);
      const target2 = createMockTarget(200, 100);

      observer.observe(target1);
      observer.observe(target2);
      expect(observer._observations.length).toBe(2);

      observer.disconnect();
      expect(observer._observations.length).toBe(0);
    });

    it('should allow re-observation after disconnect', () => {
      const observer = new ResizeObserver(() => {});
      const target = createMockTarget(100, 50);

      observer.observe(target);
      observer.disconnect();
      expect(observer._observations.length).toBe(0);

      observer.observe(target);
      expect(observer._observations.length).toBe(1);
    });
  });

  describe('multiple element observation', () => {
    it('should track multiple targets independently', () => {
      const observer = new ResizeObserver(() => {});
      const target1 = createMockTarget(100, 50);
      const target2 = createMockTarget(200, 100);
      const target3 = createMockTarget(300, 150);

      observer.observe(target1);
      observer.observe(target2);
      observer.observe(target3);
      expect(observer._observations.length).toBe(3);

      observer.unobserve(target2);
      expect(observer._observations.length).toBe(2);
      expect(observer._observations[0].target).toBe(target1);
      expect(observer._observations[1].target).toBe(target3);
    });

    it('should update box option when observing an already-observed target', () => {
      const observer = new ResizeObserver(() => {});
      const target = createMockTarget(100, 50);

      observer.observe(target, {box: 'content-box'});
      expect(observer._observations[0].box).toBe('content-box');

      observer.observe(target, {box: 'border-box'});
      expect(observer._observations.length).toBe(1);
      expect(observer._observations[0].box).toBe('border-box');
    });
  });

  describe('error handling in callbacks', () => {
    it('should not throw when callback is valid', () => {
      const callback = jest.fn();
      const observer = new ResizeObserver(callback);
      expect(observer).toBeInstanceOf(ResizeObserver);
    });
  });
});

describe('ResizeObserverEntry', () => {
  it('should expose target', () => {
    const target = createMockTarget(100, 50);
    const entry = new ResizeObserverEntry(target);
    expect(entry.target).toBe(target);
  });

  it('should expose contentRect dimensions', () => {
    const target = createMockTarget(100, 50);
    const entry = new ResizeObserverEntry(target);
    expect(entry.contentRect.width).toBe(100);
    expect(entry.contentRect.height).toBe(50);
    expect(entry.contentRect.x).toBe(0);
    expect(entry.contentRect.y).toBe(0);
  });

  it('should expose contentBoxSize', () => {
    const target = createMockTarget(100, 50);
    const entry = new ResizeObserverEntry(target);
    expect(entry.contentBoxSize).toHaveLength(1);
    expect(entry.contentBoxSize[0].inlineSize).toBe(100);
    expect(entry.contentBoxSize[0].blockSize).toBe(50);
  });

  it('should expose borderBoxSize', () => {
    const target = createMockTarget(100, 50);
    const entry = new ResizeObserverEntry(target);
    expect(entry.borderBoxSize).toHaveLength(1);
    expect(entry.borderBoxSize[0].inlineSize).toBe(100);
    expect(entry.borderBoxSize[0].blockSize).toBe(50);
  });

  it('should handle zero dimensions', () => {
    const target = createMockTarget(0, 0);
    const entry = new ResizeObserverEntry(target);
    expect(entry.contentRect.width).toBe(0);
    expect(entry.contentRect.height).toBe(0);
  });

  it('should handle null layout gracefully', () => {
    const target = createMockTarget(null, null);
    const entry = new ResizeObserverEntry(target);
    expect(entry.contentRect.width).toBe(0);
    expect(entry.contentRect.height).toBe(0);
  });
});

describe('ResizeObserverUtils', () => {
  describe('roundToDevicePixel', () => {
    it('should return 0 for null or undefined', () => {
      // $FlowExpectedError[incompatible-call]
      expect(roundToDevicePixel(null)).toBe(0);
      // $FlowExpectedError[incompatible-call]
      expect(roundToDevicePixel(undefined)).toBe(0);
    });

    it('should return 0 for non-finite values', () => {
      expect(roundToDevicePixel(Infinity)).toBe(0);
      expect(roundToDevicePixel(-Infinity)).toBe(0);
      expect(roundToDevicePixel(NaN)).toBe(0);
    });

    it('should round to device pixel', () => {
      const result = roundToDevicePixel(100);
      expect(typeof result).toBe('number');
      expect(result).toBe(100);
    });
  });

  describe('computeContentBoxSize', () => {
    it('should return correct dimensions', () => {
      const size = computeContentBoxSize(200, 100);
      expect(size.inlineSize).toBe(200);
      expect(size.blockSize).toBe(100);
    });
  });

  describe('computeBorderBoxSize', () => {
    it('should return correct dimensions', () => {
      const size = computeBorderBoxSize(200, 100);
      expect(size.inlineSize).toBe(200);
      expect(size.blockSize).toBe(100);
    });
  });

  describe('computeDevicePixelContentBoxSize', () => {
    it('should return zero for null values', () => {
      // $FlowExpectedError[incompatible-call]
      const size = computeDevicePixelContentBoxSize(null, null);
      expect(size.inlineSize).toBe(0);
      expect(size.blockSize).toBe(0);
    });

    it('should return device pixel values', () => {
      const size = computeDevicePixelContentBoxSize(100, 50);
      expect(typeof size.inlineSize).toBe('number');
      expect(typeof size.blockSize).toBe('number');
    });
  });
});

// Helper to create a mock target that mimics ReactNativeElement with _layout
function createMockTarget(
  width: ?number,
  height: ?number,
): ReactNativeElement {
  // $FlowExpectedError[incompatible-return] - mock for testing
  return {
    _layout:
      width != null && height != null ? {width, height} : null,
  };
}
