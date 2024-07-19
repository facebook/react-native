/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>

#ifdef __cplusplus
#import <jsinspector-modern/ReactCdp.h>
#endif

@interface RCTBridge (Inspector)

/**
 * The HostTarget for this bridge, if one has been created. Exposed for RCTCxxBridge only.
 */
@property (nonatomic, assign, readonly)
#ifdef __cplusplus
    facebook::react::jsinspector_modern::HostTarget *
#else
    // The inspector infrastructure cannot be used in C or Swift code.
    void *
#endif
        inspectorTarget;

@property (nonatomic, readonly, getter=isInspectable) BOOL inspectable;

@end
