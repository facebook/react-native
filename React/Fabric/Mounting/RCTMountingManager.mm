/*
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
#import "RCTMountingTransactionObserverCoordinator.h"

using namespace facebook;
using namespace facebook::react;

// `Create` instruction
static void RNCreateMountInstruction(
    ShadowViewMutation const &mutation,
    RCTComponentViewRegistry *registry,
    RCTMountingTransactionObserverCoordinator &observerCoordinator,
    SurfaceId surfaceId)
{
  auto componentViewDescriptor =
      [registry dequeueComponentViewWithComponentHandle:mutation.newChildShadowView.componentHandle
                                                    tag:mutation.newChildShadowView.tag];

  observerCoordinator.registerViewComponentDescriptor(componentViewDescriptor, surfaceId);
}

// `Delete` instruction
static void RNDeleteMountInstruction(
    ShadowViewMutation const &mutation,
    RCTComponentViewRegistry *registry,
    RCTMountingTransactionObserverCoordinator &observerCoordinator,
    SurfaceId surfaceId)
{
  auto const &oldChildShadowView = mutation.oldChildShadowView;
  auto const &componentViewDescriptor = [registry componentViewDescriptorWithTag:oldChildShadowView.tag];
  observerCoordinator.unregisterViewComponentDescriptor(componentViewDescriptor, surfaceId);
  [registry enqueueComponentViewWithComponentHandle:oldChildShadowView.componentHandle
                                                tag:oldChildShadowView.tag
                            componentViewDescriptor:componentViewDescriptor];
}

// `Insert` instruction
static void RNInsertMountInstruction(ShadowViewMutation const &mutation, RCTComponentViewRegistry *registry)
{
  auto const &newShadowView = mutation.newChildShadowView;
  auto const &parentShadowView = mutation.parentShadowView;

  auto const &childComponentViewDescriptor = [registry componentViewDescriptorWithTag:newShadowView.tag];
  auto const &parentComponentViewDescriptor = [registry componentViewDescriptorWithTag:parentShadowView.tag];

  [parentComponentViewDescriptor.view mountChildComponentView:childComponentViewDescriptor.view index:mutation.index];
}

// `Remove` instruction
static void RNRemoveMountInstruction(ShadowViewMutation const &mutation, RCTComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &parentShadowView = mutation.parentShadowView;

  auto const &childComponentViewDescriptor = [registry componentViewDescriptorWithTag:oldShadowView.tag];
  auto const &parentComponentViewDescriptor = [registry componentViewDescriptorWithTag:parentShadowView.tag];

  [parentComponentViewDescriptor.view unmountChildComponentView:childComponentViewDescriptor.view index:mutation.index];
}

// `Update Props` instruction
static void RNUpdatePropsMountInstruction(ShadowViewMutation const &mutation, RCTComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &newShadowView = mutation.newChildShadowView;
  auto const &componentViewDescriptor = [registry componentViewDescriptorWithTag:newShadowView.tag];
  [componentViewDescriptor.view updateProps:newShadowView.props oldProps:oldShadowView.props];
}

// `Update EventEmitter` instruction
static void RNUpdateEventEmitterMountInstruction(ShadowViewMutation const &mutation, RCTComponentViewRegistry *registry)
{
  auto const &newShadowView = mutation.newChildShadowView;
  auto const &componentViewDescriptor = [registry componentViewDescriptorWithTag:newShadowView.tag];
  [componentViewDescriptor.view updateEventEmitter:newShadowView.eventEmitter];
}

// `Update LayoutMetrics` instruction
static void RNUpdateLayoutMetricsMountInstruction(
    ShadowViewMutation const &mutation,
    RCTComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &newShadowView = mutation.newChildShadowView;
  auto const &componentViewDescriptor = [registry componentViewDescriptorWithTag:newShadowView.tag];
  [componentViewDescriptor.view updateLayoutMetrics:newShadowView.layoutMetrics
                                   oldLayoutMetrics:oldShadowView.layoutMetrics];
}

// `Update State` instruction
static void RNUpdateStateMountInstruction(ShadowViewMutation const &mutation, RCTComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &newShadowView = mutation.newChildShadowView;
  auto const &componentViewDescriptor = [registry componentViewDescriptorWithTag:newShadowView.tag];
  [componentViewDescriptor.view updateState:newShadowView.state oldState:oldShadowView.state];
}

// `Finalize Updates` instruction
static void RNFinalizeUpdatesMountInstruction(
    ShadowViewMutation const &mutation,
    RNComponentViewUpdateMask mask,
    RCTComponentViewRegistry *registry)
{
  auto const &newShadowView = mutation.newChildShadowView;
  auto const &componentViewDescriptor = [registry componentViewDescriptorWithTag:newShadowView.tag];
  [componentViewDescriptor.view finalizeUpdates:mask];
}

// `Update` instruction
static void RNPerformMountInstructions(
    ShadowViewMutationList const &mutations,
    RCTComponentViewRegistry *registry,
    RCTMountingTransactionObserverCoordinator &observerCoordinator,
    SurfaceId surfaceId)
{
  SystraceSection s("RNPerformMountInstructions");

  [CATransaction begin];
  [CATransaction setValue:(id)kCFBooleanTrue forKey:kCATransactionDisableActions];
  for (auto const &mutation : mutations) {
    switch (mutation.type) {
      case ShadowViewMutation::Create: {
        RNCreateMountInstruction(mutation, registry, observerCoordinator, surfaceId);
        break;
      }
      case ShadowViewMutation::Delete: {
        RNDeleteMountInstruction(mutation, registry, observerCoordinator, surfaceId);
        break;
      }
      case ShadowViewMutation::Insert: {
        RNUpdatePropsMountInstruction(mutation, registry);
        RNUpdateEventEmitterMountInstruction(mutation, registry);
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
  [CATransaction commit];
}

@implementation RCTMountingManager {
  RCTMountingTransactionObserverCoordinator _observerCoordinator;
  BOOL _transactionInFlight;
  BOOL _followUpTransactionRequired;
}

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
    [self initiateTransaction:mountingCoordinator];
    return;
  }

  auto mountingCoordinatorCopy = mountingCoordinator;
  RCTExecuteOnMainQueue(^{
    RCTAssertMainQueue();
    [self initiateTransaction:mountingCoordinatorCopy];
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

- (void)initiateTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  SystraceSection s("-[RCTMountingManager initiateTransaction:]");
  RCTAssertMainQueue();

  if (_transactionInFlight) {
    _followUpTransactionRequired = YES;
    return;
  }

  do {
    _followUpTransactionRequired = NO;
    _transactionInFlight = YES;
    [self performTransaction:mountingCoordinator];
    _transactionInFlight = NO;
  } while (_followUpTransactionRequired);
}

- (void)performTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  SystraceSection s("-[RCTMountingManager performTransaction:]");
  RCTAssertMainQueue();

  auto transaction = mountingCoordinator->pullTransaction(DifferentiatorMode::Classic);
  if (!transaction.has_value()) {
    return;
  }

  auto surfaceId = transaction->getSurfaceId();
  auto &mutations = transaction->getMutations();

  if (mutations.size() == 0) {
    return;
  }

  auto telemetry = transaction->getTelemetry();
  auto number = transaction->getNumber();

  [self.delegate mountingManager:self willMountComponentsWithRootTag:surfaceId];
  _observerCoordinator.notifyObserversMountingTransactionWillMount({surfaceId, number, telemetry});
  telemetry.willMount();
  RNPerformMountInstructions(mutations, self.componentViewRegistry, _observerCoordinator, surfaceId);
  telemetry.didMount();
  _observerCoordinator.notifyObserversMountingTransactionDidMount({surfaceId, number, telemetry});
  [self.delegate mountingManager:self didMountComponentsWithRootTag:surfaceId];
}

- (void)synchronouslyUpdateViewOnUIThread:(ReactTag)reactTag
                             changedProps:(NSDictionary *)props
                      componentDescriptor:(const ComponentDescriptor &)componentDescriptor
{
  RCTAssertMainQueue();
  UIView<RCTComponentViewProtocol> *componentView = [_componentViewRegistry findComponentViewWithTag:reactTag];
  SharedProps oldProps = [componentView props];
  SharedProps newProps = componentDescriptor.cloneProps(oldProps, RawProps(convertIdToFollyDynamic(props)));
  [componentView updateProps:newProps oldProps:oldProps];
}

- (void)synchronouslyDispatchCommandOnUIThread:(ReactTag)reactTag
                                   commandName:(NSString *)commandName
                                          args:(NSArray *)args
{
  RCTAssertMainQueue();
  UIView<RCTComponentViewProtocol> *componentView = [_componentViewRegistry findComponentViewWithTag:reactTag];
  [componentView handleCommand:commandName args:args];
}

@end
