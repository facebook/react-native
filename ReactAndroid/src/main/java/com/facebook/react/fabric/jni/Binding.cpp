/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Binding.h"
#include "AsyncEventBeat.h"
#include "EventEmitterWrapper.h"
#include "ReactNativeConfigHolder.h"
#include "StateWrapperImpl.h"

#import <better/set.h>
#include <fbjni/fbjni.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/animations/LayoutAnimationDriver.h>
#include <react/componentregistry/ComponentDescriptorFactory.h>
#include <react/components/scrollview/ScrollViewProps.h>
#include <react/core/EventBeat.h>
#include <react/core/EventEmitter.h>
#include <react/core/conversions.h>
#include <react/debug/SystraceSection.h>
#include <react/scheduler/Scheduler.h>
#include <react/scheduler/SchedulerDelegate.h>
#include <react/scheduler/SchedulerToolbox.h>
#include <react/uimanager/primitives.h>
#include <react/utils/ContextContainer.h>

#include <Glog/logging.h>

using namespace facebook::jni;
using namespace facebook::jsi;

namespace facebook {
namespace react {

namespace {

struct JMountItem : public JavaClass<JMountItem> {
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/fabric/mounting/mountitems/MountItem;";
};

struct RemoveDeleteMetadata {
  Tag tag;
  Tag parentTag;
  int index;
  bool shouldRemove;
  bool shouldDelete;
};

} // namespace

jni::local_ref<Binding::jhybriddata> Binding::initHybrid(
    jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

// Thread-safe getter
jni::global_ref<jobject> Binding::getJavaUIManager() {
  std::lock_guard<std::mutex> uiManagerLock(javaUIManagerMutex_);
  return javaUIManager_;
}

// Thread-safe getter
std::shared_ptr<Scheduler> Binding::getScheduler() {
  std::lock_guard<std::mutex> lock(schedulerMutex_);
  return scheduler_;
}

void Binding::startSurface(
    jint surfaceId,
    jni::alias_ref<jstring> moduleName,
    NativeMap *initialProps) {
  SystraceSection s("FabricUIManagerBinding::startSurface");

  std::shared_ptr<Scheduler> scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::startSurface: scheduler disappeared";
    return;
  }

  LayoutContext context;
  context.pointScaleFactor = pointScaleFactor_;
  scheduler->startSurface(
      surfaceId,
      moduleName->toStdString(),
      initialProps->consume(),
      {},
      context,
      animationDriver_);
}

void Binding::startSurfaceWithConstraints(
    jint surfaceId,
    jni::alias_ref<jstring> moduleName,
    NativeMap *initialProps,
    jfloat minWidth,
    jfloat maxWidth,
    jfloat minHeight,
    jfloat maxHeight,
    jboolean isRTL,
    jboolean doLeftAndRightSwapInRTL) {
  SystraceSection s("FabricUIManagerBinding::startSurfaceWithConstraints");

  if (enableFabricLogs_) {
    LOG(WARNING)
        << "Binding::startSurfaceWithConstraints() was called (address: "
        << this << ", surfaceId: " << surfaceId << ").";
  }

  std::shared_ptr<Scheduler> scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::startSurfaceWithConstraints: scheduler disappeared";
    return;
  }

  auto minimumSize =
      Size{minWidth / pointScaleFactor_, minHeight / pointScaleFactor_};
  auto maximumSize =
      Size{maxWidth / pointScaleFactor_, maxHeight / pointScaleFactor_};

  LayoutContext context;
  context.pointScaleFactor = {pointScaleFactor_};
  context.swapLeftAndRightInRTL = doLeftAndRightSwapInRTL;
  LayoutConstraints constraints = {};
  constraints.minimumSize = minimumSize;
  constraints.maximumSize = maximumSize;
  constraints.layoutDirection =
      isRTL ? LayoutDirection::RightToLeft : LayoutDirection::LeftToRight;

  scheduler->startSurface(
      surfaceId,
      moduleName->toStdString(),
      initialProps->consume(),
      constraints,
      context,
      animationDriver_);
}

void Binding::renderTemplateToSurface(jint surfaceId, jstring uiTemplate) {
  SystraceSection s("FabricUIManagerBinding::renderTemplateToSurface");

  std::shared_ptr<Scheduler> scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::renderTemplateToSurface: scheduler disappeared";
    return;
  }

  auto env = Environment::current();
  const char *nativeString = env->GetStringUTFChars(uiTemplate, JNI_FALSE);
  scheduler->renderTemplateToSurface(surfaceId, nativeString);
  env->ReleaseStringUTFChars(uiTemplate, nativeString);
}

