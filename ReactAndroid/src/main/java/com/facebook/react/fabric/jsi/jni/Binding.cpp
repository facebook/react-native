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
#include <react/debug/SystraceSection.h>
#include <react/core/EventBeat.h>
#include <react/core/EventEmitter.h>
#include <react/uimanager/ComponentDescriptorFactory.h>
#include <react/utils/ContextContainer.h>
#include <react/uimanager/Scheduler.h>
#include <react/uimanager/SchedulerDelegate.h>
#include <react/uimanager/primitives.h>
#include <react/utils/TimeUtils.h>

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

void Binding::startSurface(jint surfaceId, NativeMap* initialProps) {
  if (scheduler_) {
    scheduler_->startSurface(surfaceId, "", initialProps->consume());
  }
}

void Binding::renderTemplateToSurface(jint surfaceId, jstring uiTemplate) {
  if (scheduler_) {
    auto env = Environment::current();
    const char* nativeString = env->GetStringUTFChars(uiTemplate, JNI_FALSE);
    scheduler_->renderTemplateToSurface(surfaceId, nativeString);
    env->ReleaseStringUTFChars(uiTemplate, nativeString);
  }
}

void Binding::stopSurface(jint surfaceId) {
  if (scheduler_) {
    scheduler_->stopSurface(surfaceId);
  }
}

void Binding::setConstraints(
    jint rootTag,
    jfloat minWidth,
    jfloat maxWidth,
    jfloat minHeight,
    jfloat maxHeight) {
  if (scheduler_) {
    auto minimumSize =
        Size{minWidth / pointScaleFactor_, minHeight / pointScaleFactor_};
    auto maximumSize =
        Size{maxWidth / pointScaleFactor_, maxHeight / pointScaleFactor_};

    LayoutContext context;
    context.pointScaleFactor = {pointScaleFactor_};
    LayoutConstraints constraints = {};
    constraints.minimumSize = minimumSize;
    constraints.maximumSize = maximumSize;

    scheduler_->constraintSurfaceLayout(rootTag, constraints, context);
  }
}

void Binding::installFabricUIManager(
    jlong jsContextNativePointer,
    jni::alias_ref<jobject> javaUIManager,
    EventBeatManager* eventBeatManager,
    jni::alias_ref<JavaMessageQueueThread::javaobject> jsMessageQueueThread,
    ComponentFactoryDelegate* componentsRegistry,
    jni::alias_ref<jobject> reactNativeConfig) {
  javaUIManager_ = make_global(javaUIManager);

  ContextContainer::Shared contextContainer =
      std::make_shared<ContextContainer>();

  auto sharedJSMessageQueueThread =
      std::make_shared<JMessageQueueThread>(jsMessageQueueThread);

  Runtime* runtime = (Runtime*)jsContextNativePointer;
  RuntimeExecutor runtimeExecutor =
      [runtime, sharedJSMessageQueueThread](
          std::function<void(facebook::jsi::Runtime & runtime)>&& callback) {
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

  std::shared_ptr<const ReactNativeConfig> config = std::make_shared<const ReactNativeConfigHolder>(reactNativeConfig);
  contextContainer->registerInstance(config, "ReactNativeConfig");
  contextContainer->registerInstance<EventBeatFactory>(
      synchronousBeatFactory, "synchronous");
  contextContainer->registerInstance<EventBeatFactory>(
      asynchronousBeatFactory, "asynchronous");
  contextContainer->registerInstance(javaUIManager_, "FabricUIManager");
  contextContainer->registerInstance(runtimeExecutor, "runtime-executor");

  scheduler_ = std::make_shared<Scheduler>(
      contextContainer, componentsRegistry->buildRegistryFunction);

  scheduler_->setDelegate(this);
}

void Binding::uninstallFabricUIManager() {
  scheduler_ = nullptr;
  javaUIManager_ = nullptr;
}

inline local_ref<ReadableMap::javaobject> castReadableMap(
    local_ref<ReadableNativeMap::javaobject> nativeMap) {
  return make_local(reinterpret_cast<ReadableMap::javaobject>(nativeMap.get()));
}

// TODO: this method will be removed when binding for components are code-gen
local_ref<JString> getPlatformComponentName(const ShadowView& shadowView) {
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
    const jni::global_ref<jobject>& javaUIManager,
    const ShadowViewMutation& mutation) {
  if (!mutation.newChildShadowView.eventEmitter) {
    return nullptr;
  }
  SharedEventEmitter eventEmitter = mutation.newChildShadowView.eventEmitter;

  // Do not hold a reference to javaEventEmitter from the C++ side.
  auto javaEventEmitter = EventEmitterWrapper::newObjectJavaArgs();
  EventEmitterWrapper* cEventEmitter = cthis(javaEventEmitter);
  cEventEmitter->eventEmitter = eventEmitter;

  static auto updateEventEmitterInstruction =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jint, jobject)>(
              "updateEventEmitterMountItem");

  return updateEventEmitterInstruction(
      javaUIManager, mutation.newChildShadowView.tag, javaEventEmitter.get());
}

