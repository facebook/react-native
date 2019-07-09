package com.facebook.react;

import android.util.Log;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.Implements;

import static com.facebook.react.bridge.ReactMarkerConstants.CHANGE_THREAD_PRIORITY;
import static com.facebook.react.bridge.ReactMarkerConstants.GET_REACT_INSTANCE_MANAGER_START;
import static com.facebook.react.bridge.ReactMarkerConstants.PRE_RUN_JS_BUNDLE_START;
import static com.facebook.react.bridge.ReactMarkerConstants.RUN_JS_BUNDLE_END;
import static org.fest.assertions.api.Assertions.assertThat;

/** Test case for {@link ReactPerformanceLogger}. */
@RunWith(RobolectricTestRunner.class)
@Config(manifest=Config.NONE, shadows={ReactPerformanceLoggerTest.ShadowLog.class})
public final class ReactPerformanceLoggerTest {

  @Test
  public void logsDuration() {
    ReactPerformanceLogger logger = new ReactPerformanceLogger();
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.BRIDGE_STARTUP)).isEqualTo(0);

    logger.markStop(ReactPerformanceLogger.Tag.BRIDGE_STARTUP, 1);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.BRIDGE_STARTUP)).isEqualTo(0);

    logger.markStart(ReactPerformanceLogger.Tag.BRIDGE_STARTUP, 1000);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.BRIDGE_STARTUP)).isLessThan(0);

    logger.markStop(ReactPerformanceLogger.Tag.BRIDGE_STARTUP, 2500);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.BRIDGE_STARTUP)).isEqualTo(1500);

    logger.markStart(ReactPerformanceLogger.Tag.BRIDGE_STARTUP, 3000);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.BRIDGE_STARTUP)).isLessThan(0);

    logger.markStart(ReactPerformanceLogger.Tag.BRIDGE_STARTUP, 3500);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.BRIDGE_STARTUP)).isLessThan(0);

    logger.markStop(ReactPerformanceLogger.Tag.BRIDGE_STARTUP, 4500);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.BRIDGE_STARTUP)).isEqualTo(1000);

    logger.markStop(ReactPerformanceLogger.Tag.BRIDGE_STARTUP, 9000);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.BRIDGE_STARTUP)).isEqualTo(1000);
  }

  @Test
  public void handlesUnbalancedCalls() {
    ReactPerformanceLogger logger = new ReactPerformanceLogger();
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.SCRIPT_EXECUTION)).isEqualTo(0);

    logger.logMarker(RUN_JS_BUNDLE_END, null, 0);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.SCRIPT_EXECUTION)).isEqualTo(0);

    logger.logMarker(PRE_RUN_JS_BUNDLE_START, null, 0);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.SCRIPT_EXECUTION)).isLessThan(0);

    logger.logMarker(PRE_RUN_JS_BUNDLE_START, null, 0);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.SCRIPT_EXECUTION)).isLessThan(0);

    logger.logMarker(RUN_JS_BUNDLE_END, null, 0);
    final long duration = logger.getDuration(ReactPerformanceLogger.Tag.SCRIPT_EXECUTION);
    assertThat(duration).isGreaterThanOrEqualTo(0);

    logger.logMarker(RUN_JS_BUNDLE_END, null, 0);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.SCRIPT_EXECUTION)).isEqualTo(duration);

    logger.logMarker(PRE_RUN_JS_BUNDLE_START, null, 0);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.SCRIPT_EXECUTION)).isLessThan(0);
  }

  @Test
  public void logsBridgeStartupDuration() {
    ReactPerformanceLogger logger = new ReactPerformanceLogger();
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.BRIDGE_STARTUP)).isEqualTo(0);

    logger.logMarker(GET_REACT_INSTANCE_MANAGER_START, null, 0);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.BRIDGE_STARTUP)).isLessThan(0);

    logger.logMarker(CHANGE_THREAD_PRIORITY, null, 0);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.BRIDGE_STARTUP)).isGreaterThanOrEqualTo(0);
  }

  @Test
  public void logsScriptExecutionDuration() {
    ReactPerformanceLogger logger = new ReactPerformanceLogger();
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.SCRIPT_EXECUTION)).isEqualTo(0);

    logger.logMarker(PRE_RUN_JS_BUNDLE_START, null, 0);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.SCRIPT_EXECUTION)).isLessThan(0);

    logger.logMarker(RUN_JS_BUNDLE_END, null, 0);
    assertThat(logger.getDuration(ReactPerformanceLogger.Tag.SCRIPT_EXECUTION)).isGreaterThanOrEqualTo(0);
  }

  @SuppressWarnings("unused")
  @Implements(Log.class)
  public static class ShadowLog {
    public static int d(String tag, String msg) {
      return 0;
    }

    public static int i(String tag, String msg) {
      return 0;
    }
  }
}
