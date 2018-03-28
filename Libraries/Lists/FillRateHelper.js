/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule FillRateHelper
 * @flow
 * @format
 */

'use strict';

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const performanceNow = require('fbjs/lib/performanceNow');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const warning = require('fbjs/lib/warning');

export type FillRateInfo = Info;

class Info {
  any_blank_count = 0;
  any_blank_ms = 0;
  any_blank_speed_sum = 0;
  mostly_blank_count = 0;
  mostly_blank_ms = 0;
  pixels_blank = 0;
  pixels_sampled = 0;
  pixels_scrolled = 0;
  total_time_spent = 0;
  sample_count = 0;
}

type FrameMetrics = {inLayout?: boolean, length: number, offset: number};

const DEBUG = false;

let _listeners: Array<(Info) => void> = [];
let _minSampleCount = 10;
let _sampleRate = DEBUG ? 1 : null;

/**
 * A helper class for detecting when the maximem fill rate of `VirtualizedList` is exceeded.
 * By default the sampling rate is set to zero and this will do nothing. If you want to collect
 * samples (e.g. to log them), make sure to call `FillRateHelper.setSampleRate(0.0-1.0)`.
 *
 * Listeners and sample rate are global for all `VirtualizedList`s - typical usage will combine with
 * `SceneTracker.getActiveScene` to determine the context of the events.
 */
class FillRateHelper {
  _anyBlankStartTime = (null: ?number);
  _enabled = false;
  _getFrameMetrics: (index: number) => ?FrameMetrics;
  _info = new Info();
  _mostlyBlankStartTime = (null: ?number);
  _samplesStartTime = (null: ?number);

  static addListener(callback: FillRateInfo => void): {remove: () => void} {
    warning(
      _sampleRate !== null,
      'Call `FillRateHelper.setSampleRate` before `addListener`.',
    );
    _listeners.push(callback);
    return {
      remove: () => {
        _listeners = _listeners.filter(listener => callback !== listener);
      },
    };
  }

  static setSampleRate(sampleRate: number) {
    _sampleRate = sampleRate;
  }

  static setMinSampleCount(minSampleCount: number) {
    _minSampleCount = minSampleCount;
  }

  constructor(getFrameMetrics: (index: number) => ?FrameMetrics) {
    this._getFrameMetrics = getFrameMetrics;
    this._enabled = (_sampleRate || 0) > Math.random();
    this._resetData();
  }

  activate() {
    if (this._enabled && this._samplesStartTime == null) {
      DEBUG && console.debug('FillRateHelper: activate');
      this._samplesStartTime = performanceNow();
    }
  }

  deactivateAndFlush() {
    if (!this._enabled) {
      return;
    }
    const start = this._samplesStartTime; // const for flow
    if (start == null) {
      DEBUG &&
        console.debug('FillRateHelper: bail on deactivate with no start time');
      return;
    }
    if (this._info.sample_count < _minSampleCount) {
      // Don't bother with under-sampled events.
      this._resetData();
      return;
    }
    const total_time_spent = performanceNow() - start;
    const info: any = {
      ...this._info,
      total_time_spent,
    };
    if (DEBUG) {
      const derived = {
        avg_blankness: this._info.pixels_blank / this._info.pixels_sampled,
        avg_speed: this._info.pixels_scrolled / (total_time_spent / 1000),
        avg_speed_when_any_blank:
          this._info.any_blank_speed_sum / this._info.any_blank_count,
        any_blank_per_min:
          this._info.any_blank_count / (total_time_spent / 1000 / 60),
        any_blank_time_frac: this._info.any_blank_ms / total_time_spent,
        mostly_blank_per_min:
          this._info.mostly_blank_count / (total_time_spent / 1000 / 60),
        mostly_blank_time_frac: this._info.mostly_blank_ms / total_time_spent,
      };
      for (const key in derived) {
        derived[key] = Math.round(1000 * derived[key]) / 1000;
      }
      console.debug('FillRateHelper deactivateAndFlush: ', {derived, info});
    }
    _listeners.forEach(listener => listener(info));
    this._resetData();
  }

  computeBlankness(
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
      dOffset: number,
      offset: number,
      velocity: number,
      visibleLength: number,
    },
  ): number {
    if (
      !this._enabled ||
      props.getItemCount(props.data) === 0 ||
      this._samplesStartTime == null
    ) {
      return 0;
    }
    const {dOffset, offset, velocity, visibleLength} = scrollMetrics;

    // Denominator metrics that we track for all events - most of the time there is no blankness and
    // we want to capture that.
    this._info.sample_count++;
    this._info.pixels_sampled += Math.round(visibleLength);
    this._info.pixels_scrolled += Math.round(Math.abs(dOffset));
    const scrollSpeed = Math.round(Math.abs(velocity) * 1000); // px / sec

    // Whether blank now or not, record the elapsed time blank if we were blank last time.
    const now = performanceNow();
    if (this._anyBlankStartTime != null) {
      this._info.any_blank_ms += now - this._anyBlankStartTime;
    }
    this._anyBlankStartTime = null;
    if (this._mostlyBlankStartTime != null) {
      this._info.mostly_blank_ms += now - this._mostlyBlankStartTime;
    }
    this._mostlyBlankStartTime = null;

    let blankTop = 0;
    let first = state.first;
    let firstFrame = this._getFrameMetrics(first);
    while (first <= state.last && (!firstFrame || !firstFrame.inLayout)) {
      firstFrame = this._getFrameMetrics(first);
      first++;
    }
    // Only count blankTop if we aren't rendering the first item, otherwise we will count the header
    // as blank.
    if (firstFrame && first > 0) {
      blankTop = Math.min(
        visibleLength,
        Math.max(0, firstFrame.offset - offset),
      );
    }
    let blankBottom = 0;
    let last = state.last;
    let lastFrame = this._getFrameMetrics(last);
    while (last >= state.first && (!lastFrame || !lastFrame.inLayout)) {
      lastFrame = this._getFrameMetrics(last);
      last--;
    }
    // Only count blankBottom if we aren't rendering the last item, otherwise we will count the
    // footer as blank.
    if (lastFrame && last < props.getItemCount(props.data) - 1) {
      const bottomEdge = lastFrame.offset + lastFrame.length;
      blankBottom = Math.min(
        visibleLength,
        Math.max(0, offset + visibleLength - bottomEdge),
      );
    }
    const pixels_blank = Math.round(blankTop + blankBottom);
    const blankness = pixels_blank / visibleLength;
    if (blankness > 0) {
      this._anyBlankStartTime = now;
      this._info.any_blank_speed_sum += scrollSpeed;
      this._info.any_blank_count++;
      this._info.pixels_blank += pixels_blank;
      if (blankness > 0.5) {
        this._mostlyBlankStartTime = now;
        this._info.mostly_blank_count++;
      }
    } else if (scrollSpeed < 0.01 || Math.abs(dOffset) < 1) {
      this.deactivateAndFlush();
    }
    return blankness;
  }

  enabled(): boolean {
    return this._enabled;
  }

  _resetData() {
    this._anyBlankStartTime = null;
    this._info = new Info();
    this._mostlyBlankStartTime = null;
    this._samplesStartTime = null;
  }
}

module.exports = FillRateHelper;