local_ref<JMountItem::javaobject> createUpdatePropsMountItem(
    const jni::global_ref<jobject>& javaUIManager,
    const ShadowViewMutation& mutation) {
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
    const jni::global_ref<jobject>& javaUIManager,
    const ShadowViewMutation& mutation) {
  auto oldChildShadowView = mutation.oldChildShadowView;
  auto newChildShadowView = mutation.newChildShadowView;

  if (newChildShadowView.layoutMetrics != EmptyLayoutMetrics &&
      oldChildShadowView.layoutMetrics != newChildShadowView.layoutMetrics) {
    static auto updateLayoutInstruction =
        jni::findClassStatic(UIManagerJavaDescriptor)
            ->getMethod<alias_ref<JMountItem>(jint, jint, jint, jint, jint)>(
                "updateLayoutMountItem");
    auto layoutMetrics = newChildShadowView.layoutMetrics;
    auto pointScaleFactor = layoutMetrics.pointScaleFactor;
    auto frame = layoutMetrics.frame;

    int x = round(frame.origin.x * pointScaleFactor);
    int y = round(frame.origin.y * pointScaleFactor);
    int w = round(frame.size.width * pointScaleFactor);
    int h = round(frame.size.height * pointScaleFactor);
    return updateLayoutInstruction(
        javaUIManager, newChildShadowView.tag, x, y, w, h);
  }

  return nullptr;
}

local_ref<JMountItem::javaobject> createInsertMountItem(
    const jni::global_ref<jobject>& javaUIManager,
    const ShadowViewMutation& mutation) {
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
    const jni::global_ref<jobject>& javaUIManager,
    const ShadowViewMutation& mutation) {
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
    const jni::global_ref<jobject>& javaUIManager,
    const ShadowViewMutation& mutation) {
  static auto updateStateInstruction =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jint, jobject)>(
              "updateStateMountItem");

  auto state = mutation.newChildShadowView.state;

  // Do not hold onto Java object from C
  // We DO want to hold onto C object from Java, since we don't know the
  // lifetime of the Java object
  auto javaStateWrapper = StateWrapperImpl::newObjectJavaArgs();
  StateWrapperImpl* cStateWrapper = cthis(javaStateWrapper);
  cStateWrapper->state_ = state;

  return updateStateInstruction(
      javaUIManager,
      mutation.newChildShadowView.tag,
      javaStateWrapper.get());
}


local_ref<JMountItem::javaobject> createRemoveMountItem(
    const jni::global_ref<jobject>& javaUIManager,
    const ShadowViewMutation& mutation) {
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
    const jni::global_ref<jobject>& javaUIManager,
    const ShadowViewMutation& mutation) {
  static auto deleteInstruction =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jint)>("deleteMountItem");

  return deleteInstruction(javaUIManager, mutation.oldChildShadowView.tag);
}

local_ref<JMountItem::javaobject> createCreateMountItem(
    const jni::global_ref<jobject>& javaUIManager,
    const ShadowViewMutation& mutation,
    const Tag rootTag) {
  static auto createJavaInstruction =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(jstring, jint, jint, jboolean)>(
              "createMountItem");

  auto newChildShadowView = mutation.newChildShadowView;

  local_ref<JString> componentName =
      getPlatformComponentName(newChildShadowView);

  jboolean isLayoutable = newChildShadowView.layoutMetrics != EmptyLayoutMetrics;

  return createJavaInstruction(
      javaUIManager,
      componentName.get(),
      rootTag,
      newChildShadowView.tag,
      isLayoutable);
}

