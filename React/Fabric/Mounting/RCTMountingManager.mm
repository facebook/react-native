/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTMountingManager.h"

#import <better/map.h>

#import <React/RCTAssert.h>
#import <React/RCTFollyConvert.h>
#import <React/RCTUtils.h>
#import <react/core/LayoutableShadowNode.h>
#import <react/core/RawProps.h>
#import <react/debug/SystraceSection.h>

#import "RCTComponentViewProtocol.h"
#import "RCTComponentViewRegistry.h"
#import "RCTConversions.h"

using namespace facebook;
using namespace facebook::react;

// `Create` instruction
static void RNCreateMountInstruction(ShadowViewMutation const &mutation, RCTComponentViewRegistry *registry)
{
  [registry dequeueComponentViewWithComponentHandle:mutation.newChildShadowView.componentHandle
                                                tag:mutation.newChildShadowView.tag];
}

// `Delete` instruction
static void RNDeleteMountInstruction(ShadowViewMutation const &mutation, RCTComponentViewRegistry *registry)
{
  auto const &oldChildShadowView = mutation.oldChildShadowView;
  UIView<RCTComponentViewProtocol> *componentView = [registry componentViewByTag:oldChildShadowView.tag];

  assert(componentView != nil && "Attempt to delete unregistered component.");

  [registry enqueueComponentViewWithComponentHandle:oldChildShadowView.componentHandle
                                                tag:oldChildShadowView.tag
                                      componentView:componentView];
}

// `Insert` instruction
static void RNInsertMountInstruction(ShadowViewMutation const &mutation, RCTComponentViewRegistry *registry)
{
  auto const &newShadowView = mutation.newChildShadowView;
  auto const &parentShadowView = mutation.parentShadowView;

  UIView<RCTComponentViewProtocol> *childComponentView = [registry componentViewByTag:newShadowView.tag];
  UIView<RCTComponentViewProtocol> *parentComponentView = [registry componentViewByTag:parentShadowView.tag];

  assert(childComponentView != nil && "Attempt to mount unregistered component.");
  assert(parentComponentView != nil && "Attempt to mount into unregistered component.");

  [parentComponentView mountChildComponentView:childComponentView index:mutation.index];
}

// `Remove` instruction
static void RNRemoveMountInstruction(ShadowViewMutation const &mutation, RCTComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &parentShadowView = mutation.parentShadowView;

  UIView<RCTComponentViewProtocol> *childComponentView = [registry componentViewByTag:oldShadowView.tag];
  UIView<RCTComponentViewProtocol> *parentComponentView = [registry componentViewByTag:parentShadowView.tag];

  assert(childComponentView != nil && "Attempt to unmount unregistered component.");
  assert(parentComponentView != nil && "Attempt to unmount from unregistered component.");

  [parentComponentView unmountChildComponentView:childComponentView index:mutation.index];
}

// `Update Props` instruction
static void RNUpdatePropsMountInstruction(ShadowViewMutation const &mutation, RCTComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &newShadowView = mutation.newChildShadowView;
  UIView<RCTComponentViewProtocol> *componentView = [registry componentViewByTag:newShadowView.tag];
  [componentView updateProps:newShadowView.props oldProps:oldShadowView.props];
}

// `Update EventEmitter` instruction
static void RNUpdateEventEmitterMountInstruction(ShadowViewMutation const &mutation, RCTComponentViewRegistry *registry)
{
  auto const &newShadowView = mutation.newChildShadowView;
  UIView<RCTComponentViewProtocol> *componentView = [registry componentViewByTag:newShadowView.tag];
  [componentView updateEventEmitter:newShadowView.eventEmitter];
}

// `Update LayoutMetrics` instruction
static void RNUpdateLayoutMetricsMountInstruction(
    ShadowViewMutation const &mutation,
    RCTComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &newShadowView = mutation.newChildShadowView;
  UIView<RCTComponentViewProtocol> *componentView = [registry componentViewByTag:newShadowView.tag];
  [componentView updateLayoutMetrics:newShadowView.layoutMetrics oldLayoutMetrics:oldShadowView.layoutMetrics];
}

// `Update LocalData` instruction
static void RNUpdateLocalDataMountInstruction(ShadowViewMutation const &mutation, RCTComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &newShadowView = mutation.newChildShadowView;
  UIView<RCTComponentViewProtocol> *componentView = [registry componentViewByTag:newShadowView.tag];
  [componentView updateLocalData:newShadowView.localData oldLocalData:oldShadowView.localData];
}

// `Update State` instruction
static void RNUpdateStateMountInstruction(ShadowViewMutation const &mutation, RCTComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &newShadowView = mutation.newChildShadowView;
  UIView<RCTComponentViewProtocol> *componentView = [registry componentViewByTag:newShadowView.tag];
  [componentView updateState:newShadowView.state oldState:oldShadowView.state];
}

