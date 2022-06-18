package com.facebook.react.util;

/**
 * An enum that specifies the JS Interpreter to be used in the app
 * Old Logic uses the legacy code
 * JSC/HERMES loads the respective engine using the revamped logic
 */
public enum JSInterpreter {
  OLD_LOGIC,
  JSC,
  HERMES
}
