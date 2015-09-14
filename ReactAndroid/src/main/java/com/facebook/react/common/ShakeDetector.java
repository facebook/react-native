/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.common;

import javax.annotation.Nullable;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import com.facebook.infer.annotation.Assertions;

/**
 * Listens for the user shaking their phone. Allocation-less once it starts listening.
 */
public class ShakeDetector implements SensorEventListener {

  private static final int MAX_SAMPLES = 25;
  private static final int MIN_TIME_BETWEEN_SAMPLES_MS = 20;
  private static final int VISIBLE_TIME_RANGE_MS = 500;
  private static final int MAGNITUDE_THRESHOLD = 25;
  private static final int PERCENT_OVER_THRESHOLD_FOR_SHAKE = 66;

  public static interface ShakeListener {
    void onShake();
  }

  private final ShakeListener mShakeListener;

  @Nullable private SensorManager mSensorManager;
  private long mLastTimestamp;
  private int mCurrentIndex;
  @Nullable private double[] mMagnitudes;
  @Nullable private long[] mTimestamps;

  public ShakeDetector(ShakeListener listener) {
    mShakeListener = listener;
  }

  /**
   * Start listening for shakes.
   */
  public void start(SensorManager manager) {
    Assertions.assertNotNull(manager);
    Sensor accelerometer = manager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
    if (accelerometer != null) {
      mSensorManager = manager;
      mLastTimestamp = -1;
      mCurrentIndex = 0;
      mMagnitudes = new double[MAX_SAMPLES];
      mTimestamps = new long[MAX_SAMPLES];

      mSensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_UI);
    }
  }

  /**
   * Stop listening for shakes.
   */
  public void stop() {
    if (mSensorManager != null) {
      mSensorManager.unregisterListener(this);
      mSensorManager = null;
    }
  }

  @Override
  public void onSensorChanged(SensorEvent sensorEvent) {
    if (sensorEvent.timestamp - mLastTimestamp < MIN_TIME_BETWEEN_SAMPLES_MS) {
      return;
    }

    Assertions.assertNotNull(mTimestamps);
    Assertions.assertNotNull(mMagnitudes);

    float ax = sensorEvent.values[0];
    float ay = sensorEvent.values[1];
    float az = sensorEvent.values[2];

    mLastTimestamp = sensorEvent.timestamp;
    mTimestamps[mCurrentIndex] = sensorEvent.timestamp;
    mMagnitudes[mCurrentIndex] = Math.sqrt(ax * ax + ay * ay + az * az);

    maybeDispatchShake(sensorEvent.timestamp);

    mCurrentIndex = (mCurrentIndex + 1) % MAX_SAMPLES;
  }

  @Override
  public void onAccuracyChanged(Sensor sensor, int i) {
  }

  private void maybeDispatchShake(long currentTimestamp) {
    Assertions.assertNotNull(mTimestamps);
    Assertions.assertNotNull(mMagnitudes);

    int numOverThreshold = 0;
    int total = 0;
    for (int i = 0; i < MAX_SAMPLES; i++) {
      int index = (mCurrentIndex - i + MAX_SAMPLES) % MAX_SAMPLES;
      if (currentTimestamp - mTimestamps[index] < VISIBLE_TIME_RANGE_MS) {
        total++;
        if (mMagnitudes[index] >= MAGNITUDE_THRESHOLD) {
          numOverThreshold++;
        }
      }
    }

    if (((double) numOverThreshold) / total > PERCENT_OVER_THRESHOLD_FOR_SHAKE / 100.0) {
      mShakeListener.onShake();
    }
  }
}
