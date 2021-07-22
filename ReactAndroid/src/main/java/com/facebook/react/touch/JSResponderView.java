package com.facebook.react.touch;

/**
 * This interface should be implemented by all {@link View} subclasses that want to use
 * JSResponder's touches
 */
public interface JSResponderView {

  /**
   * Basically this is onTouchEvent replacement for JSTouchDispatcher
   * Overriding it and returning "false" will lead to pass JSTouchDispatcher underneath the view
   */
  boolean onJSTouchEvent(float x, float y);
}
