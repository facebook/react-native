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

#include <better/set.h>
#include <fbjni/fbjni.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/renderer/animations/LayoutAnimationDriver.h>
#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/components/scrollview/ScrollViewProps.h>
#include <react/renderer/core/EventBeat.h>
#include <react/renderer/core/EventEmitter.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/debug/SystraceSection.h>
#include <react/renderer/scheduler/Scheduler.h>
#include <react/renderer/scheduler/SchedulerDelegate.h>
#include <react/renderer/scheduler/SchedulerToolbox.h>
#include <react/renderer/uimanager/primitives.h>
#include <react/utils/ContextContainer.h>

#include <glog/logging.h>

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

CppMountItem CppMountItem::CreateMountItem(ShadowView shadowView) {
  return {CppMountItem::Type::Create, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::DeleteMountItem(ShadowView shadowView) {
  return {CppMountItem::Type::Delete, {}, shadowView, {}, -1};
}
CppMountItem CppMountItem::InsertMountItem(
    ShadowView parentView,
    ShadowView shadowView,
    int index) {
  return {CppMountItem::Type::Insert, parentView, {}, shadowView, index};
}
CppMountItem CppMountItem::RemoveMountItem(
    ShadowView parentView,
    ShadowView shadowView,
    int index) {
  return {CppMountItem::Type::Remove, parentView, shadowView, {}, index};
}
CppMountItem CppMountItem::UpdatePropsMountItem(ShadowView shadowView) {
  return {CppMountItem::Type::UpdateProps, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdateStateMountItem(ShadowView shadowView) {
  return {CppMountItem::Type::UpdateState, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdateLayoutMountItem(ShadowView shadowView) {
  return {CppMountItem::Type::UpdateLayout, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdateEventEmitterMountItem(ShadowView shadowView) {
  return {CppMountItem::Type::UpdateEventEmitter, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdatePaddingMountItem(ShadowView shadowView) {
  return {CppMountItem::Type::UpdatePadding, {}, {}, shadowView, -1};
}

static inline int getIntBufferSizeForType(CppMountItem::Type mountItemType) {
  if (mountItemType == CppMountItem::Type::Create) {
    return 2; // tag, isLayoutable
  } else if (mountItemType == CppMountItem::Type::Insert) {
    return 3; // tag, parentTag, index
  } else if (mountItemType == CppMountItem::Type::Remove) {
    return 3; // tag, parentTag, index
  } else if (mountItemType == CppMountItem::Type::Delete) {
    return 1; // tag
  } else if (mountItemType == CppMountItem::Type::UpdateProps) {
    return 1; // tag
  } else if (mountItemType == CppMountItem::Type::UpdateState) {
    return 1; // tag
  } else if (mountItemType == CppMountItem::Type::UpdatePadding) {
    return 5; // tag, top, left, bottom, right
  } else if (mountItemType == CppMountItem::Type::UpdateLayout) {
    return 6; // tag, x, y, w, h, layoutDirection
  } else if (mountItemType == CppMountItem::Type::UpdateEventEmitter) {
    return 1; // tag
  } else {
    return -1;
  }
}

static inline void updateBufferSizes(
    CppMountItem::Type mountItemType,
    int numInstructions,
    int &batchMountItemIntsSize,
    int &batchMountItemObjectsSize) {
  if (numInstructions == 0) {
    return;
  }

  batchMountItemIntsSize +=
      numInstructions == 1 ? 1 : 2; // instructionType[, numInstructions]
  batchMountItemIntsSize +=
      numInstructions * getIntBufferSizeForType(mountItemType);

  if (mountItemType == CppMountItem::Type::UpdateProps) {
    batchMountItemObjectsSize +=
        numInstructions; // props object * numInstructions
  } else if (mountItemType == CppMountItem::Type::UpdateState) {
    batchMountItemObjectsSize +=
        numInstructions; // state object * numInstructions
  } else if (mountItemType == CppMountItem::Type::UpdateEventEmitter) {
    batchMountItemObjectsSize +=
        numInstructions; // EventEmitter object * numInstructions
  }
}

static inline void computeBufferSizes(
    int &batchMountItemIntsSize,
    int &batchMountItemObjectsSize,
    std::vector<CppMountItem> &cppCommonMountItems,
    std::vector<CppMountItem> &cppDeleteMountItems,
    std::vector<CppMountItem> &cppUpdatePropsMountItems,
    std::vector<CppMountItem> &cppUpdateStateMountItems,
    std::vector<CppMountItem> &cppUpdatePaddingMountItems,
    std::vector<CppMountItem> &cppUpdateLayoutMountItems,
    std::vector<CppMountItem> &cppUpdateEventEmitterMountItems) {
  CppMountItem::Type lastType = CppMountItem::Type::Undefined;
  int numSameType = 0;
  for (const auto &mountItem : cppCommonMountItems) {
    const auto &mountItemType = mountItem.type;

    if (lastType == mountItemType) {
      numSameType++;
      if (numSameType == 2) {
        batchMountItemIntsSize += 1; // numInstructions
      }
    } else {
      numSameType = 1;
      lastType = mountItemType;
      batchMountItemIntsSize += 1; // instructionType
    }

    batchMountItemIntsSize += getIntBufferSizeForType(mountItemType);
    if (mountItemType == CppMountItem::Type::Create) {
      batchMountItemObjectsSize += 3; // component name, props, state
    }
  }

  updateBufferSizes(
      CppMountItem::Type::UpdateProps,
      cppUpdatePropsMountItems.size(),
      batchMountItemIntsSize,
      batchMountItemObjectsSize);
  updateBufferSizes(
      CppMountItem::Type::UpdateState,
      cppUpdateStateMountItems.size(),
      batchMountItemIntsSize,
      batchMountItemObjectsSize);
  updateBufferSizes(
      CppMountItem::Type::UpdatePadding,
      cppUpdatePaddingMountItems.size(),
      batchMountItemIntsSize,
      batchMountItemObjectsSize);
  updateBufferSizes(
      CppMountItem::Type::UpdateLayout,
      cppUpdateLayoutMountItems.size(),
      batchMountItemIntsSize,
      batchMountItemObjectsSize);
  updateBufferSizes(
      CppMountItem::Type::UpdateEventEmitter,
      cppUpdateEventEmitterMountItems.size(),
      batchMountItemIntsSize,
      batchMountItemObjectsSize);
  updateBufferSizes(
      CppMountItem::Type::Delete,
      cppDeleteMountItems.size(),
      batchMountItemIntsSize,
      batchMountItemObjectsSize);
}

static inline void writeIntBufferTypePreamble(
    int mountItemType,
    int numItems,
    _JNIEnv *env,
    jintArray &intBufferArray,
    int &intBufferPosition) {
  jint temp[2];
  if (numItems == 1) {
    temp[0] = mountItemType;
    env->SetIntArrayRegion(intBufferArray, intBufferPosition, 1, temp);
    intBufferPosition += 1;
  } else {
    temp[0] = mountItemType | CppMountItem::Type::Multiple;
    temp[1] = numItems;
    env->SetIntArrayRegion(intBufferArray, intBufferPosition, 2, temp);
    intBufferPosition += 2;
  }
}

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
    jfloat offsetX,
    jfloat offsetY,
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
  context.viewportOffset =
      Point{offsetX / pointScaleFactor_, offsetY / pointScaleFactor_};
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
    jfloat offsetX,
    jfloat offsetY,
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
  context.viewportOffset =
      Point{offsetX / pointScaleFactor_, offsetY / pointScaleFactor_};
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
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutorHolder,
    jni::alias_ref<jobject> javaUIManager,
    EventBeatManager *eventBeatManager,
    jni::alias_ref<JavaMessageQueueThread::javaobject> jsMessageQueueThread,
    ComponentFactory *componentsRegistry,
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
  auto runtimeExecutor = runtimeExecutorHolder->cthis()->get();

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
  collapseDeleteCreateMountingInstructions_ =
      reactNativeConfig_->getBool(
          "react_fabric:enabled_collapse_delete_create_mounting_instructions") &&
      !reactNativeConfig_->getBool(
          "react_fabric:enable_reparenting_detection_android") &&
      !reactNativeConfig_->getBool(
          "react_fabric:enabled_layout_animations_android");

  useIntBufferBatchMountItem_ = reactNativeConfig_->getBool(
      "react_fabric:use_int_buffer_batch_mountitem_android");

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

  if (reactNativeConfig_->getBool(
          "react_fabric:enable_background_executor_android")) {
    backgroundExecutor_ = std::make_unique<JBackgroundExecutor>();
    toolbox.backgroundExecutor = backgroundExecutor_->get();
  }

  if (enableLayoutAnimations) {
    animationDriver_ =
        std::make_shared<LayoutAnimationDriver>(runtimeExecutor, this);
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
          newChildShadowView.layoutMetrics.contentInsets &&
      mutation.type != ShadowViewMutation::Type::Insert) {
    return nullptr;
  }

  static auto updatePaddingInstruction =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jint, jint, jint, jint, jint)>(
              "updatePaddingMountItem");

  auto layoutMetrics = newChildShadowView.layoutMetrics;
  auto pointScaleFactor = layoutMetrics.pointScaleFactor;
  auto contentInsets = layoutMetrics.contentInsets;

  int left = floor(contentInsets.left * pointScaleFactor);
  int top = floor(contentInsets.top * pointScaleFactor);
  int right = floor(contentInsets.right * pointScaleFactor);
  int bottom = floor(contentInsets.bottom * pointScaleFactor);

  return updatePaddingInstruction(
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

void Binding::schedulerDidFinishTransactionIntBuffer(
    MountingCoordinator::Shared const &mountingCoordinator) {
  std::lock_guard<std::recursive_mutex> lock(commitMutex_);

  SystraceSection s(
      "FabricUIManagerBinding::schedulerDidFinishTransactionIntBuffer");
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

  auto env = Environment::current();

  auto telemetry = mountingTransaction->getTelemetry();
  auto surfaceId = mountingTransaction->getSurfaceId();
  auto &mutations = mountingTransaction->getMutations();

  auto revisionNumber = telemetry.getRevisionNumber();

  std::vector<CppMountItem> cppCommonMountItems;
  std::vector<CppMountItem> cppDeleteMountItems;
  std::vector<CppMountItem> cppUpdatePropsMountItems;
  std::vector<CppMountItem> cppUpdateStateMountItems;
  std::vector<CppMountItem> cppUpdatePaddingMountItems;
  std::vector<CppMountItem> cppUpdateLayoutMountItems;
  std::vector<CppMountItem> cppUpdateEventEmitterMountItems;

  for (const auto &mutation : mutations) {
    const auto &parentShadowView = mutation.parentShadowView;
    const auto &oldChildShadowView = mutation.oldChildShadowView;
    const auto &newChildShadowView = mutation.newChildShadowView;
    auto &mutationType = mutation.type;
    auto &index = mutation.index;

    bool isVirtual = newChildShadowView.layoutMetrics == EmptyLayoutMetrics &&
        oldChildShadowView.layoutMetrics == EmptyLayoutMetrics;

    switch (mutationType) {
      case ShadowViewMutation::Create: {
        if (disablePreallocateViews_ ||
            newChildShadowView.props->revision > 1) {
          cppCommonMountItems.push_back(
              CppMountItem::CreateMountItem(newChildShadowView));
        }
        break;
      }
      case ShadowViewMutation::Remove: {
        if (!isVirtual) {
          cppCommonMountItems.push_back(CppMountItem::RemoveMountItem(
              parentShadowView, oldChildShadowView, index));
        }
        break;
      }
      case ShadowViewMutation::Delete: {
        cppDeleteMountItems.push_back(
            CppMountItem::DeleteMountItem(oldChildShadowView));
        break;
      }
      case ShadowViewMutation::Update: {
        if (!isVirtual) {
          if (oldChildShadowView.props != newChildShadowView.props) {
            cppUpdatePropsMountItems.push_back(
                CppMountItem::UpdatePropsMountItem(newChildShadowView));
          }
          if (oldChildShadowView.state != newChildShadowView.state) {
            cppUpdateStateMountItems.push_back(
                CppMountItem::UpdateStateMountItem(newChildShadowView));
          }

          // Padding: padding mountItems must be executed before layout props
          // are updated in the view. This is necessary to ensure that events
          // (resulting from layout changes) are dispatched with the correct
          // padding information.
          if (oldChildShadowView.layoutMetrics.contentInsets !=
              newChildShadowView.layoutMetrics.contentInsets) {
            cppUpdatePaddingMountItems.push_back(
                CppMountItem::UpdatePaddingMountItem(newChildShadowView));
          }

          if (oldChildShadowView.layoutMetrics !=
              newChildShadowView.layoutMetrics) {
            cppUpdateLayoutMountItems.push_back(
                CppMountItem::UpdateLayoutMountItem(
                    mutation.newChildShadowView));
          }
        }

        if (oldChildShadowView.eventEmitter !=
            newChildShadowView.eventEmitter) {
          cppUpdateEventEmitterMountItems.push_back(
              CppMountItem::UpdateEventEmitterMountItem(
                  mutation.newChildShadowView));
        }
        break;
      }
      case ShadowViewMutation::Insert: {
        if (!isVirtual) {
          // Insert item
          cppCommonMountItems.push_back(CppMountItem::InsertMountItem(
              parentShadowView, newChildShadowView, index));

          if (disablePreallocateViews_ ||
              newChildShadowView.props->revision > 1) {
            cppUpdatePropsMountItems.push_back(
                CppMountItem::UpdatePropsMountItem(newChildShadowView));
          }

          // State
          if (newChildShadowView.state) {
            cppUpdateStateMountItems.push_back(
                CppMountItem::UpdateStateMountItem(newChildShadowView));
          }

          // Padding: padding mountItems must be executed before layout props
          // are updated in the view. This is necessary to ensure that events
          // (resulting from layout changes) are dispatched with the correct
          // padding information.
          cppUpdatePaddingMountItems.push_back(
              CppMountItem::UpdatePaddingMountItem(
                  mutation.newChildShadowView));

          // Layout
          cppUpdateLayoutMountItems.push_back(
              CppMountItem::UpdateLayoutMountItem(mutation.newChildShadowView));
        }

        // EventEmitter
        cppUpdateEventEmitterMountItems.push_back(
            CppMountItem::UpdateEventEmitterMountItem(
                mutation.newChildShadowView));

        break;
      }
      default: {
        break;
      }
    }
  }

  // We now have all the information we need, including ordering of mount items,
  // to know exactly how much space must be allocated
  int batchMountItemIntsSize = 0;
  int batchMountItemObjectsSize = 0;
  computeBufferSizes(
      batchMountItemIntsSize,
      batchMountItemObjectsSize,
      cppCommonMountItems,
      cppDeleteMountItems,
      cppUpdatePropsMountItems,
      cppUpdateStateMountItems,
      cppUpdatePaddingMountItems,
      cppUpdateLayoutMountItems,
      cppUpdateEventEmitterMountItems);

  static auto createMountItemsIntBufferBatchContainer =
      jni::findClassStatic(Binding::UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(
              jint, jintArray, jtypeArray<jobject>, jint)>(
              "createIntBufferBatchMountItem");

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

  if (batchMountItemIntsSize == 0) {
    auto finishTransactionEndTime = telemetryTimePointNow();

    scheduleMountItem(
        localJavaUIManager,
        nullptr,
        telemetry.getRevisionNumber(),
        telemetryTimePointToMilliseconds(telemetry.getCommitStartTime()),
        telemetryTimePointToMilliseconds(telemetry.getDiffStartTime()),
        telemetryTimePointToMilliseconds(telemetry.getDiffEndTime()),
        telemetryTimePointToMilliseconds(telemetry.getLayoutStartTime()),
        telemetryTimePointToMilliseconds(telemetry.getLayoutEndTime()),
        telemetryTimePointToMilliseconds(finishTransactionStartTime),
        telemetryTimePointToMilliseconds(finishTransactionEndTime));
    return;
  }

  // Allocate the intBuffer and object array, now that we know exact sizes
  // necessary
  // TODO: don't allocate at all if size is zero
  jintArray intBufferArray = env->NewIntArray(batchMountItemIntsSize);
  local_ref<JArrayClass<jobject>> objBufferArray =
      JArrayClass<jobject>::newArray(batchMountItemObjectsSize);

  // Fill in arrays
  int intBufferPosition = 0;
  int objBufferPosition = 0;
  int prevMountItemType = -1;
  jint temp[6];
  for (int i = 0; i < cppCommonMountItems.size(); i++) {
    const auto &mountItem = cppCommonMountItems[i];
    const auto &mountItemType = mountItem.type;

    // Get type here, and count forward how many items of this type are in a
    // row. Write preamble to any common type here.
    if (prevMountItemType != mountItemType) {
      int numSameItemTypes = 1;
      for (int j = i + 1; j < cppCommonMountItems.size() &&
           cppCommonMountItems[j].type == mountItemType;
           j++) {
        numSameItemTypes++;
      }

      writeIntBufferTypePreamble(
          mountItemType,
          numSameItemTypes,
          env,
          intBufferArray,
          intBufferPosition);
    }
    prevMountItemType = mountItemType;

    // TODO: multi-create, multi-insert, etc
    if (mountItemType == CppMountItem::Type::Create) {
      local_ref<JString> componentName =
          getPlatformComponentName(mountItem.newChildShadowView);

      int isLayoutable =
          mountItem.newChildShadowView.layoutMetrics != EmptyLayoutMetrics ? 1
                                                                           : 0;

      local_ref<ReadableMap::javaobject> props =
          castReadableMap(ReadableNativeMap::newObjectCxxArgs(
              mountItem.newChildShadowView.props->rawProps));

      // Do not hold onto Java object from C
      // We DO want to hold onto C object from Java, since we don't know the
      // lifetime of the Java object
      local_ref<StateWrapperImpl::JavaPart> javaStateWrapper = nullptr;
      if (mountItem.newChildShadowView.state != nullptr) {
        javaStateWrapper = StateWrapperImpl::newObjectJavaArgs();
        StateWrapperImpl *cStateWrapper = cthis(javaStateWrapper);
        cStateWrapper->state_ = mountItem.newChildShadowView.state;
      }

      temp[0] = mountItem.newChildShadowView.tag;
      temp[1] = isLayoutable;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 2, temp);
      intBufferPosition += 2;

      (*objBufferArray)[objBufferPosition++] = componentName.get();
      (*objBufferArray)[objBufferPosition++] = props.get();
      (*objBufferArray)[objBufferPosition++] =
          javaStateWrapper != nullptr ? javaStateWrapper.get() : nullptr;
    } else if (mountItemType == CppMountItem::Type::Insert) {
      temp[0] = mountItem.newChildShadowView.tag;
      temp[1] = mountItem.parentShadowView.tag;
      temp[2] = mountItem.index;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 3, temp);
      intBufferPosition += 3;
    } else if (mountItemType == CppMountItem::Remove) {
      temp[0] = mountItem.oldChildShadowView.tag;
      temp[1] = mountItem.parentShadowView.tag;
      temp[2] = mountItem.index;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 3, temp);
      intBufferPosition += 3;
    } else {
      LOG(ERROR) << "Unexpected CppMountItem type";
    }
  }
  if (cppUpdatePropsMountItems.size() > 0) {
    writeIntBufferTypePreamble(
        CppMountItem::Type::UpdateProps,
        cppUpdatePropsMountItems.size(),
        env,
        intBufferArray,
        intBufferPosition);

    for (const auto &mountItem : cppUpdatePropsMountItems) {
      temp[0] = mountItem.newChildShadowView.tag;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 1, temp);
      intBufferPosition += 1;

      auto newProps = mountItem.newChildShadowView.props->rawProps;
      local_ref<ReadableMap::javaobject> newPropsReadableMap =
          castReadableMap(ReadableNativeMap::newObjectCxxArgs(newProps));
      (*objBufferArray)[objBufferPosition++] = newPropsReadableMap.get();
    }
  }
  if (cppUpdateStateMountItems.size() > 0) {
    writeIntBufferTypePreamble(
        CppMountItem::Type::UpdateState,
        cppUpdateStateMountItems.size(),
        env,
        intBufferArray,
        intBufferPosition);

    for (const auto &mountItem : cppUpdateStateMountItems) {
      temp[0] = mountItem.newChildShadowView.tag;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 1, temp);
      intBufferPosition += 1;

      auto state = mountItem.newChildShadowView.state;
      // Do not hold onto Java object from C
      // We DO want to hold onto C object from Java, since we don't know the
      // lifetime of the Java object
      local_ref<StateWrapperImpl::JavaPart> javaStateWrapper = nullptr;
      if (state != nullptr) {
        javaStateWrapper = StateWrapperImpl::newObjectJavaArgs();
        StateWrapperImpl *cStateWrapper = cthis(javaStateWrapper);
        cStateWrapper->state_ = state;
      }

      (*objBufferArray)[objBufferPosition++] =
          (javaStateWrapper != nullptr ? javaStateWrapper.get() : nullptr);
    }
  }
  if (cppUpdatePaddingMountItems.size() > 0) {
    writeIntBufferTypePreamble(
        CppMountItem::Type::UpdatePadding,
        cppUpdatePaddingMountItems.size(),
        env,
        intBufferArray,
        intBufferPosition);

    for (const auto &mountItem : cppUpdatePaddingMountItems) {
      auto layoutMetrics = mountItem.newChildShadowView.layoutMetrics;
      auto pointScaleFactor = layoutMetrics.pointScaleFactor;
      auto contentInsets = layoutMetrics.contentInsets;

      int left = floor(contentInsets.left * pointScaleFactor);
      int top = floor(contentInsets.top * pointScaleFactor);
      int right = floor(contentInsets.right * pointScaleFactor);
      int bottom = floor(contentInsets.bottom * pointScaleFactor);

      temp[0] = mountItem.newChildShadowView.tag;
      temp[1] = left;
      temp[2] = top;
      temp[3] = right;
      temp[4] = bottom;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 5, temp);
      intBufferPosition += 5;
    }
  }
  if (cppUpdateLayoutMountItems.size() > 0) {
    writeIntBufferTypePreamble(
        CppMountItem::Type::UpdateLayout,
        cppUpdateLayoutMountItems.size(),
        env,
        intBufferArray,
        intBufferPosition);

    for (const auto &mountItem : cppUpdateLayoutMountItems) {
      auto layoutMetrics = mountItem.newChildShadowView.layoutMetrics;
      auto pointScaleFactor = layoutMetrics.pointScaleFactor;
      auto frame = layoutMetrics.frame;

      int x = round(frame.origin.x * pointScaleFactor);
      int y = round(frame.origin.y * pointScaleFactor);
      int w = round(frame.size.width * pointScaleFactor);
      int h = round(frame.size.height * pointScaleFactor);
      int layoutDirection =
          toInt(mountItem.newChildShadowView.layoutMetrics.layoutDirection);

      temp[0] = mountItem.newChildShadowView.tag;
      temp[1] = x;
      temp[2] = y;
      temp[3] = w;
      temp[4] = h;
      temp[5] = layoutDirection;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 6, temp);
      intBufferPosition += 6;
    }
  }
  if (cppUpdateEventEmitterMountItems.size() > 0) {
    writeIntBufferTypePreamble(
        CppMountItem::Type::UpdateEventEmitter,
        cppUpdateEventEmitterMountItems.size(),
        env,
        intBufferArray,
        intBufferPosition);

    for (const auto &mountItem : cppUpdateEventEmitterMountItems) {
      temp[0] = mountItem.newChildShadowView.tag;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 1, temp);
      intBufferPosition += 1;

      SharedEventEmitter eventEmitter =
          mountItem.newChildShadowView.eventEmitter;

      // Do not hold a reference to javaEventEmitter from the C++ side.
      auto javaEventEmitter = EventEmitterWrapper::newObjectJavaArgs();
      EventEmitterWrapper *cEventEmitter = cthis(javaEventEmitter);
      cEventEmitter->eventEmitter = eventEmitter;

      (*objBufferArray)[objBufferPosition++] = javaEventEmitter.get();
    }
  }

  // Write deletes last - so that all prop updates, etc, for the tag in the same
  // batch don't fail. Without additional machinery, moving deletes here
  // requires that the differ never produces "DELETE...CREATE" in that order for
  // the same tag. It's nice to be able to batch all similar operations together
  // for space efficiency.
  if (cppDeleteMountItems.size() > 0) {
    writeIntBufferTypePreamble(
        CppMountItem::Type::Delete,
        cppDeleteMountItems.size(),
        env,
        intBufferArray,
        intBufferPosition);

    for (const auto &mountItem : cppDeleteMountItems) {
      temp[0] = mountItem.oldChildShadowView.tag;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 1, temp);
      intBufferPosition += 1;
    }
  }

  // If there are no items, we pass a nullptr instead of passing the object
  // through the JNI
  auto batch = createMountItemsIntBufferBatchContainer(
      localJavaUIManager,
      surfaceId,
      batchMountItemIntsSize == 0 ? nullptr : intBufferArray,
      batchMountItemObjectsSize == 0 ? nullptr : objBufferArray.get(),
      revisionNumber);

  auto finishTransactionEndTime = telemetryTimePointNow();

  scheduleMountItem(
      localJavaUIManager,
      batch.get(),
      telemetry.getRevisionNumber(),
      telemetryTimePointToMilliseconds(telemetry.getCommitStartTime()),
      telemetryTimePointToMilliseconds(telemetry.getDiffStartTime()),
      telemetryTimePointToMilliseconds(telemetry.getDiffEndTime()),
      telemetryTimePointToMilliseconds(telemetry.getLayoutStartTime()),
      telemetryTimePointToMilliseconds(telemetry.getLayoutEndTime()),
      telemetryTimePointToMilliseconds(finishTransactionStartTime),
      telemetryTimePointToMilliseconds(finishTransactionEndTime));

  env->DeleteLocalRef(intBufferArray);
}

void Binding::schedulerDidFinishTransaction(
    MountingCoordinator::Shared const &mountingCoordinator) {
  std::lock_guard<std::recursive_mutex> lock(commitMutex_);

  if (useIntBufferBatchMountItem_) {
    return schedulerDidFinishTransactionIntBuffer(mountingCoordinator);
  }

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

  auto revisionNumber = telemetry.getRevisionNumber();

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
    if (mutation.type != ShadowViewMutation::Remove &&
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
          toRemove.push_back(
              RemoveDeleteMetadata{mutation.oldChildShadowView.tag,
                                   mutation.parentShadowView.tag,
                                   mutation.index,
                                   true,
                                   false});
        }
        break;
      }
      case ShadowViewMutation::Delete: {
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
  if (toRemove.size() > 0) {
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
      revisionNumber);

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
      telemetry.getRevisionNumber(),
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