void Binding::stopSurface(jint surfaceId) {
  SystraceSection s("FabricUIManagerBinding::stopSurface");

  if (enableFabricLogs_) {
    LOG(WARNING) << "Binding::stopSurface() was called (address: " << this
                 << ", surfaceId: " << surfaceId << ").";
  }

  std::shared_ptr<Scheduler> scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::stopSurface: scheduler disappeared";
    return;
  }

  scheduler->stopSurface(surfaceId);
}

void Binding::setConstraints(
    jint surfaceId,
    jfloat minWidth,
    jfloat maxWidth,
    jfloat minHeight,
    jfloat maxHeight,
    jboolean isRTL,
    jboolean doLeftAndRightSwapInRTL) {
  SystraceSection s("FabricUIManagerBinding::setConstraints");

  std::shared_ptr<Scheduler> scheduler = getScheduler();
  if (!scheduler) {
    LOG(ERROR) << "Binding::setConstraints: scheduler disappeared";
    return;
  }

  auto minimumSize =
      Size{minWidth / pointScaleFactor_, minHeight / pointScaleFactor_};
  auto maximumSize =
      Size{maxWidth / pointScaleFactor_, maxHeight / pointScaleFactor_};

  LayoutContext context;
  context.pointScaleFactor = {pointScaleFactor_};
  context.swapLeftAndRightInRTL = doLeftAndRightSwapInRTL;
  LayoutConstraints constraints = {};
  constraints.minimumSize = minimumSize;
  constraints.maximumSize = maximumSize;
  constraints.layoutDirection =
      isRTL ? LayoutDirection::RightToLeft : LayoutDirection::LeftToRight;

  scheduler->constraintSurfaceLayout(surfaceId, constraints, context);
}

void Binding::installFabricUIManager(
    jlong jsContextNativePointer,
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutorHolder,
    jni::alias_ref<jobject> javaUIManager,
    EventBeatManager *eventBeatManager,
    jni::alias_ref<JavaMessageQueueThread::javaobject> jsMessageQueueThread,
    ComponentFactoryDelegate *componentsRegistry,
    jni::alias_ref<jobject> reactNativeConfig) {
  SystraceSection s("FabricUIManagerBinding::installFabricUIManager");

  std::shared_ptr<const ReactNativeConfig> config =
      std::make_shared<const ReactNativeConfigHolder>(reactNativeConfig);

  enableFabricLogs_ =
      config->getBool("react_fabric:enabled_android_fabric_logs");

  if (enableFabricLogs_) {
    LOG(WARNING) << "Binding::installFabricUIManager() was called (address: "
                 << this << ").";
  }

  // Use std::lock and std::adopt_lock to prevent deadlocks by locking mutexes
  // at the same time
  std::lock(schedulerMutex_, javaUIManagerMutex_);
  std::lock_guard<std::mutex> schedulerLock(schedulerMutex_, std::adopt_lock);
  std::lock_guard<std::mutex> uiManagerLock(
      javaUIManagerMutex_, std::adopt_lock);

  javaUIManager_ = make_global(javaUIManager);

  ContextContainer::Shared contextContainer =
      std::make_shared<ContextContainer>();

  auto sharedJSMessageQueueThread =
      std::make_shared<JMessageQueueThread>(jsMessageQueueThread);

  bool useRuntimeExecutor =
      config->getBool("react_fabric:use_shared_runtime_executor_android");

  RuntimeExecutor runtimeExecutor;
  if (useRuntimeExecutor) {
    runtimeExecutor = runtimeExecutorHolder->cthis()->get();
  } else {
    Runtime *runtime = (Runtime *)jsContextNativePointer;
    runtimeExecutor =
        [runtime, sharedJSMessageQueueThread](
            std::function<void(facebook::jsi::Runtime & runtime)> &&callback) {
          sharedJSMessageQueueThread->runOnQueue(
              [runtime, callback = std::move(callback)]() {
                callback(*runtime);
              });
        };
  }

  // TODO: T31905686 Create synchronous Event Beat
  jni::global_ref<jobject> localJavaUIManager = javaUIManager_;
  EventBeat::Factory synchronousBeatFactory =
      [eventBeatManager, runtimeExecutor, localJavaUIManager](
          EventBeat::SharedOwnerBox const &ownerBox) {
        return std::make_unique<AsyncEventBeat>(
            ownerBox, eventBeatManager, runtimeExecutor, localJavaUIManager);
      };

  EventBeat::Factory asynchronousBeatFactory =
      [eventBeatManager, runtimeExecutor, localJavaUIManager](
          EventBeat::SharedOwnerBox const &ownerBox) {
        return std::make_unique<AsyncEventBeat>(
            ownerBox, eventBeatManager, runtimeExecutor, localJavaUIManager);
      };

  contextContainer->insert("ReactNativeConfig", config);
  contextContainer->insert("FabricUIManager", javaUIManager_);

  // Keep reference to config object and cache some feature flags here
  reactNativeConfig_ = config;
  shouldCollateRemovesAndDeletes_ = reactNativeConfig_->getBool(
      "react_fabric:enable_removedelete_collation_android");
  collapseDeleteCreateMountingInstructions_ = reactNativeConfig_->getBool(
      "react_fabric:enabled_collapse_delete_create_mounting_instructions");

  disablePreallocateViews_ = reactNativeConfig_->getBool(
      "react_fabric:disabled_view_preallocation_android");

  bool enableLayoutAnimations = reactNativeConfig_->getBool(
      "react_fabric:enabled_layout_animations_android");

  auto toolbox = SchedulerToolbox{};
  toolbox.contextContainer = contextContainer;
  toolbox.componentRegistryFactory = componentsRegistry->buildRegistryFunction;
  toolbox.runtimeExecutor = runtimeExecutor;
  toolbox.synchronousEventBeatFactory = synchronousBeatFactory;
  toolbox.asynchronousEventBeatFactory = asynchronousBeatFactory;

  if (enableLayoutAnimations) {
    animationDriver_ = std::make_shared<LayoutAnimationDriver>(this);
  }
  scheduler_ = std::make_shared<Scheduler>(
      toolbox, (animationDriver_ ? animationDriver_.get() : nullptr), this);
}

