/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <objc/runtime.h>

#import <React/RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

// TODO: Eventually this should go away and files should just include RCTSurfacePresenter.h, but
// that pulls in all of fabric which doesn't compile in open source yet, so we mirror the protocol
// and duplicate the category here for now.


@protocol RCTSurfacePresenterObserver <NSObject>

@optional

- (void)willMountComponentsWithRootTag:(NSInteger)rootTag;
- (void)didMountComponentsWithRootTag:(NSInteger)rootTag;

@end

@protocol RCTSurfacePresenterStub <NSObject>

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)reactTag props:(NSDictionary *)props;
- (void)addObserver:(id<RCTSurfacePresenterObserver>)observer;
- (void)removeObserver:(id<RCTSurfacePresenterObserver>)observer;

@end

@interface RCTBridge (RCTSurfacePresenterStub)

- (id<RCTSurfacePresenterStub>)surfacePresenter;

@end

NS_ASSUME_NONNULL_END
