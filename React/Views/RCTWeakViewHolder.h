/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * THIS IS A HACK
 * This protocol should only be used for Paper ViewManagers which need to
 * use the Fabric Interop layer, and also need to reference their created
 * views. This protocol allows the view manager to store a weak reference to
 * any created views. It will not affect view lifecycle in any way.
 */
@protocol RCTWeakViewHolder

@property (nonatomic, strong) NSMapTable<NSNumber *, UIView *> *weakViews;

@end