void Binding::uninstallFabricUIManager() {
  if (enableFabricLogs_) {
    LOG(WARNING) << "Binding::uninstallFabricUIManager() was called (address: "
                 << this << ").";
  }
  // Use std::lock and std::adopt_lock to prevent deadlocks by locking mutexes
  // at the same time
  std::lock(schedulerMutex_, javaUIManagerMutex_);
  std::lock_guard<std::mutex> schedulerLock(schedulerMutex_, std::adopt_lock);
  std::lock_guard<std::mutex> uiManagerLock(
      javaUIManagerMutex_, std::adopt_lock);

  animationDriver_ = nullptr;
  scheduler_ = nullptr;
  javaUIManager_ = nullptr;
  reactNativeConfig_ = nullptr;
}

inline local_ref<ReadableMap::javaobject> castReadableMap(
    local_ref<ReadableNativeMap::javaobject> nativeMap) {
  return make_local(reinterpret_cast<ReadableMap::javaobject>(nativeMap.get()));
}

inline local_ref<ReadableArray::javaobject> castReadableArray(
    local_ref<ReadableNativeArray::javaobject> nativeArray) {
  return make_local(
      reinterpret_cast<ReadableArray::javaobject>(nativeArray.get()));
}

// TODO: this method will be removed when binding for components are code-gen
local_ref<JString> getPlatformComponentName(const ShadowView &shadowView) {
  local_ref<JString> componentName;
  auto newViewProps =
      std::dynamic_pointer_cast<const ScrollViewProps>(shadowView.props);

  if (newViewProps &&
      newViewProps->getProbablyMoreHorizontalThanVertical_DEPRECATED()) {
    componentName = make_jstring("AndroidHorizontalScrollView");
  } else {
    componentName = make_jstring(shadowView.componentName);
  }
  return componentName;
}

local_ref<JMountItem::javaobject> createUpdateEventEmitterMountItem(
    const jni::global_ref<jobject> &javaUIManager,
    const ShadowViewMutation &mutation) {
  if (!mutation.newChildShadowView.eventEmitter) {
    return nullptr;
  }
  SharedEventEmitter eventEmitter = mutation.newChildShadowView.eventEmitter;

  // Do not hold a reference to javaEventEmitter from the C++ side.
  auto javaEventEmitter = EventEmitterWrapper::newObjectJavaArgs();
  EventEmitterWrapper *cEventEmitter = cthis(javaEventEmitter);
  cEventEmitter->eventEmitter = eventEmitter;

  static auto updateEventEmitterInstruction =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jint, jobject)>(
              "updateEventEmitterMountItem");

  return updateEventEmitterInstruction(
      javaUIManager, mutation.newChildShadowView.tag, javaEventEmitter.get());
}

local_ref<JMountItem::javaobject> createUpdatePropsMountItem(
    const jni::global_ref<jobject> &javaUIManager,
    const ShadowViewMutation &mutation) {
  auto shadowView = mutation.newChildShadowView;
  auto newViewProps =
      *std::dynamic_pointer_cast<const ViewProps>(shadowView.props);

  // TODO: move props from map to a typed object.
  auto newProps = shadowView.props->rawProps;

  local_ref<ReadableMap::javaobject> readableMap =
      castReadableMap(ReadableNativeMap::newObjectCxxArgs(newProps));
  static auto updatePropsInstruction =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jint, ReadableMap::javaobject)>(
              "updatePropsMountItem");

  return updatePropsInstruction(
      javaUIManager, mutation.newChildShadowView.tag, readableMap.get());
}

