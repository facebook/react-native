/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTMountingManager.h"

#import <React/RCTAssert.h>
#import <React/RCTFollyConvert.h>
#import <React/RCTUtils.h>
#import <react/core/LayoutableShadowNode.h>
#import <react/core/RawProps.h>
#import <react/debug/SystraceSection.h>

#import "RCTComponentViewProtocol.h"
#import "RCTComponentViewRegistry.h"
#import "RCTConversions.h"

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

  // TODO(shergin): Make sure that we don't need this check anymore and delete it.
  if (componentView == nil) {
    return;
  }

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

  // TODO(shergin): Make sure that we don't need this check anymore and delete it.
  if (childComponentView == nil || parentComponentView == nil) {
    return;
  }

  [parentComponentView mountChildComponentView:childComponentView index:mutation.index];
}

// `Remove` instruction
static void RNRemoveMountInstruction(ShadowViewMutation const &mutation, RCTComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &parentShadowView = mutation.parentShadowView;

  UIView<RCTComponentViewProtocol> *childComponentView = [registry componentViewByTag:oldShadowView.tag];
  UIView<RCTComponentViewProtocol> *parentComponentView = [registry componentViewByTag:parentShadowView.tag];

  // TODO(shergin): Make sure that we don't need this check anymore and delete it.
  if (childComponentView == nil || parentComponentView == nil) {
    return;
  }

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
        if (oldChildShadowView.props != newChildShadowView.props) {
          RNUpdatePropsMountInstruction(mutation, registry);
        }
        if (oldChildShadowView.eventEmitter != newChildShadowView.eventEmitter) {
          RNUpdateEventEmitterMountInstruction(mutation, registry);
        }
        if (oldChildShadowView.localData != newChildShadowView.localData) {
          RNUpdateLocalDataMountInstruction(mutation, registry);
        }
        if (oldChildShadowView.state != newChildShadowView.state) {
          RNUpdateStateMountInstruction(mutation, registry);
        }
        if (oldChildShadowView.layoutMetrics != newChildShadowView.layoutMetrics) {
          RNUpdateLayoutMetricsMountInstruction(mutation, registry);
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

- (void)scheduleMutations:(ShadowViewMutationList const &)mutations rootTag:(ReactTag)rootTag
{
  if (RCTIsMainQueue()) {
    // Already on the proper thread, so:
    // * No need to do a thread jump;
    // * No need to do expensive copy of all mutations;
    // * No need to allocate a block.
    [self mountMutations:mutations rootTag:rootTag];
    return;
  }

  // We need a non-reference for `mutations` to allow copy semantic.
  auto mutationsCopy = mutations;

  RCTExecuteOnMainQueue(^{
    RCTAssertMainQueue();
    [self mountMutations:mutationsCopy rootTag:rootTag];
  });
}

- (void)mountMutations:(ShadowViewMutationList const &)mutations rootTag:(ReactTag)rootTag
{
  SystraceSection s("-[RCTMountingManager mountMutations:rootTag:]");

  RCTAssertMainQueue();

  [self.delegate mountingManager:self willMountComponentsWithRootTag:rootTag];
  RNPerformMountInstructions(mutations, self.componentViewRegistry);
  [self.delegate mountingManager:self didMountComponentsWithRootTag:rootTag];
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

- (void)optimisticallyCreateComponentViewWithComponentHandle:(ComponentHandle)componentHandle
{
  if (RCTIsMainQueue()) {
    // There is no reason to allocate views ahead of time on the main thread.
    return;
  }

  RCTExecuteOnMainQueue(^{
    [self->_componentViewRegistry optimisticallyCreateComponentViewWithComponentHandle:componentHandle];
  });
}

@end
