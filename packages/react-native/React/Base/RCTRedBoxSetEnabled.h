/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>

// In debug builds, the red box is enabled by default but it is further
// customizable using this method. However, this method only has an effect in
// builds where RCTRedBox is actually compiled in.
RCT_EXTERN void RCTRedBoxSetEnabled(BOOL enabled);
RCT_EXTERN BOOL RCTRedBoxGetEnabled(void);