local_ref<JMountItem::javaobject> createUpdateLayoutMountItem(
    const jni::global_ref<jobject> &javaUIManager,
    const ShadowViewMutation &mutation) {
  auto oldChildShadowView = mutation.oldChildShadowView;
  auto newChildShadowView = mutation.newChildShadowView;

  if (newChildShadowView.layoutMetrics != EmptyLayoutMetrics &&
      oldChildShadowView.layoutMetrics != newChildShadowView.layoutMetrics) {
    static auto updateLayoutInstruction =
        jni::findClassStatic(Binding::UIManagerJavaDescriptor)
            ->getMethod<alias_ref<JMountItem>(
                jint, jint, jint, jint, jint, jint)>("updateLayoutMountItem");
    auto layoutMetrics = newChildShadowView.layoutMetrics;
    auto pointScaleFactor = layoutMetrics.pointScaleFactor;
    auto frame = layoutMetrics.frame;

    int x = round(frame.origin.x * pointScaleFactor);
    int y = round(frame.origin.y * pointScaleFactor);
    int w = round(frame.size.width * pointScaleFactor);
    int h = round(frame.size.height * pointScaleFactor);
    auto layoutDirection =
        toInt(newChildShadowView.layoutMetrics.layoutDirection);
    return updateLayoutInstruction(
        javaUIManager, newChildShadowView.tag, x, y, w, h, layoutDirection);
  }

  return nullptr;
}

local_ref<JMountItem::javaobject> createUpdatePaddingMountItem(
    const jni::global_ref<jobject> &javaUIManager,
    const ShadowViewMutation &mutation) {
  auto oldChildShadowView = mutation.oldChildShadowView;
  auto newChildShadowView = mutation.newChildShadowView;

  if (oldChildShadowView.layoutMetrics.contentInsets ==
      newChildShadowView.layoutMetrics.contentInsets) {
    return nullptr;
  }

  static auto updateLayoutInstruction =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jint, jint, jint, jint, jint)>(
              "updatePaddingMountItem");

  auto layoutMetrics = newChildShadowView.layoutMetrics;
  auto pointScaleFactor = layoutMetrics.pointScaleFactor;
  auto contentInsets = layoutMetrics.contentInsets;

  int left = round(contentInsets.left * pointScaleFactor);
  int top = round(contentInsets.top * pointScaleFactor);
  int right = round(contentInsets.right * pointScaleFactor);
  int bottom = round(contentInsets.bottom * pointScaleFactor);

  return updateLayoutInstruction(
      javaUIManager, newChildShadowView.tag, left, top, right, bottom);
}

local_ref<JMountItem::javaobject> createInsertMountItem(
    const jni::global_ref<jobject> &javaUIManager,
    const ShadowViewMutation &mutation) {
  static auto insertInstruction =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jint, jint, jint)>(
              "insertMountItem");

  return insertInstruction(
      javaUIManager,
      mutation.newChildShadowView.tag,
      mutation.parentShadowView.tag,
      mutation.index);
}

local_ref<JMountItem::javaobject> createUpdateStateMountItem(
    const jni::global_ref<jobject> &javaUIManager,
    const ShadowViewMutation &mutation) {
  static auto updateStateInstruction =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jint, jobject)>(
              "updateStateMountItem");

  auto state = mutation.newChildShadowView.state;

  // Do not hold onto Java object from C
  // We DO want to hold onto C object from Java, since we don't know the
  // lifetime of the Java object
  local_ref<StateWrapperImpl::JavaPart> javaStateWrapper = nullptr;
  if (state != nullptr) {
    javaStateWrapper = StateWrapperImpl::newObjectJavaArgs();
    StateWrapperImpl *cStateWrapper = cthis(javaStateWrapper);
    cStateWrapper->state_ = state;
  }

  return updateStateInstruction(
      javaUIManager,
      mutation.newChildShadowView.tag,
      (javaStateWrapper != nullptr ? javaStateWrapper.get() : nullptr));
}

local_ref<JMountItem::javaobject> createRemoveMountItem(
    const jni::global_ref<jobject> &javaUIManager,
    const ShadowViewMutation &mutation) {
  static auto removeInstruction =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jint, jint, jint)>(
              "removeMountItem");

  return removeInstruction(
      javaUIManager,
      mutation.oldChildShadowView.tag,
      mutation.parentShadowView.tag,
      mutation.index);
}

local_ref<JMountItem::javaobject> createDeleteMountItem(
    const jni::global_ref<jobject> &javaUIManager,
    const ShadowViewMutation &mutation) {
  static auto deleteInstruction =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jint)>("deleteMountItem");

  return deleteInstruction(javaUIManager, mutation.oldChildShadowView.tag);
}

