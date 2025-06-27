/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeAnimatedNodesManager.h"

#include <folly/json.h>
#include <glog/logging.h>
#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/profiling/perfetto.h>
#include <react/renderer/animated/drivers/AnimationDriver.h>
#include <react/renderer/animated/drivers/AnimationDriverUtils.h>
#include <react/renderer/animated/drivers/DecayAnimationDriver.h>
#include <react/renderer/animated/drivers/FrameAnimationDriver.h>
#include <react/renderer/animated/drivers/SpringAnimationDriver.h>
#include <react/renderer/animated/nodes/AdditionAnimatedNode.h>
#include <react/renderer/animated/nodes/AnimatedNode.h>
#include <react/renderer/animated/nodes/ColorAnimatedNode.h>
#include <react/renderer/animated/nodes/DiffClampAnimatedNode.h>
#include <react/renderer/animated/nodes/DivisionAnimatedNode.h>
#include <react/renderer/animated/nodes/InterpolationAnimatedNode.h>
#include <react/renderer/animated/nodes/ModulusAnimatedNode.h>
#include <react/renderer/animated/nodes/MultiplicationAnimatedNode.h>
#include <react/renderer/animated/nodes/PropsAnimatedNode.h>
#include <react/renderer/animated/nodes/RoundAnimatedNode.h>
#include <react/renderer/animated/nodes/StyleAnimatedNode.h>
#include <react/renderer/animated/nodes/SubtractionAnimatedNode.h>
#include <react/renderer/animated/nodes/TrackingAnimatedNode.h>
#include <react/renderer/animated/nodes/TransformAnimatedNode.h>
#include <react/renderer/animated/nodes/ValueAnimatedNode.h>
#include <react/renderer/core/EventEmitter.h>

