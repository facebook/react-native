// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTJavaScriptExecutor.h"

@interface RCTWebSocketExecutor : NSObject <RCTJavaScriptExecutor>

- (instancetype)initWithURL:(NSURL *)url;

@end