local_ref<JMountItem::javaobject> createRemoveAndDeleteMultiMountItem(
    const jni::global_ref<jobject> &javaUIManager,
    const std::vector<RemoveDeleteMetadata> &metadata) {
  auto env = Environment::current();
  auto removeAndDeleteArray = env->NewIntArray(metadata.size() * 4);
  int position = 0;
  jint temp[4];
  for (const auto &x : metadata) {
    temp[0] = x.tag;
    temp[1] = x.parentTag;
    temp[2] = x.index;
    temp[3] = (x.shouldRemove ? 1 : 0) | (x.shouldDelete ? 2 : 0);
    env->SetIntArrayRegion(removeAndDeleteArray, position, 4, temp);
    position += 4;
  }

  static auto removeDeleteMultiInstruction =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jintArray)>(
              "removeDeleteMultiMountItem");

  auto ret = removeDeleteMultiInstruction(javaUIManager, removeAndDeleteArray);

  // It is not strictly necessary to manually delete the ref here, in this
  // particular case. If JNI memory is being allocated in a loop, it's easy to
  // overload the localref table and crash; this is not possible in this case
  // since the JNI would automatically clear this ref when it goes out of scope,
  // anyway. However, this is being left here as a reminder of good hygiene and
  // to be careful with JNI-allocated memory in general.
  env->DeleteLocalRef(removeAndDeleteArray);

  return ret;
}

// TODO T48019320: because we pass initial props and state to the Create (and
// preallocate) mount instruction, we technically don't need to pass the first
// Update to any components. Dedupe?
local_ref<JMountItem::javaobject> createCreateMountItem(
    const jni::global_ref<jobject> &javaUIManager,
    const ShadowViewMutation &mutation,
    const Tag surfaceId) {
  static auto createJavaInstruction =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(
              jstring, ReadableMap::javaobject, jobject, jint, jint, jboolean)>(
              "createMountItem");

  auto newChildShadowView = mutation.newChildShadowView;

  local_ref<JString> componentName =
      getPlatformComponentName(newChildShadowView);

  jboolean isLayoutable =
      newChildShadowView.layoutMetrics != EmptyLayoutMetrics;

  local_ref<ReadableMap::javaobject> props = castReadableMap(
      ReadableNativeMap::newObjectCxxArgs(newChildShadowView.props->rawProps));

  // Do not hold onto Java object from C
  // We DO want to hold onto C object from Java, since we don't know the
  // lifetime of the Java object
  local_ref<StateWrapperImpl::JavaPart> javaStateWrapper = nullptr;
  if (newChildShadowView.state != nullptr) {
    javaStateWrapper = StateWrapperImpl::newObjectJavaArgs();
    StateWrapperImpl *cStateWrapper = cthis(javaStateWrapper);
    cStateWrapper->state_ = newChildShadowView.state;
  }

  return createJavaInstruction(
      javaUIManager,
      componentName.get(),
      props.get(),
      (javaStateWrapper != nullptr ? javaStateWrapper.get() : nullptr),
      surfaceId,
      newChildShadowView.tag,
      isLayoutable);
}

