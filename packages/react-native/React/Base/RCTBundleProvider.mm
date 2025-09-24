/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBundleProvider.h"

@implementation RCTBundleProvider{
  NSBigStringBuffer *_scriptBuffer;
  NSString *_sourceURL;
}

- (NSBigStringBuffer *)getBundle {
  return _scriptBuffer;
}

- (void)setBundle:(NSBigStringBuffer *)bundle {
  _scriptBuffer = bundle;
}

- (NSString *)getSourceURL {
  return _sourceURL;
}

- (void)setSourceURL:(NSString *)sourceURL {
  _sourceURL = sourceURL;
}
@end
