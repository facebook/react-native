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

import java.util.concurrent.TimeUnit;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import com.facebook.infer.annotation.Assertions;

/**
 * Listens for the user shaking their phone. Allocation-less once it starts listening.
 */
public class ShakeDetector implements SensorEventListener {

  //only record and consider the last MAX_SAMPLES number of data points
  private static final int MAX_SAMPLES = 40;
  //collect sensor data in this interval (nanoseconds)
  private static final long MIN_TIME_BETWEEN_SAMPLES_NS =
    TimeUnit.NANOSECONDS.convert(20, TimeUnit.MILLISECONDS);
  //expected duration of one shake in nanoseconds
  private static final long VISIBLE_TIME_RANGE_NS =
    TimeUnit.NANOSECONDS.convert(250, TimeUnit.MILLISECONDS);
  //minimum amount of force on accelerometer sensor to constitute a shake
  private static final int MAGNITUDE_THRESHOLD = 25;
  //this percentage of data points must have at least the force of MAGNITUDE_THRESHOLD
  private static final int PERCENT_OVER_THRESHOLD_FOR_SHAKE = 60;
  //number of nanoseconds to listen for and count shakes
  private static final float SHAKING_WINDOW_NS =
    TimeUnit.NANOSECONDS.convert(3, TimeUnit.SECONDS);

  public static interface ShakeListener {
    void onShake();
  }

  private final ShakeListener mShakeListener;

  @Nullable private SensorManager mSensorManager;
  private long mLastTimestamp;
  private int mCurrentIndex;
  private int mNumShakes;
  private long mLastShakeTimestamp;
  @Nullable private double[] mMagnitudes;
  @Nullable private long[] mTimestamps;
  //number of shakes required to trigger onShake()
  private int mMinNumShakes;

  public ShakeDetector(ShakeListener listener) {
    this(listener, 1);
  }

  public ShakeDetector(ShakeListener listener, int minNumShakes) {
    mShakeListener = listener;
    mMinNumShakes = minNumShakes;
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
      mNumShakes = 0;
      mLastShakeTimestamp = 0;
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
    if (sensorEvent.timestamp - mLastTimestamp < MIN_TIME_BETWEEN_SAMPLES_NS) {
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
      if (currentTimestamp - mTimestamps[index] < VISIBLE_TIME_RANGE_NS) {
        total++;
        if (mMagnitudes[index] >= MAGNITUDE_THRESHOLD) {
          numOverThreshold++;
        }
      }
    }
    if (((double) numOverThreshold) / total > PERCENT_OVER_THRESHOLD_FOR_SHAKE / 100.0) {
      if (currentTimestamp - mLastShakeTimestamp >= VISIBLE_TIME_RANGE_NS) {
        mNumShakes++;
      }
      mLastShakeTimestamp = currentTimestamp;
      if (mNumShakes >= mMinNumShakes) {
        mNumShakes = 0;
        mLastShakeTimestamp = 0;
        mShakeListener.onShake();
      }
    }
    if (currentTimestamp - mLastShakeTimestamp > SHAKING_WINDOW_NS) {
      mNumShakes = 0;
      mLastShakeTimestamp = 0;
    }
  }
}