void Binding::schedulerDidFinishTransaction(
    MountingCoordinator::Shared const &mountingCoordinator) {
  std::lock_guard<std::recursive_mutex> lock(commitMutex_);

  SystraceSection s("FabricUIManagerBinding::schedulerDidFinishTransaction");
  auto finishTransactionStartTime = telemetryTimePointNow();

  jni::global_ref<jobject> localJavaUIManager = getJavaUIManager();
  if (!localJavaUIManager) {
    LOG(ERROR)
        << "Binding::schedulerDidFinishTransaction: JavaUIManager disappeared";
    return;
  }

  auto mountingTransaction = mountingCoordinator->pullTransaction();

  if (!mountingTransaction.has_value()) {
    return;
  }

  auto telemetry = mountingTransaction->getTelemetry();
  auto surfaceId = mountingTransaction->getSurfaceId();
  auto &mutations = mountingTransaction->getMutations();

  facebook::better::set<Tag> createAndDeleteTagsToProcess;
  // When collapseDeleteCreateMountingInstructions_ is enabled, the
  // createAndDeleteTagsToProcess set will contain all the tags belonging to
  // CREATE and DELETE mutation instructions that needs to be processed. If a
  // CREATE or DELETE mutation instruction does not belong in the set, it means
  // that the we received a pair of mutation instructions: DELETE - CREATE and
  // it is not necessary to create or delete on the screen.
  if (collapseDeleteCreateMountingInstructions_) {
    for (const auto &mutation : mutations) {
      if (mutation.type == ShadowViewMutation::Delete) {
        // TAG on 'Delete' mutation instructions are part of the
        // oldChildShadowView
        createAndDeleteTagsToProcess.insert(mutation.oldChildShadowView.tag);
      } else if (mutation.type == ShadowViewMutation::Create) {
        // TAG on 'Create' mutation instructions are part of the
        // newChildShadowView
        Tag tag = mutation.newChildShadowView.tag;
        if (createAndDeleteTagsToProcess.find(tag) ==
            createAndDeleteTagsToProcess.end()) {
          createAndDeleteTagsToProcess.insert(tag);
        } else {
          createAndDeleteTagsToProcess.erase(tag);
        }
      }
    }
  }
  int64_t commitNumber = telemetry.getCommitNumber();

  std::vector<local_ref<jobject>> queue;
  // Upper bound estimation of mount items to be delivered to Java side.
  int size = mutations.size() * 3 + 42;

  local_ref<JArrayClass<JMountItem::javaobject>> mountItemsArray =
      JArrayClass<JMountItem::javaobject>::newArray(size);

  auto mountItems = *(mountItemsArray);
  std::unordered_set<Tag> deletedViewTags;

  // Find the set of tags that are removed and deleted in one block
  std::vector<RemoveDeleteMetadata> toRemove;

  int position = 0;
  for (const auto &mutation : mutations) {
    auto oldChildShadowView = mutation.oldChildShadowView;
    auto newChildShadowView = mutation.newChildShadowView;
    auto mutationType = mutation.type;

    if (collapseDeleteCreateMountingInstructions_ &&
        (mutationType == ShadowViewMutation::Create ||
         mutationType == ShadowViewMutation::Delete) &&
        createAndDeleteTagsToProcess.size() > 0) {
      // The TAG on 'Delete' mutation instructions are part of the
      // oldChildShadowView. On the other side, the TAG on 'Create' mutation
      // instructions are part of the newChildShadowView
      Tag tag = mutationType == ShadowViewMutation::Create
          ? mutation.newChildShadowView.tag
          : mutation.oldChildShadowView.tag;
      if (createAndDeleteTagsToProcess.find(tag) ==
          createAndDeleteTagsToProcess.end()) {
        continue;
      }
    }

    bool isVirtual = newChildShadowView.layoutMetrics == EmptyLayoutMetrics &&
        oldChildShadowView.layoutMetrics == EmptyLayoutMetrics;

    // Handle accumulated removals/deletions
    if (shouldCollateRemovesAndDeletes_ &&
        mutation.type != ShadowViewMutation::Remove &&
        mutation.type != ShadowViewMutation::Delete) {
      if (toRemove.size() > 0) {
        mountItems[position++] =
            createRemoveAndDeleteMultiMountItem(localJavaUIManager, toRemove);
        toRemove.clear();
      }
    }

    switch (mutation.type) {
      case ShadowViewMutation::Create: {
        if (disablePreallocateViews_ ||
            mutation.newChildShadowView.props->revision > 1 ||
            deletedViewTags.find(mutation.newChildShadowView.tag) !=
                deletedViewTags.end()) {
          mountItems[position++] =
              createCreateMountItem(localJavaUIManager, mutation, surfaceId);
        }
        break;
      }
      case ShadowViewMutation::Remove: {
        if (!isVirtual) {
          if (shouldCollateRemovesAndDeletes_) {
            toRemove.push_back(
                RemoveDeleteMetadata{mutation.oldChildShadowView.tag,
                                     mutation.parentShadowView.tag,
                                     mutation.index,
                                     true,
                                     false});
          } else {
            mountItems[position++] =
                createRemoveMountItem(localJavaUIManager, mutation);
          }
        }
        break;
      }
      case ShadowViewMutation::Delete: {
        if (shouldCollateRemovesAndDeletes_) {
          // It is impossible to delete without removing node first
          const auto &it = std::find_if(
              std::begin(toRemove),
              std::end(toRemove),
              [&mutation](const auto &x) {
                return x.tag == mutation.oldChildShadowView.tag;
              });

          if (it != std::end(toRemove)) {
            it->shouldDelete = true;
          } else {
            toRemove.push_back(RemoveDeleteMetadata{
                mutation.oldChildShadowView.tag, -1, -1, false, true});
          }
        } else {
          mountItems[position++] =
              createDeleteMountItem(localJavaUIManager, mutation);
        }

        deletedViewTags.insert(mutation.oldChildShadowView.tag);
        break;
      }
      case ShadowViewMutation::Update: {
        if (!isVirtual) {
          if (mutation.oldChildShadowView.props !=
              mutation.newChildShadowView.props) {
            mountItems[position++] =
                createUpdatePropsMountItem(localJavaUIManager, mutation);
          }
          if (mutation.oldChildShadowView.state !=
              mutation.newChildShadowView.state) {
            mountItems[position++] =
                createUpdateStateMountItem(localJavaUIManager, mutation);
          }

          // Padding: padding mountItems must be executed before layout props
          // are updated in the view. This is necessary to ensure that events
          // (resulting from layout changes) are dispatched with the correct
          // padding information.
          auto updatePaddingMountItem =
              createUpdatePaddingMountItem(localJavaUIManager, mutation);
          if (updatePaddingMountItem) {
            mountItems[position++] = updatePaddingMountItem;
          }

          auto updateLayoutMountItem =
              createUpdateLayoutMountItem(localJavaUIManager, mutation);
          if (updateLayoutMountItem) {
            mountItems[position++] = updateLayoutMountItem;
          }
        }

        if (mutation.oldChildShadowView.eventEmitter !=
            mutation.newChildShadowView.eventEmitter) {
          auto updateEventEmitterMountItem =
              createUpdateEventEmitterMountItem(localJavaUIManager, mutation);
          if (updateEventEmitterMountItem) {
            mountItems[position++] = updateEventEmitterMountItem;
          }
        }
        break;
      }
      case ShadowViewMutation::Insert: {
        if (!isVirtual) {
          // Insert item
          mountItems[position++] =
              createInsertMountItem(localJavaUIManager, mutation);

          if (disablePreallocateViews_ ||
              mutation.newChildShadowView.props->revision > 1 ||
              deletedViewTags.find(mutation.newChildShadowView.tag) !=
                  deletedViewTags.end()) {
            mountItems[position++] =
                createUpdatePropsMountItem(localJavaUIManager, mutation);
          }

          // State
          if (mutation.newChildShadowView.state) {
            mountItems[position++] =
                createUpdateStateMountItem(localJavaUIManager, mutation);
          }

          // Padding: padding mountItems must be executed before layout props
          // are updated in the view. This is necessary to ensure that events
          // (resulting from layout changes) are dispatched with the correct
          // padding information.
          auto updatePaddingMountItem =
              createUpdatePaddingMountItem(localJavaUIManager, mutation);
          if (updatePaddingMountItem) {
            mountItems[position++] = updatePaddingMountItem;
          }

          // Layout
          auto updateLayoutMountItem =
              createUpdateLayoutMountItem(localJavaUIManager, mutation);
          if (updateLayoutMountItem) {
            mountItems[position++] = updateLayoutMountItem;
          }
        }

        // EventEmitter
        auto updateEventEmitterMountItem =
            createUpdateEventEmitterMountItem(localJavaUIManager, mutation);
        if (updateEventEmitterMountItem) {
          mountItems[position++] = updateEventEmitterMountItem;
        }

        break;
      }
      default: {
        break;
      }
    }
  }

  // Handle remaining removals and deletions
  if (shouldCollateRemovesAndDeletes_ && toRemove.size() > 0) {
    mountItems[position++] =
        createRemoveAndDeleteMultiMountItem(localJavaUIManager, toRemove);
    toRemove.clear();
  }

  static auto createMountItemsBatchContainer =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(
              jint, jtypeArray<JMountItem::javaobject>, jint, jint)>(
              "createBatchMountItem");

  // If there are no items, we pass a nullptr instead of passing the object
  // through the JNI
  auto batch = createMountItemsBatchContainer(
      localJavaUIManager,
      surfaceId,
      position == 0 ? nullptr : mountItemsArray.get(),
      position,
      commitNumber);

  static auto scheduleMountItem =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<void(
              JMountItem::javaobject,
              jint,
              jlong,
              jlong,
              jlong,
              jlong,
              jlong,
              jlong,
              jlong)>("scheduleMountItem");

  auto finishTransactionEndTime = telemetryTimePointNow();

  scheduleMountItem(
      localJavaUIManager,
      batch.get(),
      telemetry.getCommitNumber(),
      telemetryTimePointToMilliseconds(telemetry.getCommitStartTime()),
      telemetryTimePointToMilliseconds(telemetry.getDiffStartTime()),
      telemetryTimePointToMilliseconds(telemetry.getDiffEndTime()),
      telemetryTimePointToMilliseconds(telemetry.getLayoutStartTime()),
      telemetryTimePointToMilliseconds(telemetry.getLayoutEndTime()),
      telemetryTimePointToMilliseconds(finishTransactionStartTime),
      telemetryTimePointToMilliseconds(finishTransactionEndTime));
}

