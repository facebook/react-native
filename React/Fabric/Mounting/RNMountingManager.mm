/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNMountingManager.h"

#import <better/map.h>

#import <React/RCTAssert.h>
#import <React/RCTFollyConvert.h>
#import <React/RCTUtils.h>
#import <react/core/LayoutableShadowNode.h>
#import <react/core/RawProps.h>
#import <react/debug/SystraceSection.h>

#import "RNComponentViewProtocol.h"
#import "RNComponentViewRegistry.h"
#import "RNConversions.h"

using namespace facebook;
using namespace facebook::react;

// `Create` instruction
static void RNCreateMountInstruction(ShadowViewMutation const &mutation, RNComponentViewRegistry *registry)
{
  [registry dequeueComponentViewWithComponentHandle:mutation.newChildShadowView.componentHandle
                                                tag:mutation.newChildShadowView.tag];
}

// `Delete` instruction
static void RNDeleteMountInstruction(ShadowViewMutation const &mutation, RNComponentViewRegistry *registry)
{
  auto const &oldChildShadowView = mutation.oldChildShadowView;
  UIView<RNComponentViewProtocol> *componentView = [registry componentViewByTag:oldChildShadowView.tag];

  assert(componentView != nil && "Attempt to delete unregistered component.");

  [registry enqueueComponentViewWithComponentHandle:oldChildShadowView.componentHandle
                                                tag:oldChildShadowView.tag
                                      componentView:componentView];
}

// `Insert` instruction
static void RNInsertMountInstruction(ShadowViewMutation const &mutation, RNComponentViewRegistry *registry)
{
  auto const &newShadowView = mutation.newChildShadowView;
  auto const &parentShadowView = mutation.parentShadowView;

  UIView<RNComponentViewProtocol> *childComponentView = [registry componentViewByTag:newShadowView.tag];
  UIView<RNComponentViewProtocol> *parentComponentView = [registry componentViewByTag:parentShadowView.tag];

  assert(childComponentView != nil && "Attempt to mount unregistered component.");
  assert(parentComponentView != nil && "Attempt to mount into unregistered component.");

  [parentComponentView mountChildComponentView:childComponentView index:mutation.index];
}

// `Remove` instruction
static void RNRemoveMountInstruction(ShadowViewMutation const &mutation, RNComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &parentShadowView = mutation.parentShadowView;

  UIView<RNComponentViewProtocol> *childComponentView = [registry componentViewByTag:oldShadowView.tag];
  UIView<RNComponentViewProtocol> *parentComponentView = [registry componentViewByTag:parentShadowView.tag];

  assert(childComponentView != nil && "Attempt to unmount unregistered component.");
  assert(parentComponentView != nil && "Attempt to unmount from unregistered component.");

  [parentComponentView unmountChildComponentView:childComponentView index:mutation.index];
}

// `Update Props` instruction
static void RNUpdatePropsMountInstruction(ShadowViewMutation const &mutation, RNComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &newShadowView = mutation.newChildShadowView;
  UIView<RNComponentViewProtocol> *componentView = [registry componentViewByTag:newShadowView.tag];
  [componentView updateProps:newShadowView.props oldProps:oldShadowView.props];
}

// `Update EventEmitter` instruction
static void RNUpdateEventEmitterMountInstruction(ShadowViewMutation const &mutation, RNComponentViewRegistry *registry)
{
  auto const &newShadowView = mutation.newChildShadowView;
  UIView<RNComponentViewProtocol> *componentView = [registry componentViewByTag:newShadowView.tag];
  [componentView updateEventEmitter:newShadowView.eventEmitter];
}

// `Update LayoutMetrics` instruction
static void RNUpdateLayoutMetricsMountInstruction(ShadowViewMutation const &mutation, RNComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &newShadowView = mutation.newChildShadowView;
  UIView<RNComponentViewProtocol> *componentView = [registry componentViewByTag:newShadowView.tag];
  [componentView updateLayoutMetrics:newShadowView.layoutMetrics oldLayoutMetrics:oldShadowView.layoutMetrics];
}

// `Update LocalData` instruction
static void RNUpdateLocalDataMountInstruction(ShadowViewMutation const &mutation, RNComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &newShadowView = mutation.newChildShadowView;
  UIView<RNComponentViewProtocol> *componentView = [registry componentViewByTag:newShadowView.tag];
  [componentView updateLocalData:newShadowView.localData oldLocalData:oldShadowView.localData];
}

// `Update State` instruction
static void RNUpdateStateMountInstruction(ShadowViewMutation const &mutation, RNComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &newShadowView = mutation.newChildShadowView;
  UIView<RNComponentViewProtocol> *componentView = [registry componentViewByTag:newShadowView.tag];
  [componentView updateState:newShadowView.state oldState:oldShadowView.state];
}

// `Finalize Updates` instruction
static void RNFinalizeUpdatesMountInstruction(
    ShadowViewMutation const &mutation,
    RNComponentViewUpdateMask mask,
    RNComponentViewRegistry *registry)
{
  auto const &newShadowView = mutation.newChildShadowView;
  UIView<RNComponentViewProtocol> *componentView = [registry componentViewByTag:newShadowView.tag];
  [componentView finalizeUpdates:mask];
}

// `Update` instruction
static void RNPerformMountInstructions(ShadowViewMutationList const &mutations, RNComponentViewRegistry *registry)
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

@implementation RNMountingManager

- (instancetype)init
{
  if (self = [super init]) {
    _componentViewRegistry = [[RNComponentViewRegistry alloc] init];
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

- (void)dispatchCommand:(ReactTag)reactTag commandName:(NSString *)commandName args:(NSArray *)args
{
  if (RCTIsMainQueue()) {
    // Already on the proper thread, so:
    // * No need to do a thread jump;
    // * No need to allocate a block.
    [self synchronouslyDispatchCommandOnUIThread:reactTag commandName:commandName args:args];
    return;
  }

  RCTExecuteOnMainQueue(^{
    RCTAssertMainQueue();
    [self synchronouslyDispatchCommandOnUIThread:reactTag commandName:commandName args:args];
  });
}

- (void)mountMutations:(MountingCoordinator::Shared const &)mountingCoordinator
{
  SystraceSection s("-[RNMountingManager mountMutations:]");

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
  UIView<RNComponentViewProtocol> *componentView = [_componentViewRegistry componentViewByTag:reactTag];
  SharedProps oldProps = [componentView props];
  SharedProps newProps = componentDescriptor.cloneProps(oldProps, RawProps(convertIdToFollyDynamic(props)));
  [componentView updateProps:newProps oldProps:oldProps];
}

- (void)synchronouslyDispatchCommandOnUIThread:(ReactTag)reactTag
                                   commandName:(NSString *)commandName
                                          args:(NSArray *)args
{
  RCTAssertMainQueue();
  UIView<RNComponentViewProtocol> *componentView = [_componentViewRegistry componentViewByTag:reactTag];
  [componentView handleCommand:commandName args:args];
}

@end
