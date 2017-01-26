/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef RCTRELOADCOMMAND_H
#define RCTRELOADCOMMAND_H

#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>

@protocol RCTReloadListener
- (void)didReceiveReloadCommand;
@end

/** Registers a weakly-held observer of the Command+R reload key command. */
RCT_EXTERN void RCTRegisterReloadCommandListener(id<RCTReloadListener> listener);

#endif //RCTRELOADCOMMAND_H