void Binding::setPixelDensity(float pointScaleFactor) {
  pointScaleFactor_ = pointScaleFactor;
}

void Binding::onAnimationStarted() {
  jni::global_ref<jobject> localJavaUIManager = getJavaUIManager();
  if (!localJavaUIManager) {
    LOG(ERROR) << "Binding::animationsStarted: JavaUIManager disappeared";
    return;
  }

  static auto layoutAnimationsStartedJNI =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<void()>("onAnimationStarted");

  layoutAnimationsStartedJNI(localJavaUIManager);
}
void Binding::onAllAnimationsComplete() {
  jni::global_ref<jobject> localJavaUIManager = getJavaUIManager();
  if (!localJavaUIManager) {
    LOG(ERROR) << "Binding::allAnimationsComplete: JavaUIManager disappeared";
    return;
  }

  static auto allAnimationsCompleteJNI =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<void()>("onAllAnimationsComplete");

  allAnimationsCompleteJNI(localJavaUIManager);
}

void Binding::driveCxxAnimations() {
  scheduler_->animationTick();
}

void Binding::schedulerDidRequestPreliminaryViewAllocation(
    const SurfaceId surfaceId,
    const ShadowView &shadowView) {
  if (disablePreallocateViews_) {
    return;
  }

  jni::global_ref<jobject> localJavaUIManager = getJavaUIManager();
  if (!localJavaUIManager) {
    LOG(ERROR)
        << "Binding::schedulerDidRequestPreliminaryViewAllocation: JavaUIManager disappeared";
    return;
  }

  bool isLayoutableShadowNode = shadowView.layoutMetrics != EmptyLayoutMetrics;

  if (disableVirtualNodePreallocation_ && !isLayoutableShadowNode) {
    return;
  }

  static auto preallocateView =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<void(
              jint, jint, jstring, ReadableMap::javaobject, jobject, jboolean)>(
              "preallocateView");

  // Do not hold onto Java object from C
  // We DO want to hold onto C object from Java, since we don't know the
  // lifetime of the Java object
  local_ref<StateWrapperImpl::JavaPart> javaStateWrapper = nullptr;
  if (shadowView.state != nullptr) {
    javaStateWrapper = StateWrapperImpl::newObjectJavaArgs();
    StateWrapperImpl *cStateWrapper = cthis(javaStateWrapper);
    cStateWrapper->state_ = shadowView.state;
  }

  local_ref<ReadableMap::javaobject> props = castReadableMap(
      ReadableNativeMap::newObjectCxxArgs(shadowView.props->rawProps));
  auto component = getPlatformComponentName(shadowView);

  preallocateView(
      localJavaUIManager,
      surfaceId,
      shadowView.tag,
      component.get(),
      props.get(),
      (javaStateWrapper != nullptr ? javaStateWrapper.get() : nullptr),
      isLayoutableShadowNode);
}

