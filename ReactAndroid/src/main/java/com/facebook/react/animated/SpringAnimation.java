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
  private double mSpringFriction;
  private double mSpringTension;
  private boolean mOvershootClampingEnabled;

  // all physics simulation objects are final and reused in each processing pass
  private final PhysicsState mCurrentState = new PhysicsState();
  private final PhysicsState mPreviousState = new PhysicsState();
  private final PhysicsState mTempState = new PhysicsState();
  private double mStartValue;
  private double mEndValue;
  // thresholds for determining when the spring is at rest
  private double mRestSpeedThreshold;
  private double mDisplacementFromRestThreshold;
  private double mTimeAccumulator = 0;

  SpringAnimation(ReadableMap config) {
    mSpringFriction = config.getDouble("friction");
    mSpringTension = config.getDouble("tension");
    mCurrentState.velocity = config.getDouble("initialVelocity");
    mEndValue = config.getDouble("toValue");
    mRestSpeedThreshold = config.getDouble("restSpeedThreshold");
    mDisplacementFromRestThreshold = config.getDouble("restDisplacementThreshold");
    mOvershootClampingEnabled = config.getBoolean("overshootClamping");
  }

  @Override
  public void runAnimationStep(long frameTimeNanos) {
    long frameTimeMillis = frameTimeNanos / 1000000;
    if (!mSpringStarted) {
      mStartValue = mCurrentState.position = mAnimatedValue.mValue;
      mLastTime = frameTimeMillis;
      mSpringStarted = true;
    }
    advance((frameTimeMillis - mLastTime) / 1000.0);
    mLastTime = frameTimeMillis;
    mAnimatedValue.mValue = mCurrentState.position;
    mHasFinished = isAtRest();
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
        mSpringTension == 0);
  }

  /**
   * Check if the spring is overshooting beyond its target.
   * @return true if the spring is overshooting its target
   */
  private boolean isOvershooting() {
    return mSpringTension > 0 &&
      ((mStartValue < mEndValue && mCurrentState.position > mEndValue) ||
        (mStartValue > mEndValue && mCurrentState.position < mEndValue));
  }

  /**
   * linear interpolation between the previous and current physics state based on the amount of
   * timestep remaining after processing the rendering delta time in timestep sized chunks.
   * @param alpha from 0 to 1, where 0 is the previous state, 1 is the current state
   */
  private void interpolate(double alpha) {
    mCurrentState.position = mCurrentState.position * alpha + mPreviousState.position *(1-alpha);
    mCurrentState.velocity = mCurrentState.velocity * alpha + mPreviousState.velocity *(1-alpha);
  }

  /**
   * advance the physics simulation in SOLVER_TIMESTEP_SEC sized chunks to fulfill the required
   * realTimeDelta.
   * The math is inlined inside the loop since it made a huge performance impact when there are
   * several springs being advanced.
   * @param time clock time
   * @param realDeltaTime clock drift
   */
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

    double tension = mSpringTension;
    double friction = mSpringFriction;

    double position = mCurrentState.position;
    double velocity = mCurrentState.velocity;
    double tempPosition = mTempState.position;
    double tempVelocity = mTempState.velocity;

    double aVelocity, aAcceleration;
    double bVelocity, bAcceleration;
    double cVelocity, cAcceleration;
    double dVelocity, dAcceleration;

    double dxdt, dvdt;

    // iterate over the true time
    while (mTimeAccumulator >= SOLVER_TIMESTEP_SEC) {
      /* begin debug
      iterations++;
      end debug */
      mTimeAccumulator -= SOLVER_TIMESTEP_SEC;

      if (mTimeAccumulator < SOLVER_TIMESTEP_SEC) {
        // This will be the last iteration. Remember the previous state in case we need to
        // interpolate
        mPreviousState.position = position;
        mPreviousState.velocity = velocity;
      }

      // Perform an RK4 integration to provide better detection of the acceleration curve via
      // sampling of Euler integrations at 4 intervals feeding each derivative into the calculation
      // of the next and taking a weighted sum of the 4 derivatives as the final output.

      // This math was inlined since it made for big performance improvements when advancing several
      // springs in one pass of the BaseSpringSystem.

      // The initial derivative is based on the current velocity and the calculated acceleration
      aVelocity = velocity;
      aAcceleration = (tension * (mEndValue - tempPosition)) - friction * velocity;

      // Calculate the next derivatives starting with the last derivative and integrating over the
      // timestep
      tempPosition = position + aVelocity * SOLVER_TIMESTEP_SEC * 0.5;
      tempVelocity = velocity + aAcceleration * SOLVER_TIMESTEP_SEC * 0.5;
      bVelocity = tempVelocity;
      bAcceleration = (tension * (mEndValue - tempPosition)) - friction * tempVelocity;

      tempPosition = position + bVelocity * SOLVER_TIMESTEP_SEC * 0.5;
      tempVelocity = velocity + bAcceleration * SOLVER_TIMESTEP_SEC * 0.5;
      cVelocity = tempVelocity;
      cAcceleration = (tension * (mEndValue - tempPosition)) - friction * tempVelocity;

      tempPosition = position + cVelocity * SOLVER_TIMESTEP_SEC;
      tempVelocity = velocity + cAcceleration * SOLVER_TIMESTEP_SEC;
      dVelocity = tempVelocity;
      dAcceleration = (tension * (mEndValue - tempPosition)) - friction * tempVelocity;

      // Take the weighted sum of the 4 derivatives as the final output.
      dxdt = 1.0/6.0 * (aVelocity + 2.0 * (bVelocity + cVelocity) + dVelocity);
      dvdt = 1.0/6.0 * (aAcceleration + 2.0 * (bAcceleration + cAcceleration) + dAcceleration);

      position += dxdt * SOLVER_TIMESTEP_SEC;
      velocity += dvdt * SOLVER_TIMESTEP_SEC;
    }

    mTempState.position = tempPosition;
    mTempState.velocity = tempVelocity;

    mCurrentState.position = position;
    mCurrentState.velocity = velocity;

    if (mTimeAccumulator > 0) {
      interpolate(mTimeAccumulator / SOLVER_TIMESTEP_SEC);
    }

    // End the spring immediately if it is overshooting and overshoot clamping is enabled.
    // Also make sure that if the spring was considered within a resting threshold that it's now
    // snapped to its end value.
    if (isAtRest() || (mOvershootClampingEnabled && isOvershooting())) {
      // Don't call setCurrentValue because that forces a call to onSpringUpdate
      if (tension > 0) {
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