namespace facebook::react {

// Global function pointer for getting current time. Current time
// can be injected for testing purposes.
static TimePointFunction g_now = &std::chrono::steady_clock::now;
void g_setNativeAnimatedNowTimestampFunction(TimePointFunction nowFunction) {
  g_now = nowFunction;
}

namespace {

struct NodesQueueItem {
  AnimatedNode* node;
  bool connectedToFinishedAnimation;
};

void mergeObjects(folly::dynamic& out, const folly::dynamic& objectToMerge) {
  react_native_assert(objectToMerge.isObject());
  if (out.isObject() && !out.empty()) {
    for (const auto& pair : objectToMerge.items()) {
      out[pair.first] = pair.second;
    }
  } else {
    out = objectToMerge;
  }
}

} // namespace

NativeAnimatedNodesManager::NativeAnimatedNodesManager(
    DirectManipulationCallback&& directManipulationCallback,
    FabricCommitCallback&& fabricCommitCallback,
    StartOnRenderCallback&& startOnRenderCallback,
    StopOnRenderCallback&& stopOnRenderCallback) noexcept
    : directManipulationCallback_(std::move(directManipulationCallback)),
      fabricCommitCallback_(std::move(fabricCommitCallback)),
      startOnRenderCallback_(std::move(startOnRenderCallback)),
      stopOnRenderCallback_(std::move(stopOnRenderCallback)) {}

NativeAnimatedNodesManager::~NativeAnimatedNodesManager() noexcept {
  stopRenderCallbackIfNeeded();
}

std::optional<double> NativeAnimatedNodesManager::getValue(Tag tag) noexcept {
  auto node = getAnimatedNode<ValueAnimatedNode>(tag);
  if (node != nullptr) {
    return node->getValue();
  } else {
    LOG(WARNING)
        << "Cannot get value from AnimatedNode, it's not a ValueAnimatedNode";
    return std::nullopt;
  }
}

#pragma mark - Graph

std::unique_ptr<AnimatedNode> NativeAnimatedNodesManager::animatedNode(
    Tag tag,
    const folly::dynamic& config) noexcept {
  auto typeName = config["type"].asString();

  auto type = AnimatedNode::getNodeTypeByName(typeName);
  if (!type) {
    LOG(WARNING) << "Invalid AnimatedNode type " << typeName;
    return nullptr;
  }

  switch (type.value()) {
    case AnimatedNodeType::Style:
      return std::make_unique<StyleAnimatedNode>(tag, config, *this);
    case AnimatedNodeType::Value:
      return std::make_unique<ValueAnimatedNode>(tag, config, *this);
    case AnimatedNodeType::Color:
      return std::make_unique<ColorAnimatedNode>(tag, config, *this);
    case AnimatedNodeType::Props:
      return std::make_unique<PropsAnimatedNode>(tag, config, *this);
    case AnimatedNodeType::Tracking:
      return std::make_unique<TrackingAnimatedNode>(tag, config, *this);
    case AnimatedNodeType::Interpolation:
      return std::make_unique<InterpolationAnimatedNode>(tag, config, *this);
    case AnimatedNodeType::Transform:
      return std::make_unique<TransformAnimatedNode>(tag, config, *this);
    case AnimatedNodeType::Subtraction:
      return std::make_unique<SubtractionAnimatedNode>(tag, config, *this);
    case AnimatedNodeType::Addition:
      return std::make_unique<AdditionAnimatedNode>(tag, config, *this);
    case AnimatedNodeType::Multiplication:
      return std::make_unique<MultiplicationAnimatedNode>(tag, config, *this);
    case AnimatedNodeType::Division:
      return std::make_unique<DivisionAnimatedNode>(tag, config, *this);
    case AnimatedNodeType::Modulus:
      return std::make_unique<ModulusAnimatedNode>(tag, config, *this);
    case AnimatedNodeType::Diffclamp:
      return std::make_unique<DiffClampAnimatedNode>(tag, config, *this);
    case AnimatedNodeType::Round:
      return std::make_unique<RoundAnimatedNode>(tag, config, *this);
    default:
      LOG(WARNING) << "Cannot create AnimatedNode of type " << typeName
                   << ", it's not implemented yet";
      return nullptr;
  }
}

void NativeAnimatedNodesManager::createAnimatedNode(
    Tag tag,
    const folly::dynamic& config) noexcept {
  auto node = animatedNode(tag, config);
  if (node) {
    std::lock_guard<std::mutex> lock(connectedAnimatedNodesMutex_);
    animatedNodes_.emplace(tag, std::move(node));
    updatedNodeTags_.insert(tag);
  }
}

void NativeAnimatedNodesManager::connectAnimatedNodes(
    Tag parentTag,
    Tag childTag) noexcept {
  react_native_assert(parentTag);
  react_native_assert(childTag);

  auto parentNode = getAnimatedNode<AnimatedNode>(parentTag);
  auto childNode = getAnimatedNode<AnimatedNode>(childTag);

  if ((parentNode != nullptr) && (childNode != nullptr)) {
    parentNode->addChild(childTag);
    updatedNodeTags_.insert(childTag);
  } else {
    LOG(WARNING) << "Cannot ConnectAnimatedNodes, parentTag = " << parentTag
                 << ", childTag = " << childTag
                 << ", not all of them are created";
  }
}

void NativeAnimatedNodesManager::connectAnimatedNodeToView(
    Tag propsNodeTag,
    Tag viewTag) noexcept {
  react_native_assert(propsNodeTag);
  react_native_assert(viewTag);

  auto node = getAnimatedNode<PropsAnimatedNode>(propsNodeTag);
  if (node != nullptr) {
    node->connectToView(viewTag);
    {
      std::lock_guard<std::mutex> lock(connectedAnimatedNodesMutex_);
      connectedAnimatedNodes_.insert({viewTag, propsNodeTag});
    }
    updatedNodeTags_.insert(node->tag());
  } else {
    LOG(WARNING)
        << "Cannot ConnectAnimatedNodeToView, animated node has to be props type";
  }
}

void NativeAnimatedNodesManager::disconnectAnimatedNodeFromView(
    Tag propsNodeTag,
    Tag viewTag) noexcept {
  react_native_assert(propsNodeTag);
  react_native_assert(viewTag);

  auto node = getAnimatedNode<PropsAnimatedNode>(propsNodeTag);
  if (node != nullptr) {
    node->disconnectFromView(viewTag);
    {
      std::lock_guard<std::mutex> lock(connectedAnimatedNodesMutex_);
      connectedAnimatedNodes_.erase(viewTag);
    }
    updatedNodeTags_.insert(node->tag());
  } else {
    LOG(WARNING)
        << "Cannot DisconnectAnimatedNodeToView, animated node has to be props type";
  }
}

void NativeAnimatedNodesManager::disconnectAnimatedNodes(
    Tag parentTag,
    Tag childTag) noexcept {
  react_native_assert(parentTag);
  react_native_assert(childTag);

  auto parentNode = getAnimatedNode<AnimatedNode>(parentTag);
  auto childNode = getAnimatedNode<AnimatedNode>(childTag);

  if ((parentNode != nullptr) && (childNode != nullptr)) {
    parentNode->removeChild(childTag);
  } else {
    LOG(WARNING) << "Cannot DisconnectAnimatedNodes, parentTag = " << parentTag
                 << ", childTag = " << childTag
                 << ", not all of them are created";
  }
}

void NativeAnimatedNodesManager::restoreDefaultValues(Tag tag) noexcept {
  if (auto propsNode = getAnimatedNode<PropsAnimatedNode>(tag)) {
    propsNode->restoreDefaultValues();
  }
}

void NativeAnimatedNodesManager::dropAnimatedNode(Tag tag) noexcept {
  std::lock_guard<std::mutex> lock(connectedAnimatedNodesMutex_);
  animatedNodes_.erase(tag);
}

#pragma mark - Mutations

void NativeAnimatedNodesManager::setAnimatedNodeValue(Tag tag, double value) {
  if (auto node = getAnimatedNode<ValueAnimatedNode>(tag)) {
    stopAnimationsForNode(node->tag());
    if (node->setRawValue(value)) {
      updatedNodeTags_.insert(node->tag());
    }
  }
}

void NativeAnimatedNodesManager::setAnimatedNodeOffset(Tag tag, double offset) {
  if (auto node = getAnimatedNode<ValueAnimatedNode>(tag)) {
    if (node->setOffset(offset)) {
      updatedNodeTags_.insert(node->tag());
    }
  }
}

void NativeAnimatedNodesManager::flattenAnimatedNodeOffset(Tag tag) {
  if (auto node = getAnimatedNode<ValueAnimatedNode>(tag)) {
    node->flattenOffset();
  }
}

void NativeAnimatedNodesManager::extractAnimatedNodeOffsetOp(Tag tag) {
  if (auto node = getAnimatedNode<ValueAnimatedNode>(tag)) {
    node->extractOffset();
  }
}

void NativeAnimatedNodesManager::stopAnimationsForNode(Tag nodeTag) {
  std::vector<int> discardedAnimIds{};

  for (const auto& [animationId, driver] : activeAnimations_) {
    if (driver->getAnimatedValueTag() == nodeTag) {
      discardedAnimIds.emplace_back(animationId);
    }
  }
  for (const auto& id : discardedAnimIds) {
    activeAnimations_.at(id)->stopAnimation();
    activeAnimations_.erase(id);
  }
}

#pragma mark - Drivers

void NativeAnimatedNodesManager::startAnimatingNode(
    int animationId,
    Tag animatedNodeTag,
    folly::dynamic config,
    std::optional<AnimationEndCallback> endCallback) noexcept {
  if (auto iter = activeAnimations_.find(animationId);
      iter != activeAnimations_.end()) {
    // reset animation config
    auto& animation = iter->second;
    animation->updateConfig(config);
  } else if (animatedNodes_.contains(animatedNodeTag)) {
    auto type = config["type"].asString();
    auto typeEnum = AnimationDriver::getDriverTypeByName(type);
    std::unique_ptr<AnimationDriver> animation = nullptr;
    if (typeEnum) {
      switch (typeEnum.value()) {
        case AnimationDriverType::Frames: {
          animation = std::make_unique<FrameAnimationDriver>(
              animationId,
              animatedNodeTag,
              std::move(endCallback),
              std::move(config),
              this);
        } break;
        case AnimationDriverType::Spring: {
          animation = std::make_unique<SpringAnimationDriver>(
              animationId,
              animatedNodeTag,
              std::move(endCallback),
              std::move(config),
              this);
        } break;
        case AnimationDriverType::Decay: {
          animation = std::make_unique<DecayAnimationDriver>(
              animationId,
              animatedNodeTag,
              std::move(endCallback),
              std::move(config),
              this);
        } break;
      }
      if (animation) {
        animation->startAnimation();
        activeAnimations_.insert({animationId, std::move(animation)});
      }
    } else {
      LOG(ERROR) << "Unknown AnimationDriver type " << type;
    }
  }
}

void NativeAnimatedNodesManager::stopAnimation(
    int animationId,
    bool /*isTrackingAnimation*/) noexcept {
  if (auto iter = activeAnimations_.find(animationId);
      iter != activeAnimations_.end()) {
    iter->second->stopAnimation();
    activeAnimations_.erase(iter);
  }
}

void NativeAnimatedNodesManager::addAnimatedEventToView(
    Tag viewTag,
    const std::string& eventName,
    const folly::dynamic& eventMapping) noexcept {
  const auto animatedValueTag = (eventMapping.count("animatedValueTag") != 0u)
      ? static_cast<Tag>(eventMapping["animatedValueTag"].asInt())
      : 0;
  const auto& pathList = eventMapping["nativeEventPath"];
  auto numPaths = pathList.size();
  std::vector<std::string> eventPath(numPaths);
  for (size_t i = 0; i < numPaths; i++) {
    eventPath[i] = pathList[i].asString();
  }

  const auto key = EventAnimationDriverKey{
      .viewTag = viewTag,
      .eventName = EventEmitter::normalizeEventType(eventName)};
  if (auto driversIter = eventDrivers_.find(key);
      driversIter != eventDrivers_.end()) {
    auto& drivers = driversIter->second;
    drivers.emplace_back(
        std::make_unique<EventAnimationDriver>(eventPath, animatedValueTag));
  } else {
    std::vector<std::unique_ptr<EventAnimationDriver>> drivers(1);
    drivers[0] =
        std::make_unique<EventAnimationDriver>(eventPath, animatedValueTag);
    eventDrivers_.insert({key, std::move(drivers)});
  }
}

void NativeAnimatedNodesManager::removeAnimatedEventFromView(
    Tag viewTag,
    const std::string& eventName,
    Tag animatedValueTag) noexcept {
  const auto key = EventAnimationDriverKey{
      .viewTag = viewTag,
      .eventName = EventEmitter::normalizeEventType(eventName)};
  auto driversIter = eventDrivers_.find(key);
  if (driversIter != eventDrivers_.end()) {
    auto& drivers = driversIter->second;
    std::erase_if(drivers, [animatedValueTag](auto& it) {
      return it->getAnimatedNodeTag() == animatedValueTag;
    });
  }
}

static thread_local bool isOnRenderThread_{false};

void NativeAnimatedNodesManager::handleAnimatedEvent(
    Tag viewTag,
    const std::string& eventName,
    const EventPayload& eventPayload) noexcept {
  // We currently reject events that are not on the same thread as `onRender`
  // callbacks, as the assumption is these events can synchronously update
  // UI components or otherwise Animated nodes with single-threaded assumptions.
  // While we could dispatch event handling back to the UI thread using the
  // scheduleOnUI helper, we are not yet doing that because it would violate
  // the assumption that the events have synchronous side-effects. We can
  // revisit this decision later.
  if (!isOnRenderThread_) {
    return;
  }

  if (!eventDrivers_.empty()) {
    bool foundAtLeastOneDriver = false;

    const auto key = EventAnimationDriverKey{
        .viewTag = viewTag,
        .eventName = EventEmitter::normalizeEventType(eventName)};
    if (auto driversIter = eventDrivers_.find(key);
        driversIter != eventDrivers_.end()) {
      auto& drivers = driversIter->second;
      if (!drivers.empty()) {
        foundAtLeastOneDriver = true;
      }
      for (const auto& driver : drivers) {
        if (auto value = driver->getValueFromPayload(eventPayload)) {
          auto node =
              getAnimatedNode<ValueAnimatedNode>(driver->getAnimatedNodeTag());
          stopAnimationsForNode(node->tag());
          if (node->setRawValue(value.value())) {
            updatedNodeTags_.insert(node->tag());
          }
        }
      }
    }

    if (foundAtLeastOneDriver && !isEventAnimationInProgress_) {
      // There is an animation driver handling this event and
      // event driven animation has not been started yet.
      isEventAnimationInProgress_ = true;
      // Some platforms (e.g. iOS) have UI tick listener disable
      // when there are no active animations. Calling
      // `startRenderCallbackIfNeeded` will call platform specific code to
      // register UI tick listener.
      startRenderCallbackIfNeeded();
      // Calling startOnRenderCallback_ will register a UI tick listener.
      // The UI ticker listener will not be called until the next frame.
      // That's why, in case this is called from the UI thread, we need to
      // proactivelly trigger the animation loop to avoid showing stale
      // frames.
      onRender();
    }
  }
}

std::shared_ptr<EventEmitterListener>
NativeAnimatedNodesManager::ensureEventEmitterListener() noexcept {
  if (!eventEmitterListener_) {
    eventEmitterListener_ = std::make_shared<EventEmitterListener>(
        [this](
            Tag tag,
            const std::string& eventName,
            const EventPayload& payload) -> bool {
          handleAnimatedEvent(tag, eventName, payload);
          return false;
        });
  }
  return eventEmitterListener_;
}

void NativeAnimatedNodesManager::startRenderCallbackIfNeeded() {
  if (startOnRenderCallback_) {
    startOnRenderCallback_([this]() { onRender(); });
  }
}

void NativeAnimatedNodesManager::stopRenderCallbackIfNeeded() noexcept {
  if (stopOnRenderCallback_) {
    stopOnRenderCallback_();
  }
}

bool NativeAnimatedNodesManager::isAnimationUpdateNeeded() const noexcept {
  return !activeAnimations_.empty() || !updatedNodeTags_.empty() ||
      isEventAnimationInProgress_;
}

void NativeAnimatedNodesManager::updateNodes(
    const std::set<int>& finishedAnimationValueNodes) noexcept {
  auto nodesQueue = std::deque<NodesQueueItem>{};

  const auto is_node_connected_to_finished_animation =
      [&finishedAnimationValueNodes](
          AnimatedNode* node,
          int nodeTag,
          bool parentFinishedAnimation) -> bool {
    return parentFinishedAnimation ||
        (node->type() == AnimatedNodeType::Value &&
         finishedAnimationValueNodes.contains(nodeTag));
  };

#ifdef REACT_NATIVE_DEBUG
  int activeNodesCount = 0;
  int updatedNodesCount = 0;
#endif

  // STEP 1.
  // BFS over graph of nodes. Update `mIncomingNodes` attribute for each node
  // during that BFS. Store number of visited nodes in `activeNodesCount`. We
  // "execute" active animations as a part of this step.

  animatedGraphBFSColor_++;
  if (animatedGraphBFSColor_ == AnimatedNode::INITIAL_BFS_COLOR) {
    animatedGraphBFSColor_++;
  }

  for (const auto& nodeTag : updatedNodeTags_) {
    if (auto node = getAnimatedNode<AnimatedNode>(nodeTag)) {
      if (node->bfsColor != animatedGraphBFSColor_) {
        node->bfsColor = animatedGraphBFSColor_;
#ifdef REACT_NATIVE_DEBUG
        activeNodesCount++;
#endif
        const auto connectedToFinishedAnimation =
            is_node_connected_to_finished_animation(node, nodeTag, false);
        nodesQueue.emplace_back(NodesQueueItem{
            .node = node,
            .connectedToFinishedAnimation = connectedToFinishedAnimation});
      }
    }
  }

  while (!nodesQueue.empty()) {
    auto nextNode = nodesQueue.front();
    nodesQueue.pop_front();
    // in Animated, value nodes like RGBA are parents and Color node is child
    // (the opposite of tree structure)
    for (const auto childTag : nextNode.node->getChildren()) {
      auto child = getAnimatedNode<AnimatedNode>(childTag);
      child->activeIncomingNodes++;
      if (child->bfsColor != animatedGraphBFSColor_) {
        child->bfsColor = animatedGraphBFSColor_;
#ifdef REACT_NATIVE_DEBUG
        activeNodesCount++;
#endif
        const auto connectedToFinishedAnimation =
            is_node_connected_to_finished_animation(
                child, childTag, nextNode.connectedToFinishedAnimation);
        nodesQueue.emplace_back(NodesQueueItem{
            .node = child,
            .connectedToFinishedAnimation = connectedToFinishedAnimation});
      }
    }
  }

  // STEP 2
  // BFS over the graph of active nodes in topological order -> visit node only
  // when all its "predecessors" in the graph have already been visited. It is
  // important to visit nodes in that order as they may often use values of
  // their predecessors in order to calculate "next state" of their own. We
  // start by determining the starting set of nodes by looking for nodes with
  // `activeIncomingNodes = 0` (those can only be the ones that we start BFS in
  // the previous step). We store number of visited nodes in this step in
  // `updatedNodesCount`

  animatedGraphBFSColor_++;
  if (animatedGraphBFSColor_ == AnimatedNode::INITIAL_BFS_COLOR) {
    animatedGraphBFSColor_++;
  }

  for (const auto& nodeTag : updatedNodeTags_) {
    if (auto node = getAnimatedNode<AnimatedNode>(nodeTag)) {
      if (node->activeIncomingNodes == 0 &&
          node->bfsColor != animatedGraphBFSColor_) {
        node->bfsColor = animatedGraphBFSColor_;
#ifdef REACT_NATIVE_DEBUG
        updatedNodesCount++;
#endif
        const auto connectedToFinishedAnimation =
            is_node_connected_to_finished_animation(node, nodeTag, false);
        nodesQueue.emplace_back(NodesQueueItem{
            .node = node,
            .connectedToFinishedAnimation = connectedToFinishedAnimation});
      }
    }
  }

// Run main "update" loop
#ifdef REACT_NATIVE_DEBUG
  int cyclesDetected = 0;
#endif
  while (!nodesQueue.empty()) {
    auto nextNode = nodesQueue.front();
    nodesQueue.pop_front();
    if (nextNode.connectedToFinishedAnimation &&
        nextNode.node->type() == AnimatedNodeType::Props) {
      if (auto propsNode = dynamic_cast<PropsAnimatedNode*>(nextNode.node)) {
        propsNode->update(/*forceFabricCommit*/ true);
      };
    } else {
      nextNode.node->update();
    }

    for (auto childTag : nextNode.node->getChildren()) {
      auto child = getAnimatedNode<AnimatedNode>(childTag);
      child->activeIncomingNodes--;
      if (child->activeIncomingNodes == 0 && child->activeIncomingNodes == 0) {
        child->bfsColor = animatedGraphBFSColor_;
#ifdef REACT_NATIVE_DEBUG
        updatedNodesCount++;
#endif
        const auto connectedToFinishedAnimation =
            is_node_connected_to_finished_animation(
                child, childTag, nextNode.connectedToFinishedAnimation);
        nodesQueue.emplace_back(NodesQueueItem{
            .node = child,
            .connectedToFinishedAnimation = connectedToFinishedAnimation});
      }
#ifdef REACT_NATIVE_DEBUG
      else if (child->bfsColor == animatedGraphBFSColor_) {
        cyclesDetected++;
      }
#endif
    }
  }

#ifdef REACT_NATIVE_DEBUG
  // Verify that we've visited *all* active nodes. Throw otherwise as this could
  // mean there is a cycle in animated node graph, or that the graph is only
  // partially set up. We also take advantage of the fact that all active nodes
  // are visited in the step above so that all the nodes properties
  // `activeIncomingNodes` are set to zero. In Fabric there can be race
  // conditions between the JS thread setting up or tearing down animated nodes,
  // and Fabric executing them on the UI thread, leading to temporary
  // inconsistent states.
  if (activeNodesCount != updatedNodesCount) {
    if (warnedAboutGraphTraversal_) {
      return;
    }
    warnedAboutGraphTraversal_ = true;
    auto reason = cyclesDetected > 0
        ? ("cycles (" + std::to_string(cyclesDetected) + ")")
        : "disconnected regions";
    LOG(ERROR) << "Detected animation cycle or disconnected graph. "
               << "Looks like animated nodes graph has " << reason
               << ", there are " << activeNodesCount
               << " but toposort visited only " << updatedNodesCount;
  } else {
    warnedAboutGraphTraversal_ = false;
  }
#endif

  updatedNodeTags_.clear();
}

bool NativeAnimatedNodesManager::onAnimationFrame(double timestamp) {
  // Run all active animations
  auto hasFinishedAnimations = false;
  std::set<int> finishedAnimationValueNodes;
  for (const auto& [_id, driver] : activeAnimations_) {
    driver->runAnimationStep(timestamp);

    if (driver->getIsComplete()) {
      hasFinishedAnimations = true;
      if (ReactNativeFeatureFlags::cxxNativeAnimatedRemoveJsSync()) {
        finishedAnimationValueNodes.insert(driver->getAnimatedValueTag());
      }
    }
  }

  // Update all animated nodes
  updateNodes(finishedAnimationValueNodes);

  // remove finished animations
  if (hasFinishedAnimations) {
    std::vector<int> finishedAnimations;
    for (const auto& [animationId, driver] : activeAnimations_) {
      if (driver->getIsComplete()) {
        if (getAnimatedNode<ValueAnimatedNode>(driver->getAnimatedValueTag()) !=
            nullptr) {
          driver->stopAnimation();
        }
        finishedAnimations.emplace_back(animationId);
      }
    }
    for (const auto& id : finishedAnimations) {
      activeAnimations_.erase(id);
    }
  }

  return commitProps();
}

folly::dynamic NativeAnimatedNodesManager::managedProps(Tag tag) noexcept {
  std::lock_guard<std::mutex> lock(connectedAnimatedNodesMutex_);
  const auto iter = connectedAnimatedNodes_.find(tag);
  if (iter != connectedAnimatedNodes_.end()) {
    if (const auto node = getAnimatedNode<PropsAnimatedNode>(iter->second)) {
      return node->props();
    }
  }

  return nullptr;
}

bool NativeAnimatedNodesManager::isOnRenderThread() const noexcept {
  return isOnRenderThread_;
}

#pragma mark - Listeners

void NativeAnimatedNodesManager::startListeningToAnimatedNodeValue(
    Tag tag,
    ValueListenerCallback&& callback) noexcept {
  if (auto iter = animatedNodes_.find(tag); iter != animatedNodes_.end() &&
      iter->second->type() == AnimatedNodeType::Value) {
    static_cast<ValueAnimatedNode*>(iter->second.get())
        ->setValueListener(std::move(callback));
  } else {
    LOG(ERROR) << "startListeningToAnimatedNodeValue: Animated node [" << tag
               << "] does not exist, or is not a 'value' node";
  }
}

void NativeAnimatedNodesManager::stopListeningToAnimatedNodeValue(
    Tag tag) noexcept {
  if (auto iter = animatedNodes_.find(tag); iter != animatedNodes_.end() &&
      iter->second->type() == AnimatedNodeType::Value) {
    static_cast<ValueAnimatedNode*>(iter->second.get())
        ->setValueListener(nullptr);
  } else {
    LOG(ERROR) << "stopListeningToAnimatedNodeValue: Animated node [" << tag
               << "] does not exist, or is not a 'value' node";
  }
}

void NativeAnimatedNodesManager::schedulePropsCommit(
    Tag viewTag,
    const folly::dynamic& props,
    bool layoutStyleUpdated,
    bool forceFabricCommit) noexcept {
  // When fabricCommitCallback_ & directManipulationCallback_ are both
  // available, we commit layout props via Fabric and the other using direct
  // manipulation; if only one is available, we commit all props using that
  if (fabricCommitCallback_ != nullptr &&
      (layoutStyleUpdated || forceFabricCommit ||
       directManipulationCallback_ == nullptr)) {
    mergeObjects(updateViewProps_[viewTag], props);
  } else if (directManipulationCallback_ != nullptr) {
    mergeObjects(updateViewPropsDirect_[viewTag], props);
  }
}

void NativeAnimatedNodesManager::onRender() {
  TRACE_EVENT("rncxx", "NativeAnimatedNodesManager::onRender");
  TRACE_COUNTER("rncxx", "numActiveAnimations", activeAnimations_.size());

  isOnRenderThread_ = true;

  // Run operations scheduled from AnimatedModule
  std::vector<UiTask> operations;
  {
    std::lock_guard<std::mutex> lock(uiTasksMutex_);
    std::swap(operations_, operations);
  }

  for (auto& task : operations) {
    task();
  }

  // Step through the animation loop
  if (isAnimationUpdateNeeded()) {
    auto microseconds = std::chrono::duration_cast<std::chrono::microseconds>(
                            g_now().time_since_epoch())
                            .count();

    auto timestamp = static_cast<double>(microseconds) / 1000.0;
    auto containsChange = onAnimationFrame(timestamp);

    if (!containsChange) {
      // The last animation tick didn't result in any changes to the UI.
      // It is safe to assume any event animation that was in progress has
      // completed.

      // Step 1: gather all animations driven by events.
      std::set<int> finishedAnimationValueNodes;
      for (auto& [key, drivers] : eventDrivers_) {
        for (auto& driver : drivers) {
          finishedAnimationValueNodes.insert(driver->getAnimatedNodeTag());
          if (auto node = getAnimatedNode<ValueAnimatedNode>(
                  driver->getAnimatedNodeTag())) {
            updatedNodeTags_.insert(node->tag());
          }
        }
      }

      // Step 2: update all nodes that are connected to the finished animations.
      updateNodes(finishedAnimationValueNodes);

      isEventAnimationInProgress_ = false;

      // Step 3: commit the changes to the UI.
      commitProps();
    }
  } else {
    // There is no active animation. Stop the render callback.
    stopRenderCallbackIfNeeded();
  }
}

bool NativeAnimatedNodesManager::commitProps() {
  bool containsChange =
      !updateViewProps_.empty() || !updateViewPropsDirect_.empty();

  if (fabricCommitCallback_ != nullptr) {
    if (!updateViewProps_.empty()) {
      // Must call direct manipulation to set final values on components.
      if (directManipulationCallback_ != nullptr) {
        for (const auto& [viewTag, props] : updateViewProps_) {
          directManipulationCallback_(viewTag, folly::dynamic(props));
        }
      }
      fabricCommitCallback_(updateViewProps_);
      updateViewProps_.clear();
    }
  } else {
    LOG(ERROR)
        << "Failed to commit native animation, since Fabric commit callback is not set";
  }

  if (directManipulationCallback_ != nullptr) {
    for (const auto& [viewTag, props] : updateViewPropsDirect_) {
      directManipulationCallback_(viewTag, folly::dynamic(props));
    }
    updateViewPropsDirect_.clear();
  } else {
    LOG(ERROR)
        << "Failed to commit native animation, since direct manipulation callback is not set";
  }

  return containsChange;
}

} // namespace facebook::react
