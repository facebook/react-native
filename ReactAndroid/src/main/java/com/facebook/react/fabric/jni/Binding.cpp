// Copyright 2004-present Facebook. All Rights Reserved.
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Binding.h"
#include "AsyncEventBeat.h"
#include "EventEmitterWrapper.h"
#include "ReactNativeConfigHolder.h"
#include "StateWrapperImpl.h"

#include <fb/fbjni.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/components/scrollview/ScrollViewProps.h>
#include <react/core/conversions.h>
#include <react/core/EventBeat.h>
#include <react/core/EventEmitter.h>
#include <react/debug/SystraceSection.h>
#include <react/uimanager/ComponentDescriptorFactory.h>
#include <react/uimanager/Scheduler.h>
#include <react/uimanager/SchedulerDelegate.h>
#include <react/uimanager/SchedulerToolbox.h>
#include <react/uimanager/primitives.h>
#include <react/utils/ContextContainer.h>
#include <react/utils/TimeUtils.h>

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

static constexpr auto UIManagerJavaDescriptor =
    "com/facebook/react/fabric/FabricUIManager";

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
      surfaceId, moduleName->toStdString(), initialProps->consume(), {}, context);
}

void Binding::startSurfaceWithConstraints(
    jint surfaceId,
    jni::alias_ref<jstring> moduleName,
    NativeMap *initialProps,
    jfloat minWidth,
    jfloat maxWidth,
    jfloat minHeight,
    jfloat maxHeight) {
  SystraceSection s("FabricUIManagerBinding::startSurfaceWithConstraints");

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
  LayoutConstraints constraints = {};
  constraints.minimumSize = minimumSize;
  constraints.maximumSize = maximumSize;

  scheduler->startSurface(
      surfaceId,
      moduleName->toStdString(),
      initialProps->consume(),
      constraints,
      context);
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
    jfloat maxHeight) {
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
  LayoutConstraints constraints = {};
  constraints.minimumSize = minimumSize;
  constraints.maximumSize = maximumSize;

  scheduler->constraintSurfaceLayout(surfaceId, constraints, context);
}

void Binding::installFabricUIManager(
    jlong jsContextNativePointer,
    jni::alias_ref<jobject> javaUIManager,
    EventBeatManager *eventBeatManager,
    jni::alias_ref<JavaMessageQueueThread::javaobject> jsMessageQueueThread,
    ComponentFactoryDelegate *componentsRegistry,
    jni::alias_ref<jobject> reactNativeConfig) {
  SystraceSection s("FabricUIManagerBinding::installFabricUIManager");

  // Use std::lock and std::adopt_lock to prevent deadlocks by locking mutexes at the same time
  std::lock(schedulerMutex_, javaUIManagerMutex_);
  std::lock_guard<std::mutex> schedulerLock(schedulerMutex_, std::adopt_lock);
  std::lock_guard<std::mutex> uiManagerLock(javaUIManagerMutex_, std::adopt_lock);

  javaUIManager_ = make_global(javaUIManager);

  ContextContainer::Shared contextContainer =
      std::make_shared<ContextContainer>();

  auto sharedJSMessageQueueThread =
      std::make_shared<JMessageQueueThread>(jsMessageQueueThread);

  Runtime *runtime = (Runtime *)jsContextNativePointer;
  RuntimeExecutor runtimeExecutor =
      [runtime, sharedJSMessageQueueThread](
          std::function<void(facebook::jsi::Runtime & runtime)> &&callback) {
        sharedJSMessageQueueThread->runOnQueue(
            [runtime, callback = std::move(callback)]() {
              callback(*runtime);
            });
      };

  eventBeatManager->setRuntimeExecutor(runtimeExecutor);

  // TODO: T31905686 Create synchronous Event Beat
  jni::global_ref<jobject> localJavaUIManager = javaUIManager_;
  EventBeatFactory synchronousBeatFactory =
      [eventBeatManager, runtimeExecutor, localJavaUIManager]() {
        return std::make_unique<AsyncEventBeat>(
            eventBeatManager, runtimeExecutor, localJavaUIManager);
      };

  EventBeatFactory asynchronousBeatFactory =
      [eventBeatManager, runtimeExecutor, localJavaUIManager]() {
        return std::make_unique<AsyncEventBeat>(
            eventBeatManager, runtimeExecutor, localJavaUIManager);
      };

  std::shared_ptr<const ReactNativeConfig> config =
      std::make_shared<const ReactNativeConfigHolder>(reactNativeConfig);
  contextContainer->insert("ReactNativeConfig", config);
  contextContainer->insert("FabricUIManager", javaUIManager_);

  auto toolbox = SchedulerToolbox{};
  toolbox.contextContainer = contextContainer;
  toolbox.componentRegistryFactory = componentsRegistry->buildRegistryFunction;
  toolbox.runtimeExecutor = runtimeExecutor;
  toolbox.synchronousEventBeatFactory = synchronousBeatFactory;
  toolbox.asynchronousEventBeatFactory = asynchronousBeatFactory;
  scheduler_ = std::make_shared<Scheduler>(toolbox);
  scheduler_->setDelegate(this);
}

