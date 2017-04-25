/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FillRateHelper
 * @flow
 */

'use strict';

const performanceNow = require('fbjs/lib/performanceNow');
const warning = require('fbjs/lib/warning');

export type FillRateExceededInfo = {
  event: {
    sample_type: string,
    blankness: number,
    blank_pixels_top: number,
    blank_pixels_bottom: number,
    scroll_offset: number,
    visible_length: number,
    scroll_speed: number,
    first_frame: Object,
    last_frame: Object,
  },
  aggregate: {
    avg_blankness: number,
    min_speed_when_blank: number,
    avg_speed_when_blank: number,
    avg_blankness_when_any_blank: number,
    fraction_any_blank: number,
    all_samples_timespan_sec: number,
    fill_rate_sample_counts: {[key: string]: number},
  },
};

type FrameMetrics = {inLayout?: boolean, length: number, offset: number};

let _listeners: Array<(FillRateExceededInfo) => void> = [];
let _sampleRate = null;

/**
 * A helper class for detecting when the maximem fill rate of `VirtualizedList` is exceeded.
 * By default the sampling rate is set to zero and this will do nothing. If you want to collect
 * samples (e.g. to log them), make sure to call `FillRateHelper.setSampleRate(0.0-1.0)`.
 *
 * Listeners and sample rate are global for all `VirtualizedList`s - typical usage will combine with
 * `SceneTracker.getActiveScene` to determine the context of the events.
 */
class FillRateHelper {
  _getFrameMetrics: (index: number) => ?FrameMetrics;
  _anyBlankCount = 0;
  _anyBlankMinSpeed = Number.MAX_SAFE_INTEGER;
  _anyBlankSpeedSum = 0;
  _sampleCounts = {};
  _fractionBlankSum = 0;
  _samplesStartTime = 0;

  static addFillRateExceededListener(
    callback: (FillRateExceededInfo) => void
  ): {remove: () => void} {
    warning(
      _sampleRate !== null,
      'Call `FillRateHelper.setSampleRate` before `addFillRateExceededListener`.'
    );
    _listeners.push(callback);
    return {
      remove: () => {
        _listeners = _listeners.filter((listener) => callback !== listener);
      },
    };
  }

  static setSampleRate(sampleRate: number) {
    _sampleRate = sampleRate;
  }

  static enabled(): boolean {
    return (_sampleRate || 0) > 0.0;
  }

  constructor(getFrameMetrics: (index: number) => ?FrameMetrics) {
    this._getFrameMetrics = getFrameMetrics;
  }

  computeInfoSampled(
    sampleType: string,
    props: {
      data: Array<any>,
      getItemCount: (data: Array<any>) => number,
      initialNumToRender: number,
    },
    state: {
      first: number,
      last: number,
    },
    scrollMetrics: {
      offset: number,
      velocity: number,
      visibleLength: number,
    },
  ): ?FillRateExceededInfo {
    if (!FillRateHelper.enabled() || (_sampleRate || 0) <= Math.random()) {
      return null;
    }
    const start = performanceNow();
    if (props.getItemCount(props.data) === 0) {
      return null;
    }
    if (!this._samplesStartTime) {
      this._samplesStartTime = start;
    }
    const {offset, velocity, visibleLength} = scrollMetrics;
    let blankTop = 0;
    let first = state.first;
    let firstFrame = this._getFrameMetrics(first);
    while (first <= state.last && (!firstFrame || !firstFrame.inLayout)) {
      firstFrame = this._getFrameMetrics(first);
      first++;
    }
    if (firstFrame) {
      blankTop = Math.min(visibleLength, Math.max(0, firstFrame.offset - offset));
    }
    let blankBottom = 0;
    let last = state.last;
    let lastFrame = this._getFrameMetrics(last);
    while (last >= state.first && (!lastFrame || !lastFrame.inLayout)) {
      lastFrame = this._getFrameMetrics(last);
      last--;
    }
    if (lastFrame) {
      const bottomEdge = lastFrame.offset + lastFrame.length;
      blankBottom = Math.min(visibleLength, Math.max(0, offset + visibleLength - bottomEdge));
    }
    this._sampleCounts.all = (this._sampleCounts.all || 0) + 1;
    this._sampleCounts[sampleType] = (this._sampleCounts[sampleType] || 0) + 1;
    const blankness = (blankTop + blankBottom) / visibleLength;
    if (blankness > 0) {
      const scrollSpeed = Math.abs(velocity);
      if (scrollSpeed && sampleType === 'onScroll') {
        this._anyBlankMinSpeed = Math.min(this._anyBlankMinSpeed, scrollSpeed);
      }
      this._anyBlankSpeedSum += scrollSpeed;
      this._anyBlankCount++;
      this._fractionBlankSum += blankness;
      const event = {
        sample_type: sampleType,
        blankness: blankness,
        blank_pixels_top: blankTop,
        blank_pixels_bottom: blankBottom,
        scroll_offset: offset,
        visible_length: visibleLength,
        scroll_speed: scrollSpeed,
        first_frame: {...firstFrame},
        last_frame: {...lastFrame},
      };
      const aggregate = {
        avg_blankness: this._fractionBlankSum / this._sampleCounts.all,
        min_speed_when_blank: this._anyBlankMinSpeed,
        avg_speed_when_blank: this._anyBlankSpeedSum / this._anyBlankCount,
        avg_blankness_when_any_blank: this._fractionBlankSum / this._anyBlankCount,
        fraction_any_blank: this._anyBlankCount / this._sampleCounts.all,
        all_samples_timespan_sec: (performanceNow() - this._samplesStartTime) / 1000.0,
        fill_rate_sample_counts: {...this._sampleCounts},
        compute_time: performanceNow() - start,
      };
      const info = {event, aggregate};
      _listeners.forEach((listener) => listener(info));
      return info;
    }
    return null;
  }
}

module.exports = FillRateHelper;
