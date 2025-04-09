// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include <string>

namespace facebook::react {
/**
 * Interface for handling a surface in React Native. Each platform can have
 * custom logic to show/hide.
 * Inspired by
 * xplat/js/react-native-github/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/common/SurfaceDelegate.java
 */
class SurfaceDelegate {
 public:
  virtual ~SurfaceDelegate() = default;

  /**
   * Create the React content view that uses the appKey as the React application
   * name
   */
  virtual void createContentView(std::string appKey) = 0;

  /**
   * Check if the content view is created and ready to be shown
   */
  virtual bool isContentViewReady() = 0;

  /** Destroy the React content view to avoid memory leak */
  virtual void destroyContentView() = 0;

  /** Show the surface containing the React content view */
  virtual void show() = 0;

  /** Hide the surface containing the React content view */
  virtual void hide() = 0;

  /** Check if the surface is currently showing */
  virtual bool isShowing() = 0;
};
} // namespace facebook::react