void Binding::schedulerDidDispatchCommand(
    const ShadowView &shadowView,
    std::string const &commandName,
    folly::dynamic const args) {
  jni::global_ref<jobject> localJavaUIManager = getJavaUIManager();
  if (!localJavaUIManager) {
    LOG(ERROR)
        << "Binding::schedulerDidDispatchCommand: JavaUIManager disappeared";
    return;
  }

  static auto dispatchCommand =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<void(jint, jstring, ReadableArray::javaobject)>(
              "dispatchCommand");

  local_ref<JString> command = make_jstring(commandName);

  local_ref<ReadableArray::javaobject> argsArray =
      castReadableArray(ReadableNativeArray::newObjectCxxArgs(args));

  dispatchCommand(
      localJavaUIManager, shadowView.tag, command.get(), argsArray.get());
}

void Binding::schedulerDidSetJSResponder(
    SurfaceId surfaceId,
    const ShadowView &shadowView,
    const ShadowView &initialShadowView,
    bool blockNativeResponder) {
  jni::global_ref<jobject> localJavaUIManager = getJavaUIManager();
  if (!localJavaUIManager) {
    LOG(ERROR) << "Binding::schedulerSetJSResponder: JavaUIManager disappeared";
    return;
  }

  static auto setJSResponder =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<void(jint, jint, jboolean)>("setJSResponder");

  setJSResponder(
      localJavaUIManager,
      shadowView.tag,
      initialShadowView.tag,
      (jboolean)blockNativeResponder);
}

void Binding::schedulerDidClearJSResponder() {
  jni::global_ref<jobject> localJavaUIManager = getJavaUIManager();
  if (!localJavaUIManager) {
    LOG(ERROR)
        << "Binding::schedulerClearJSResponder: JavaUIManager disappeared";
    return;
  }

  static auto clearJSResponder =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<void()>("clearJSResponder");

  clearJSResponder(localJavaUIManager);
}

void Binding::registerNatives() {
  registerHybrid(
      {makeNativeMethod("initHybrid", Binding::initHybrid),
       makeNativeMethod(
           "installFabricUIManager", Binding::installFabricUIManager),
       makeNativeMethod("startSurface", Binding::startSurface),
       makeNativeMethod(
           "startSurfaceWithConstraints", Binding::startSurfaceWithConstraints),
       makeNativeMethod(
           "renderTemplateToSurface", Binding::renderTemplateToSurface),
       makeNativeMethod("stopSurface", Binding::stopSurface),
       makeNativeMethod("setConstraints", Binding::setConstraints),
       makeNativeMethod("setPixelDensity", Binding::setPixelDensity),
       makeNativeMethod("driveCxxAnimations", Binding::driveCxxAnimations),
       makeNativeMethod(
           "uninstallFabricUIManager", Binding::uninstallFabricUIManager)});
}

} // namespace react
} // namespace facebook