void Binding::schedulerDidFinishTransaction(
    MountingCoordinator::Shared const &mountingCoordinator) {
  SystraceSection s("FabricUIManager::schedulerDidFinishTransaction");

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

  long finishTransactionStartTime = getTime();

  local_ref<JArrayClass<JMountItem::javaobject>> mountItemsArray =
      JArrayClass<JMountItem::javaobject>::newArray(size);

  auto mountItems = *(mountItemsArray);
  std::unordered_set<Tag> deletedViewTags;

  int position = 0;
  for (const auto& mutation : mutations) {
    auto oldChildShadowView = mutation.oldChildShadowView;
    auto newChildShadowView = mutation.newChildShadowView;

    bool isVirtual = newChildShadowView.layoutMetrics == EmptyLayoutMetrics &&
        oldChildShadowView.layoutMetrics == EmptyLayoutMetrics;

    switch (mutation.type) {
      case ShadowViewMutation::Create: {
        if (mutation.newChildShadowView.props->revision > 1
            || deletedViewTags.find(mutation.newChildShadowView.tag) != deletedViewTags.end()) {
          mountItems[position++] =
              createCreateMountItem(javaUIManager_, mutation, surfaceId);
        }
      break;
      }
      case ShadowViewMutation::Remove: {
        if (!isVirtual) {
          mountItems[position++] =
              createRemoveMountItem(javaUIManager_, mutation);
        }
        break;
      }
      case ShadowViewMutation::Delete: {
        mountItems[position++] =
            createDeleteMountItem(javaUIManager_, mutation);

        deletedViewTags.insert(mutation.oldChildShadowView.tag);
        break;
      }
      case ShadowViewMutation::Update: {
        if (!isVirtual) {
          if (mutation.oldChildShadowView.props !=
              mutation.newChildShadowView.props) {
            mountItems[position++] =
                createUpdatePropsMountItem(javaUIManager_, mutation);
          }
          if (mutation.oldChildShadowView.localData !=
              mutation.newChildShadowView.localData) {
            mountItems[position++] =
                createUpdateLocalData(javaUIManager_, mutation);
          }
          if (mutation.oldChildShadowView.state !=
              mutation.newChildShadowView.state) {
            mountItems[position++] =
                createUpdateStateMountItem(javaUIManager_, mutation);
          }

          auto updateLayoutMountItem =
              createUpdateLayoutMountItem(javaUIManager_, mutation);
          if (updateLayoutMountItem) {
            mountItems[position++] = updateLayoutMountItem;
          }
        }

        if (mutation.oldChildShadowView.eventEmitter !=
            mutation.newChildShadowView.eventEmitter) {
          auto updateEventEmitterMountItem =
              createUpdateEventEmitterMountItem(javaUIManager_, mutation);
          if (updateEventEmitterMountItem) {
            mountItems[position++] = updateEventEmitterMountItem;
          }
        }
        break;
      }
      case ShadowViewMutation::Insert: {
        if (!isVirtual) {
          // Insert item
          mountItems[position++] = createInsertMountItem(javaUIManager_, mutation);

          if (mutation.newChildShadowView.props->revision > 1 ||
              deletedViewTags.find(mutation.newChildShadowView.tag) != deletedViewTags.end()) {
            mountItems[position++] =
                createUpdatePropsMountItem(javaUIManager_, mutation);
          }

          // LocalData
          if (mutation.newChildShadowView.localData) {
            mountItems[position++] =
                createUpdateLocalData(javaUIManager_, mutation);
          }

          // Layout
          auto updateLayoutMountItem =
              createUpdateLayoutMountItem(javaUIManager_, mutation);
          if (updateLayoutMountItem) {
            mountItems[position++] = updateLayoutMountItem;
          }

          // State
          if (mutation.newChildShadowView.state) {
            mountItems[position++] =
                createUpdateStateMountItem(javaUIManager_, mutation);
          }
        }

        // EventEmitter
        auto updateEventEmitterMountItem =
            createUpdateEventEmitterMountItem(javaUIManager_, mutation);
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

  static auto createMountItemsBatchContainer =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(
              jtypeArray<JMountItem::javaobject>, jint)>(
              "createBatchMountItem");

  auto batch = createMountItemsBatchContainer(
      javaUIManager_, mountItemsArray.get(), position);

  static auto scheduleMountItems =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<void(JMountItem::javaobject, jlong, jlong, jlong, jlong)>(
              "scheduleMountItems");

  long finishTransactionEndTime = getTime();

  scheduleMountItems(
      javaUIManager_,
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

  bool isLayoutableShadowNode = shadowView.layoutMetrics != EmptyLayoutMetrics;

  static auto preallocateView =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<void(jint, jint, jstring, ReadableMap::javaobject, jboolean)>("preallocateView");

  local_ref<ReadableMap::javaobject> readableMap =
      castReadableMap(ReadableNativeMap::newObjectCxxArgs(shadowView.props->rawProps));
  auto component = getPlatformComponentName(shadowView);
  preallocateView(
      javaUIManager_, surfaceId, shadowView.tag, component.get(), readableMap.get(), isLayoutableShadowNode);
}

void Binding::registerNatives() {
  registerHybrid(
      {makeNativeMethod("initHybrid", Binding::initHybrid),
       makeNativeMethod(
           "installFabricUIManager", Binding::installFabricUIManager),
       makeNativeMethod("startSurface", Binding::startSurface),
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
