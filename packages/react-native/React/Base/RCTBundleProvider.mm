/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBundleProvider.h"

using namespace facebook::react;

@implementation RCTBundleProvider{
  std::shared_ptr<const BigStringBuffer> _bundleBuffer;
  NSString *_sourceURL;
}

- (std::shared_ptr<const BigStringBuffer>)getBundle {
  return _bundleBuffer;
}

- (void)setBundle:(std::shared_ptr<const BigStringBuffer>)bundle {
  _bundleBuffer = bundle;
}

- (NSString *)getSourceURL {
  return _sourceURL;
}

- (void)setSourceURL:(NSString *)sourceURL {
  _sourceURL = sourceURL;
}
@end
