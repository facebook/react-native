/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.ReadableMap;

/**
 * Implementation of {@link AnimationDriver} providing support for spring animations. The
 * implementation has been copied from android implementation of Rebound library (see
 * <a href="http://facebook.github.io/rebound/">http://facebook.github.io/rebound/</a>)
 */
/*package*/ class SpringAnimation extends AnimationDriver {

  // maximum amount of time to simulate per physics iteration in seconds (4 frames at 60 FPS)
  private static final double MAX_DELTA_TIME_SEC = 0.064;
  // fixed timestep to use in the physics solver in seconds
  private static final double SOLVER_TIMESTEP_SEC = 0.001;

  // storage for the current and prior physics state while integration is occurring
  private static class PhysicsState {
    double position;
    double velocity;
  }

  private long mLastTime;
  private boolean mSpringStarted;

  // configuration
  private double mSpringStiffness;
  private double mSpringDamping;
  private double mSpringMass;
  private double mInitialVelocity;
  private boolean mOvershootClampingEnabled;

  // all physics simulation objects are final and reused in each processing pass
  private final PhysicsState mCurrentState = new PhysicsState();
  private double mStartValue;
  private double mEndValue;
  // thresholds for determining when the spring is at rest
  private double mRestSpeedThreshold;
  private double mDisplacementFromRestThreshold;
  private double mTimeAccumulator;
  // for controlling loop
  private int mIterations;
  private int mCurrentLoop;
  private double mOriginalValue;

  SpringAnimation(ReadableMap config) {
    mCurrentState.velocity = config.getDouble("initialVelocity");
    resetConfig(config);
  }

  @Override
  public void resetConfig(ReadableMap config) {
    mSpringStiffness = config.getDouble("stiffness");
    mSpringDamping = config.getDouble("damping");
    mSpringMass = config.getDouble("mass");
    mInitialVelocity = mCurrentState.velocity;
    mEndValue = config.getDouble("toValue");
    mRestSpeedThreshold = config.getDouble("restSpeedThreshold");
    mDisplacementFromRestThreshold = config.getDouble("restDisplacementThreshold");
    mOvershootClampingEnabled = config.getBoolean("overshootClamping");
    mIterations = config.hasKey("iterations") ? config.getInt("iterations") : 1;
    mHasFinished = mIterations == 0;
    mCurrentLoop = 0;
    mTimeAccumulator = 0;
    mSpringStarted = false;
  }

  @Override
  public void runAnimationStep(long frameTimeNanos) {
    long frameTimeMillis = frameTimeNanos / 1000000;
    if (!mSpringStarted) {
      if (mCurrentLoop == 0) {
        mOriginalValue = mAnimatedValue.mValue;
        mCurrentLoop = 1;
      }
      mStartValue = mCurrentState.position = mAnimatedValue.mValue;
      mLastTime = frameTimeMillis;
      mTimeAccumulator = 0.0;
      mSpringStarted = true;
    }
    advance((frameTimeMillis - mLastTime) / 1000.0);
    mLastTime = frameTimeMillis;
    mAnimatedValue.mValue = mCurrentState.position;
    if (isAtRest()) {
      if (mIterations == -1 || mCurrentLoop < mIterations) { // looping animation, return to start
        mSpringStarted = false;
        mAnimatedValue.mValue = mOriginalValue;
        mCurrentLoop++;
      } else { // animation has completed
        mHasFinished = true;
      }
    }
  }

  /**
   * get the displacement from rest for a given physics state
   * @param state the state to measure from
   * @return the distance displaced by
   */
  private double getDisplacementDistanceForState(PhysicsState state) {
    return Math.abs(mEndValue - state.position);
  }

  /**
   * check if the current state is at rest
   * @return is the spring at rest
   */
  private boolean isAtRest() {
    return Math.abs(mCurrentState.velocity) <= mRestSpeedThreshold &&
      (getDisplacementDistanceForState(mCurrentState) <= mDisplacementFromRestThreshold ||
        mSpringStiffness == 0);
  }

  /**
   * Check if the spring is overshooting beyond its target.
   * @return true if the spring is overshooting its target
   */
  private boolean isOvershooting() {
    return mSpringStiffness > 0 &&
      ((mStartValue < mEndValue && mCurrentState.position > mEndValue) ||
        (mStartValue > mEndValue && mCurrentState.position < mEndValue));
  }

  private void advance(double realDeltaTime) {
    if (isAtRest()) {
      return;
    }

    // clamp the amount of realTime to simulate to avoid stuttering in the UI. We should be able
    // to catch up in a subsequent advance if necessary.
    double adjustedDeltaTime = realDeltaTime;
    if (realDeltaTime > MAX_DELTA_TIME_SEC) {
      adjustedDeltaTime = MAX_DELTA_TIME_SEC;
    }

    mTimeAccumulator += adjustedDeltaTime;

    double c = mSpringDamping;
    double m = mSpringMass;
    double k = mSpringStiffness;
    double v0 = -mInitialVelocity;

    double zeta = c / (2 * Math.sqrt(k * m ));
    double omega0 = Math.sqrt(k / m);
    double omega1 = omega0 * Math.sqrt(1.0 - (zeta * zeta));
    double x0 = mEndValue - mStartValue;

    double velocity;
    double position;
    double t = mTimeAccumulator;
    if (zeta < 1) {
      // Under damped
      double envelope = Math.exp(-zeta * omega0 * t);
      position =
        mEndValue -
          envelope *
            ((v0 + zeta * omega0 * x0) / omega1 * Math.sin(omega1 * t) +
              x0 * Math.cos(omega1 * t));
      // This looks crazy -- it's actually just the derivative of the
      // oscillation function
      velocity =
        zeta *
          omega0 *
          envelope *
          (Math.sin(omega1 * t) * (v0 + zeta * omega0 * x0) / omega1 +
            x0 * Math.cos(omega1 * t)) -
          envelope *
            (Math.cos(omega1 * t) * (v0 + zeta * omega0 * x0) -
              omega1 * x0 * Math.sin(omega1 * t));
    } else {
      // Critically damped spring
      double envelope = Math.exp(-omega0 * t);
      position = mEndValue - envelope * (x0 + (v0 + omega0 * x0) * t);
      velocity =
        envelope * (v0 * (t * omega0 - 1) + t * x0 * (omega0 * omega0));
    }

    mCurrentState.position = position;
    mCurrentState.velocity = velocity;

    // End the spring immediately if it is overshooting and overshoot clamping is enabled.
    // Also make sure that if the spring was considered within a resting threshold that it's now
    // snapped to its end value.
    if (isAtRest() || (mOvershootClampingEnabled && isOvershooting())) {
      // Don't call setCurrentValue because that forces a call to onSpringUpdate
      if (mSpringStiffness > 0) {
        mStartValue = mEndValue;
        mCurrentState.position = mEndValue;
      } else {
        mEndValue = mCurrentState.position;
        mStartValue = mEndValue;
      }
      mCurrentState.velocity = 0;
    }
  }
}
