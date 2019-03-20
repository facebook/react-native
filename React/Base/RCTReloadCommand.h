/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>

@protocol RCTReloadListener
- (void)didReceiveReloadCommand;
@end

/** Registers a weakly-held observer of the Command+R reload key command. */
RCT_EXTERN void RCTRegisterReloadCommandListener(id<RCTReloadListener> listener);

/** Triggers a reload for all current listeners. You shouldn't need to use this directly in most cases. */
RCT_EXTERN void RCTTriggerReloadCommandListeners(void);
