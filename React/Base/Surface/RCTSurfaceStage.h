/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <React/RCTDefines.h>

/**
 * The stage of the Surface
 */
typedef NS_OPTIONS(NSInteger, RCTSurfaceStage) {
  RCTSurfaceStageSurfaceDidInitialize = 1 << 0,        // Surface object was created
  RCTSurfaceStageBridgeDidLoad = 1 << 1,               // Bridge was loaded
  RCTSurfaceStageModuleDidLoad = 1 << 2,               // Module (JavaScript code) was loaded
  RCTSurfaceStageSurfaceDidRun = 1 << 3,               // Module (JavaScript code) was run
  RCTSurfaceStageSurfaceDidInitialRendering = 1 << 4,  // UIManager created the first shadow views
  RCTSurfaceStageSurfaceDidInitialLayout = 1 << 5,     // UIManager completed the first layout pass
  RCTSurfaceStageSurfaceDidInitialMounting = 1 << 6,   // UIManager completed the first mounting pass
  RCTSurfaceStageSurfaceDidStop = 1 << 7,              // Surface stopped
};

/**
 * Returns `YES` if the stage is suitable for displaying normal React Native app.
 */
RCT_EXTERN BOOL RCTSurfaceStageIsRunning(RCTSurfaceStage stage);

/**
 * Returns `YES` if the stage is suitable for displaying activity indicator.
 */
RCT_EXTERN BOOL RCTSurfaceStageIsPreparing(RCTSurfaceStage stage);