void Binding::uninstallFabricUIManager() {
  // Use std::lock and std::adopt_lock to prevent deadlocks by locking mutexes at the same time
  std::lock(schedulerMutex_, javaUIManagerMutex_);
  std::lock_guard<std::mutex> schedulerLock(schedulerMutex_, std::adopt_lock);
  std::lock_guard<std::mutex> uiManagerLock(javaUIManagerMutex_, std::adopt_lock);

  scheduler_ = nullptr;
  javaUIManager_ = nullptr;
}

inline local_ref<ReadableMap::javaobject> castReadableMap(
    local_ref<ReadableNativeMap::javaobject> nativeMap) {
  return make_local(reinterpret_cast<ReadableMap::javaobject>(nativeMap.get()));
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
      jni::findClassStatic(UIManagerJavaDescriptor)
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
      jni::findClassStatic(UIManagerJavaDescriptor)
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
        jni::findClassStatic(UIManagerJavaDescriptor)
            ->getMethod<alias_ref<JMountItem>(jint, jint, jint, jint, jint, jint)>(
                "updateLayoutMountItem");
    auto layoutMetrics = newChildShadowView.layoutMetrics;
    auto pointScaleFactor = layoutMetrics.pointScaleFactor;
    auto frame = layoutMetrics.frame;

    int x = round(frame.origin.x * pointScaleFactor);
    int y = round(frame.origin.y * pointScaleFactor);
    int w = round(frame.size.width * pointScaleFactor);
    int h = round(frame.size.height * pointScaleFactor);
    auto layoutDirection = toInt(newChildShadowView.layoutMetrics.layoutDirection);
    return updateLayoutInstruction(
        javaUIManager, newChildShadowView.tag, x, y, w, h, layoutDirection);
  }

  return nullptr;
}

local_ref<JMountItem::javaobject> createInsertMountItem(
    const jni::global_ref<jobject> &javaUIManager,
    const ShadowViewMutation &mutation) {
  static auto insertInstruction =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jint, jint, jint)>(
              "insertMountItem");

  return insertInstruction(
      javaUIManager,
      mutation.newChildShadowView.tag,
      mutation.parentShadowView.tag,
      mutation.index);
}

local_ref<JMountItem::javaobject> createUpdateLocalData(
    const jni::global_ref<jobject> &javaUIManager,
    const ShadowViewMutation &mutation) {
  static auto updateLocalDataInstruction =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jint, ReadableMap::javaobject)>(
              "updateLocalDataMountItem");

  auto localData = mutation.newChildShadowView.localData;

  folly::dynamic newLocalData = folly::dynamic::object();
  if (localData) {
    newLocalData = localData->getDynamic();
  }

  local_ref<ReadableNativeMap::jhybridobject> readableNativeMap =
      ReadableNativeMap::newObjectCxxArgs(newLocalData);
  return updateLocalDataInstruction(
      javaUIManager,
      mutation.newChildShadowView.tag,
      castReadableMap(readableNativeMap).get());
}

local_ref<JMountItem::javaobject> createUpdateStateMountItem(
    const jni::global_ref<jobject> &javaUIManager,
    const ShadowViewMutation &mutation) {
  static auto updateStateInstruction =
      jni::findClassStatic(UIManagerJavaDescriptor)
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
      jni::findClassStatic(UIManagerJavaDescriptor)
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
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jint)>("deleteMountItem");

  return deleteInstruction(javaUIManager, mutation.oldChildShadowView.tag);
}

local_ref<JMountItem::javaobject> createCreateMountItem(
    const jni::global_ref<jobject> &javaUIManager,
    const ShadowViewMutation &mutation,
    const Tag surfaceId) {
  static auto createJavaInstruction =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jstring, jint, jint, jboolean)>(
              "createMountItem");

  auto newChildShadowView = mutation.newChildShadowView;

  local_ref<JString> componentName =
      getPlatformComponentName(newChildShadowView);

  jboolean isLayoutable =
      newChildShadowView.layoutMetrics != EmptyLayoutMetrics;

  return createJavaInstruction(
      javaUIManager,
      componentName.get(),
      surfaceId,
      newChildShadowView.tag,
      isLayoutable);
}