// `Finalize Updates` instruction
static void RNFinalizeUpdatesMountInstruction(
    ShadowViewMutation const &mutation,
    RNComponentViewUpdateMask mask,
    RCTComponentViewRegistry *registry)
{
  auto const &newShadowView = mutation.newChildShadowView;
  UIView<RCTComponentViewProtocol> *componentView = [registry componentViewByTag:newShadowView.tag];
  [componentView finalizeUpdates:mask];
}

// `Update` instruction
static void RNPerformMountInstructions(ShadowViewMutationList const &mutations, RCTComponentViewRegistry *registry)
{
  SystraceSection s("RNPerformMountInstructions");

  for (auto const &mutation : mutations) {
    switch (mutation.type) {
      case ShadowViewMutation::Create: {
        RNCreateMountInstruction(mutation, registry);
        break;
      }
      case ShadowViewMutation::Delete: {
        RNDeleteMountInstruction(mutation, registry);
        break;
      }
      case ShadowViewMutation::Insert: {
        RNUpdatePropsMountInstruction(mutation, registry);
        RNUpdateEventEmitterMountInstruction(mutation, registry);
        RNUpdateLocalDataMountInstruction(mutation, registry);
        RNUpdateStateMountInstruction(mutation, registry);
        RNUpdateLayoutMetricsMountInstruction(mutation, registry);
        RNFinalizeUpdatesMountInstruction(mutation, RNComponentViewUpdateMaskAll, registry);
        RNInsertMountInstruction(mutation, registry);
        break;
      }
      case ShadowViewMutation::Remove: {
        RNRemoveMountInstruction(mutation, registry);
        break;
      }
      case ShadowViewMutation::Update: {
        auto const &oldChildShadowView = mutation.oldChildShadowView;
        auto const &newChildShadowView = mutation.newChildShadowView;

        auto mask = RNComponentViewUpdateMask{};

        if (oldChildShadowView.props != newChildShadowView.props) {
          RNUpdatePropsMountInstruction(mutation, registry);
          mask |= RNComponentViewUpdateMaskProps;
        }
        if (oldChildShadowView.eventEmitter != newChildShadowView.eventEmitter) {
          RNUpdateEventEmitterMountInstruction(mutation, registry);
          mask |= RNComponentViewUpdateMaskEventEmitter;
        }
        if (oldChildShadowView.localData != newChildShadowView.localData) {
          RNUpdateLocalDataMountInstruction(mutation, registry);
          mask |= RNComponentViewUpdateMaskLocalData;
        }
        if (oldChildShadowView.state != newChildShadowView.state) {
          RNUpdateStateMountInstruction(mutation, registry);
          mask |= RNComponentViewUpdateMaskState;
        }
        if (oldChildShadowView.layoutMetrics != newChildShadowView.layoutMetrics) {
          RNUpdateLayoutMetricsMountInstruction(mutation, registry);
          mask |= RNComponentViewUpdateMaskLayoutMetrics;
        }

        if (mask != RNComponentViewUpdateMaskNone) {
          RNFinalizeUpdatesMountInstruction(mutation, mask, registry);
        }

        break;
      }
    }
  }
}

@implementation RCTMountingManager

- (instancetype)init
{
  if (self = [super init]) {
    _componentViewRegistry = [[RCTComponentViewRegistry alloc] init];
  }

  return self;
}

- (void)scheduleTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  if (RCTIsMainQueue()) {
    // Already on the proper thread, so:
    // * No need to do a thread jump;
    // * No need to do expensive copy of all mutations;
    // * No need to allocate a block.
    [self mountMutations:mountingCoordinator];
    return;
  }

  auto mountingCoordinatorCopy = mountingCoordinator;
  RCTExecuteOnMainQueue(^{
    RCTAssertMainQueue();
    [self mountMutations:mountingCoordinatorCopy];
  });
}

- (void)mountMutations:(MountingCoordinator::Shared const &)mountingCoordinator
{
  SystraceSection s("-[RCTMountingManager mountMutations:]");

  auto transaction = mountingCoordinator->pullTransaction();
  if (!transaction.has_value()) {
    return;
  }

  auto surfaceId = transaction->getSurfaceId();

  RCTAssertMainQueue();
  [self.delegate mountingManager:self willMountComponentsWithRootTag:surfaceId];
  RNPerformMountInstructions(transaction->getMutations(), self.componentViewRegistry);
  [self.delegate mountingManager:self didMountComponentsWithRootTag:surfaceId];
}

- (void)synchronouslyUpdateViewOnUIThread:(ReactTag)reactTag
                             changedProps:(NSDictionary *)props
                      componentDescriptor:(const ComponentDescriptor &)componentDescriptor
{
  RCTAssertMainQueue();
  UIView<RCTComponentViewProtocol> *componentView = [_componentViewRegistry componentViewByTag:reactTag];
  SharedProps oldProps = [componentView props];
  SharedProps newProps = componentDescriptor.cloneProps(oldProps, RawProps(convertIdToFollyDynamic(props)));
  [componentView updateProps:newProps oldProps:oldProps];
}

@end
