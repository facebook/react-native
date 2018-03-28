/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
  // Collect sensor data in this interval (nanoseconds)
  private static final long MIN_TIME_BETWEEN_SAMPLES_NS =
    TimeUnit.NANOSECONDS.convert(20, TimeUnit.MILLISECONDS);
  // Number of nanoseconds to listen for and count shakes (nanoseconds)
  private static final float SHAKING_WINDOW_NS =
    TimeUnit.NANOSECONDS.convert(3, TimeUnit.SECONDS);
  // Required force to constitute a rage shake. Need to multiply gravity by 1.33 because a rage
  // shake in one direction should have more force than just the magnitude of free fall.
  private static final float REQUIRED_FORCE = SensorManager.GRAVITY_EARTH * 1.33f;

  private float mAccelerationX, mAccelerationY, mAccelerationZ;

  public static interface ShakeListener {
    void onShake();
  }

  private final ShakeListener mShakeListener;

  @Nullable private SensorManager mSensorManager;
  private long mLastTimestamp;
  private int mNumShakes;
  private long mLastShakeTimestamp;
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
      mSensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_UI);
      mLastShakeTimestamp = 0;
      reset();
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

  /**
   * Reset all variables used to keep track of number of shakes recorded.
   */
  private void reset() {
    mNumShakes = 0;
    mAccelerationX = 0;
    mAccelerationY = 0;
    mAccelerationZ = 0;
  }

  /**
   * Determine if acceleration applied to sensor is large enough to count as a rage shake.
   *
   * @param a acceleration in x, y, or z applied to the sensor
   * @return true if the magnitude of the force exceeds the minimum required amount of force.
   * false otherwise.
   */
  private boolean atLeastRequiredForce(float a) {
    return Math.abs(a) > REQUIRED_FORCE;
  }

  /**
   * Save data about last shake
   * @param timestamp (ns) of last sensor event
   */
  private void recordShake(long timestamp) {
    mLastShakeTimestamp = timestamp;
    mNumShakes++;
  }

  @Override
  public void onSensorChanged(SensorEvent sensorEvent) {
    if (sensorEvent.timestamp - mLastTimestamp < MIN_TIME_BETWEEN_SAMPLES_NS) {
      return;
    }

    float ax = sensorEvent.values[0];
    float ay = sensorEvent.values[1];
    float az = sensorEvent.values[2] - SensorManager.GRAVITY_EARTH;

    mLastTimestamp = sensorEvent.timestamp;

    if (atLeastRequiredForce(ax) && ax * mAccelerationX <= 0) {
      recordShake(sensorEvent.timestamp);
      mAccelerationX = ax;
    } else if (atLeastRequiredForce(ay) && ay * mAccelerationY <= 0) {
      recordShake(sensorEvent.timestamp);
      mAccelerationY = ay;
    } else if (atLeastRequiredForce(az) && az * mAccelerationZ <= 0) {
      recordShake(sensorEvent.timestamp);
      mAccelerationZ = az;
    }

    maybeDispatchShake(sensorEvent.timestamp);
  }

  @Override
  public void onAccuracyChanged(Sensor sensor, int i) {
  }

  private void maybeDispatchShake(long currentTimestamp) {
    if (mNumShakes >= 8 * mMinNumShakes) {
      reset();
      mShakeListener.onShake();
    }

    if (currentTimestamp - mLastShakeTimestamp > SHAKING_WINDOW_NS) {
      reset();
    }
  }
}