void Binding::schedulerDidFinishTransaction(
    MountingCoordinator::Shared const &mountingCoordinator) {
  std::lock_guard<std::mutex> lock(commitMutex_);

  SystraceSection s("FabricUIManagerBinding::schedulerDidFinishTransaction");
  long finishTransactionStartTime = getTime();

  jni::global_ref<jobject> localJavaUIManager = getJavaUIManager();
  if (!localJavaUIManager) {
    LOG(ERROR) << "Binding::schedulerDidFinishTransaction: JavaUIManager disappeared";
    return;
  }

  auto mountingTransaction = mountingCoordinator->pullTransaction();

  if (!mountingTransaction.has_value()) {
    return;
  }

  auto telemetry = mountingTransaction->getTelemetry();
  auto surfaceId = mountingTransaction->getSurfaceId();
  auto &mutations = mountingTransaction->getMutations();

  std::vector<local_ref<jobject>> queue;
  // Upper bound estimation of mount items to be delivered to Java side.
  int size = mutations.size() * 3 + 42;

  local_ref<JArrayClass<JMountItem::javaobject>> mountItemsArray =
      JArrayClass<JMountItem::javaobject>::newArray(size);

  auto mountItems = *(mountItemsArray);
  std::unordered_set<Tag> deletedViewTags;

  int position = 0;
  for (const auto &mutation : mutations) {
    auto oldChildShadowView = mutation.oldChildShadowView;
    auto newChildShadowView = mutation.newChildShadowView;

    bool isVirtual = newChildShadowView.layoutMetrics == EmptyLayoutMetrics &&
        oldChildShadowView.layoutMetrics == EmptyLayoutMetrics;

    switch (mutation.type) {
      case ShadowViewMutation::Create: {
        if (mutation.newChildShadowView.props->revision > 1 ||
            deletedViewTags.find(mutation.newChildShadowView.tag) !=
                deletedViewTags.end()) {
          mountItems[position++] =
              createCreateMountItem(localJavaUIManager, mutation, surfaceId);
        }
        break;
      }
      case ShadowViewMutation::Remove: {
        if (!isVirtual) {
          mountItems[position++] =
              createRemoveMountItem(localJavaUIManager, mutation);
        }
        break;
      }
      case ShadowViewMutation::Delete: {
        mountItems[position++] =
            createDeleteMountItem(localJavaUIManager, mutation);

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
          if (mutation.oldChildShadowView.localData !=
              mutation.newChildShadowView.localData) {
            mountItems[position++] =
                createUpdateLocalData(localJavaUIManager, mutation);
          }
          if (mutation.oldChildShadowView.state !=
              mutation.newChildShadowView.state) {
            mountItems[position++] =
                createUpdateStateMountItem(localJavaUIManager, mutation);
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

          if (mutation.newChildShadowView.props->revision > 1 ||
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

          // LocalData
          if (mutation.newChildShadowView.localData) {
            mountItems[position++] =
                createUpdateLocalData(localJavaUIManager, mutation);
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

  if (position <= 0) {
    // If there are no mountItems to be sent to the platform, then it is not necessary to even call.
    return;
  }

  static auto createMountItemsBatchContainer =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(
              jtypeArray<JMountItem::javaobject>, jint)>(
              "createBatchMountItem");

  auto batch = createMountItemsBatchContainer(
      localJavaUIManager, mountItemsArray.get(), position);

  static auto scheduleMountItems =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<void(JMountItem::javaobject, jlong, jlong, jlong, jlong)>(
              "scheduleMountItem");

  long finishTransactionEndTime = getTime();

  scheduleMountItems(
      localJavaUIManager,
      batch.get(),
      telemetry.getCommitStartTime(),
      telemetry.getLayoutTime(),
      finishTransactionStartTime,
      finishTransactionEndTime);
}

void Binding::setPixelDensity(float pointScaleFactor) {
  pointScaleFactor_ = pointScaleFactor;
}

void Binding::schedulerDidRequestPreliminaryViewAllocation(
    const SurfaceId surfaceId,
    const ShadowView &shadowView) {

  jni::global_ref<jobject> localJavaUIManager = getJavaUIManager();
  if (!localJavaUIManager) {
    LOG(ERROR) << "Binding::schedulerDidRequestPreliminaryViewAllocation: JavaUIManager disappeared";
    return;
  }

  bool isLayoutableShadowNode = shadowView.layoutMetrics != EmptyLayoutMetrics;

  static auto preallocateView =
      jni::findClassStatic(UIManagerJavaDescriptor)
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
       makeNativeMethod(
           "uninstallFabricUIManager", Binding::uninstallFabricUIManager)});
}

} // namespace react
} // namespace facebook
