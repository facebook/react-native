/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricMountingManager.h"
#include "CppViewMutationsWrapper.h"
#include "EventEmitterWrapper.h"
#include "StateWrapperImpl.h"

#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/components/scrollview/ScrollViewProps.h>
#include <react/renderer/core/CoreFeatures.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/debug/SystraceSection.h>
#include <react/renderer/mounting/ShadowViewMutation.h>

#include <fbjni/fbjni.h>
#include <glog/logging.h>

#include <cfenv>
#include <cmath>
#include <vector>

using namespace facebook::jni;

namespace facebook {
namespace react {

static bool getFeatureFlagValue(const char *name) {
  static const auto reactFeatureFlagsJavaDescriptor = jni::findClassStatic(
      FabricMountingManager::ReactFeatureFlagsJavaDescriptor);
  const auto field =
      reactFeatureFlagsJavaDescriptor->getStaticField<jboolean>(name);
  return reactFeatureFlagsJavaDescriptor->getStaticFieldValue(field);
}

FabricMountingManager::FabricMountingManager(
    std::shared_ptr<const ReactNativeConfig> &config,
    std::shared_ptr<const CppComponentRegistry> &cppComponentRegistry,
    global_ref<jobject> &javaUIManager)
    : javaUIManager_(javaUIManager),
      cppComponentRegistry_(cppComponentRegistry),
      disableRevisionCheckForPreallocation_(config->getBool(
          "react_fabric:disable_revision_check_for_preallocation")),
      useOverflowInset_(getFeatureFlagValue("useOverflowInset")) {
  CoreFeatures::enableMapBuffer = getFeatureFlagValue("useMapBufferProps");
}

void FabricMountingManager::onSurfaceStart(SurfaceId surfaceId) {
  std::lock_guard lock(allocatedViewsMutex_);
  allocatedViewRegistry_.emplace(surfaceId, butter::set<Tag>{});
}

void FabricMountingManager::onSurfaceStop(SurfaceId surfaceId) {
  std::lock_guard lock(allocatedViewsMutex_);
  allocatedViewRegistry_.erase(surfaceId);
}

static inline int getIntBufferSizeForType(CppMountItem::Type mountItemType) {
  switch (mountItemType) {
    case CppMountItem::Type::Create:
      return 2; // tag, isLayoutable
    case CppMountItem::Type::Insert:
    case CppMountItem::Type::Remove:
      return 3; // tag, parentTag, index
    case CppMountItem::Type::RemoveDeleteTree:
      return 3; // tag, parentTag, index
    case CppMountItem::Type::Delete:
    case CppMountItem::Type::UpdateProps:
    case CppMountItem::Type::UpdateState:
    case CppMountItem::Type::UpdateEventEmitter:
      return 1; // tag
    case CppMountItem::Type::UpdatePadding:
      return 5; // tag, top, left, bottom, right
    case CppMountItem::Type::UpdateLayout:
      return 7; // tag, parentTag, x, y, w, h, DisplayType
    case CppMountItem::Type::UpdateOverflowInset:
      return 5; // tag, left, top, right, bottom
    case CppMountItem::Type::RunCPPMutations:
      return 1;
    case CppMountItem::Undefined:
    case CppMountItem::Multiple:
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
    std::vector<CppMountItem> &cppUpdateOverflowInsetMountItems,
    std::vector<CppMountItem> &cppUpdateEventEmitterMountItems,
    ShadowViewMutationList &cppViewMutations) {
  CppMountItem::Type lastType = CppMountItem::Type::Undefined;
  int numSameType = 0;
  for (auto const &mountItem : cppCommonMountItems) {
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
      batchMountItemObjectsSize +=
          4; // component name, props, state, event emitter
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
      CppMountItem::Type::UpdateOverflowInset,
      cppUpdateOverflowInsetMountItems.size(),
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

  if (cppViewMutations.size() > 0) {
    batchMountItemIntsSize++;
    batchMountItemObjectsSize++;
  }
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

inline local_ref<ReadableArray::javaobject> castReadableArray(
    local_ref<ReadableNativeArray::javaobject> const &nativeArray) {
  return make_local(
      reinterpret_cast<ReadableArray::javaobject>(nativeArray.get()));
}

// TODO: this method will be removed when binding for components are code-gen
local_ref<JString> getPlatformComponentName(ShadowView const &shadowView) {
  static std::string scrollViewComponentName = std::string("ScrollView");

  local_ref<JString> componentName;
  if (scrollViewComponentName == shadowView.componentName) {
    auto newViewProps =
        std::static_pointer_cast<const ScrollViewProps>(shadowView.props);
    if (newViewProps->getProbablyMoreHorizontalThanVertical_DEPRECATED()) {
      componentName = make_jstring("AndroidHorizontalScrollView");
      return componentName;
    }
  }

  componentName = make_jstring(shadowView.componentName);
  return componentName;
}

static inline float scale(Float value, Float pointScaleFactor) {
  std::feclearexcept(FE_ALL_EXCEPT);
  float result = value * pointScaleFactor;
  if (std::fetestexcept(FE_OVERFLOW)) {
    LOG(ERROR) << "Binding::scale - FE_OVERFLOW - value: " << value
               << " pointScaleFactor: " << pointScaleFactor
               << " result: " << result;
  }
  if (std::fetestexcept(FE_UNDERFLOW)) {
    LOG(ERROR) << "Binding::scale - FE_UNDERFLOW - value: " << value
               << " pointScaleFactor: " << pointScaleFactor
               << " result: " << result;
  }
  return result;
}

local_ref<jobject> FabricMountingManager::getProps(
    ShadowView const &oldShadowView,
    ShadowView const &newShadowView) {
  if (CoreFeatures::enableMapBuffer &&
      newShadowView.traits.check(
          ShadowNodeTraits::Trait::AndroidMapBufferPropsSupported)) {
    react_native_assert(
        newShadowView.props->rawProps.empty() &&
        "Raw props must be empty when views are using mapbuffer");

    // MapBufferBuilder must be constructed and live in this scope,
    MapBufferBuilder builder;
    newShadowView.props->propsDiffMapBuffer(&*oldShadowView.props, builder);
    return JReadableMapBuffer::createWithContents(builder.build());
  } else {
    return ReadableNativeMap::newObjectCxxArgs(newShadowView.props->rawProps);
  }
}

void FabricMountingManager::executeMount(
    MountingCoordinator::Shared const &mountingCoordinator) {
  std::lock_guard<std::recursive_mutex> lock(commitMutex_);

  SystraceSection s(
      "FabricUIManagerBinding::schedulerDidFinishTransactionIntBuffer");
  auto finishTransactionStartTime = telemetryTimePointNow();

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
  std::vector<CppMountItem> cppUpdateOverflowInsetMountItems;
  std::vector<CppMountItem> cppUpdateEventEmitterMountItems;
  auto cppViewMutations = ShadowViewMutationList();
  {
    std::lock_guard allocatedViewsLock(allocatedViewsMutex_);

    auto allocatedViewsIterator = allocatedViewRegistry_.find(surfaceId);
    auto const &allocatedViewTags =
        allocatedViewsIterator != allocatedViewRegistry_.end()
        ? allocatedViewsIterator->second
        : butter::set<Tag>{};
    if (allocatedViewsIterator == allocatedViewRegistry_.end()) {
      LOG(ERROR) << "Executing commit after surface was stopped!";
    }

    for (const auto &mutation : mutations) {
      const auto &parentShadowView = mutation.parentShadowView;
      const auto &oldChildShadowView = mutation.oldChildShadowView;
      const auto &newChildShadowView = mutation.newChildShadowView;
      auto &mutationType = mutation.type;
      auto &index = mutation.index;

      bool isVirtual = mutation.mutatedViewIsVirtual();

      // Detect if the mutation instruction belongs to C++ view managers
      if (cppComponentRegistry_) {
        auto componentName = newChildShadowView.componentName
            ? newChildShadowView.componentName
            : oldChildShadowView.componentName;
        auto name = std::string(componentName);
        if (cppComponentRegistry_->containsComponentManager(name)) {
          // is this thread safe?
          cppViewMutations.push_back(mutation);

          // This is a hack that could be avoided by using Portals
          // Only execute mutations instructions for Root C++ ViewManagers
          // because Root C++ Components have a Android view counterpart.
          if (!cppComponentRegistry_->isRootComponent(name)) {
            continue;
          }
        }
      }

      switch (mutationType) {
        case ShadowViewMutation::Create: {
          bool allocationCheck =
              !allocatedViewTags.contains(newChildShadowView.tag);
          bool shouldCreateView = allocationCheck;
          if (shouldCreateView) {
            cppCommonMountItems.push_back(
                CppMountItem::CreateMountItem(newChildShadowView));
          }
          break;
        }
        case ShadowViewMutation::Remove: {
          if (!isVirtual && !mutation.isRedundantOperation) {
            cppCommonMountItems.push_back(CppMountItem::RemoveMountItem(
                parentShadowView, oldChildShadowView, index));
          }
          break;
        }
        case ShadowViewMutation::RemoveDeleteTree: {
          if (!isVirtual) {
            cppCommonMountItems.push_back(
                CppMountItem::RemoveDeleteTreeMountItem(
                    parentShadowView, oldChildShadowView, index));
          }
          break;
        }
        case ShadowViewMutation::Delete: {
          if (!mutation.isRedundantOperation) {
            cppDeleteMountItems.push_back(
                CppMountItem::DeleteMountItem(oldChildShadowView));
          }
          break;
        }
        case ShadowViewMutation::Update: {
          if (!isVirtual) {
            if (oldChildShadowView.props != newChildShadowView.props) {
              cppUpdatePropsMountItems.push_back(
                  CppMountItem::UpdatePropsMountItem(
                      oldChildShadowView, newChildShadowView));
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
                      mutation.newChildShadowView, parentShadowView));
            }

            // OverflowInset: This is the values indicating boundaries including
            // children of the current view. The layout of current view may not
            // change, and we separate this part from layout mount items to not
            // pack too much data there.
            if (useOverflowInset_ &&
                (oldChildShadowView.layoutMetrics.overflowInset !=
                 newChildShadowView.layoutMetrics.overflowInset)) {
              cppUpdateOverflowInsetMountItems.push_back(
                  CppMountItem::UpdateOverflowInsetMountItem(
                      newChildShadowView));
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

            bool allocationCheck =
                allocatedViewTags.find(newChildShadowView.tag) ==
                allocatedViewTags.end();
            bool shouldCreateView = allocationCheck;
            if (shouldCreateView) {
              cppUpdatePropsMountItems.push_back(
                  CppMountItem::UpdatePropsMountItem({}, newChildShadowView));
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
            if (newChildShadowView.layoutMetrics.contentInsets !=
                EdgeInsets::ZERO) {
              cppUpdatePaddingMountItems.push_back(
                  CppMountItem::UpdatePaddingMountItem(newChildShadowView));
            }

            // Layout
            cppUpdateLayoutMountItems.push_back(
                CppMountItem::UpdateLayoutMountItem(
                    newChildShadowView, parentShadowView));

            // OverflowInset: This is the values indicating boundaries including
            // children of the current view. The layout of current view may not
            // change, and we separate this part from layout mount items to not
            // pack too much data there.
            if (useOverflowInset_ &&
                newChildShadowView.layoutMetrics.overflowInset !=
                    EdgeInsets::ZERO) {
              cppUpdateOverflowInsetMountItems.push_back(
                  CppMountItem::UpdateOverflowInsetMountItem(
                      newChildShadowView));
            }
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

    if (allocatedViewsIterator != allocatedViewRegistry_.end()) {
      auto &views = allocatedViewsIterator->second;
      for (auto const &mutation : mutations) {
        switch (mutation.type) {
          case ShadowViewMutation::Create:
            views.insert(mutation.newChildShadowView.tag);
            break;
          case ShadowViewMutation::Delete:
            views.erase(mutation.oldChildShadowView.tag);
            break;
          default:
            break;
        }
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
      cppUpdateOverflowInsetMountItems,
      cppUpdateEventEmitterMountItems,
      cppViewMutations);

  static auto createMountItemsIntBufferBatchContainer =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<alias_ref<JMountItem>(
              jint, jintArray, jtypeArray<jobject>, jint)>(
              "createIntBufferBatchMountItem");

  static auto scheduleMountItem = jni::findClassStatic(UIManagerJavaDescriptor)
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
        javaUIManager_,
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
  jintArray intBufferArray = env->NewIntArray(batchMountItemIntsSize);
  local_ref<JArrayClass<jobject>> objBufferArray =
      JArrayClass<jobject>::newArray(batchMountItemObjectsSize);

  // Fill in arrays
  int intBufferPosition = 0;
  int objBufferPosition = 0;
  int prevMountItemType = -1;
  jint temp[7];
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
      local_ref<JObject> props =
          getProps(mountItem.oldChildShadowView, mountItem.newChildShadowView);

      // Do not hold onto Java object from C
      // We DO want to hold onto C object from Java, since we don't know the
      // lifetime of the Java object
      local_ref<StateWrapperImpl::JavaPart> javaStateWrapper = nullptr;
      if (mountItem.newChildShadowView.state != nullptr) {
        javaStateWrapper = StateWrapperImpl::newObjectJavaArgs();
        StateWrapperImpl *cStateWrapper = cthis(javaStateWrapper);
        cStateWrapper->state_ = mountItem.newChildShadowView.state;
      }

      // Do not hold a reference to javaEventEmitter from the C++ side.
      SharedEventEmitter eventEmitter =
          mountItem.newChildShadowView.eventEmitter;
      auto javaEventEmitter = EventEmitterWrapper::newObjectJavaArgs();
      EventEmitterWrapper *cEventEmitter = cthis(javaEventEmitter);
      cEventEmitter->eventEmitter = eventEmitter;
      temp[0] = mountItem.newChildShadowView.tag;
      temp[1] = isLayoutable;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 2, temp);
      intBufferPosition += 2;

      (*objBufferArray)[objBufferPosition++] = componentName.get();
      (*objBufferArray)[objBufferPosition++] = props.get();
      (*objBufferArray)[objBufferPosition++] =
          javaStateWrapper != nullptr ? javaStateWrapper.get() : nullptr;
      (*objBufferArray)[objBufferPosition++] = javaEventEmitter.get();
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
    } else if (mountItemType == CppMountItem::RemoveDeleteTree) {
      temp[0] = mountItem.oldChildShadowView.tag;
      temp[1] = mountItem.parentShadowView.tag;
      temp[2] = mountItem.index;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 3, temp);
      intBufferPosition += 3;
    } else {
      LOG(ERROR) << "Unexpected CppMountItem type";
    }
  }
  if (!cppUpdatePropsMountItems.empty()) {
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
      (*objBufferArray)[objBufferPosition++] =
          getProps(mountItem.oldChildShadowView, mountItem.newChildShadowView);
    }
  }
  if (!cppUpdateStateMountItems.empty()) {
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
  if (!cppUpdatePaddingMountItems.empty()) {
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

      int left = floor(scale(contentInsets.left, pointScaleFactor));
      int top = floor(scale(contentInsets.top, pointScaleFactor));
      int right = floor(scale(contentInsets.right, pointScaleFactor));
      int bottom = floor(scale(contentInsets.bottom, pointScaleFactor));

      temp[0] = mountItem.newChildShadowView.tag;
      temp[1] = left;
      temp[2] = top;
      temp[3] = right;
      temp[4] = bottom;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 5, temp);
      intBufferPosition += 5;
    }
  }
  if (!cppUpdateLayoutMountItems.empty()) {
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

      int x = round(scale(frame.origin.x, pointScaleFactor));
      int y = round(scale(frame.origin.y, pointScaleFactor));
      int w = round(scale(frame.size.width, pointScaleFactor));
      int h = round(scale(frame.size.height, pointScaleFactor));
      int displayType =
          toInt(mountItem.newChildShadowView.layoutMetrics.displayType);

      temp[0] = mountItem.newChildShadowView.tag;
      temp[1] = mountItem.parentShadowView.tag;
      temp[2] = x;
      temp[3] = y;
      temp[4] = w;
      temp[5] = h;
      temp[6] = displayType;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 7, temp);
      intBufferPosition += 7;
    }
  }
  if (!cppUpdateOverflowInsetMountItems.empty()) {
    writeIntBufferTypePreamble(
        CppMountItem::Type::UpdateOverflowInset,
        cppUpdateOverflowInsetMountItems.size(),
        env,
        intBufferArray,
        intBufferPosition);

    for (const auto &mountItem : cppUpdateOverflowInsetMountItems) {
      auto layoutMetrics = mountItem.newChildShadowView.layoutMetrics;
      auto pointScaleFactor = layoutMetrics.pointScaleFactor;
      auto overflowInset = layoutMetrics.overflowInset;

      int overflowInsetLeft =
          round(scale(overflowInset.left, pointScaleFactor));
      int overflowInsetTop = round(scale(overflowInset.top, pointScaleFactor));
      int overflowInsetRight =
          round(scale(overflowInset.right, pointScaleFactor));
      int overflowInsetBottom =
          round(scale(overflowInset.bottom, pointScaleFactor));

      temp[0] = mountItem.newChildShadowView.tag;
      temp[1] = overflowInsetLeft;
      temp[2] = overflowInsetTop;
      temp[3] = overflowInsetRight;
      temp[4] = overflowInsetBottom;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 5, temp);
      intBufferPosition += 5;
    }
  }
  if (!cppUpdateEventEmitterMountItems.empty()) {
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
  if (!cppDeleteMountItems.empty()) {
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

  if (cppViewMutations.size() > 0) {
    writeIntBufferTypePreamble(
        CppMountItem::Type::RunCPPMutations,
        1,
        env,
        intBufferArray,
        intBufferPosition);

    // TODO review this logic and memory mamangement
    // this might not be necessary:
    // temp[0] = 1234;
    // env->SetIntArrayRegion(intBufferArray, intBufferPosition, 1, temp);
    // intBufferPosition += 1;

    // Do not hold a reference to javaCppMutations from the C++ side.
    auto javaCppMutations = CppViewMutationsWrapper::newObjectJavaArgs();
    CppViewMutationsWrapper *cppViewMutationsWrapper = cthis(javaCppMutations);

    // TODO move this to init methods
    cppViewMutationsWrapper->cppComponentRegistry = cppComponentRegistry_;
    // TODO is moving the cppViewMutations safe / thread safe?
    // cppViewMutations will be accessed from the UI Thread in a near future
    // can they dissapear?
    cppViewMutationsWrapper->cppViewMutations =
        std::make_shared<std::vector<facebook::react::ShadowViewMutation>>(
            std::move(cppViewMutations));

    (*objBufferArray)[objBufferPosition++] = javaCppMutations.get();
  }

  // If there are no items, we pass a nullptr instead of passing the object
  // through the JNI
  auto batch = createMountItemsIntBufferBatchContainer(
      javaUIManager_,
      surfaceId,
      batchMountItemIntsSize == 0 ? nullptr : intBufferArray,
      batchMountItemObjectsSize == 0 ? nullptr : objBufferArray.get(),
      revisionNumber);

  auto finishTransactionEndTime = telemetryTimePointNow();

  scheduleMountItem(
      javaUIManager_,
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

void FabricMountingManager::preallocateShadowView(
    SurfaceId surfaceId,
    ShadowView const &shadowView) {
  {
    std::lock_guard lock(allocatedViewsMutex_);
    auto allocatedViewsIterator = allocatedViewRegistry_.find(surfaceId);
    if (allocatedViewsIterator == allocatedViewRegistry_.end()) {
      return;
    }
    auto &allocatedViews = allocatedViewsIterator->second;
    if (allocatedViews.find(shadowView.tag) != allocatedViews.end()) {
      return;
    }
    allocatedViews.insert(shadowView.tag);
  }

  bool isLayoutableShadowNode = shadowView.layoutMetrics != EmptyLayoutMetrics;

  static auto preallocateView =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<void(
              jint, jint, jstring, jobject, jobject, jobject, jboolean)>(
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

  // Do not hold a reference to javaEventEmitter from the C++ side.
  local_ref<EventEmitterWrapper::JavaPart> javaEventEmitter = nullptr;

  local_ref<JObject> props = getProps({}, shadowView);

  auto component = getPlatformComponentName(shadowView);

  preallocateView(
      javaUIManager_,
      surfaceId,
      shadowView.tag,
      component.get(),
      props.get(),
      (javaStateWrapper != nullptr ? javaStateWrapper.get() : nullptr),
      (javaEventEmitter != nullptr ? javaEventEmitter.get() : nullptr),
      isLayoutableShadowNode);
}

void FabricMountingManager::dispatchCommand(
    ShadowView const &shadowView,
    std::string const &commandName,
    folly::dynamic const &args) {
  static auto dispatchCommand =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<void(jint, jint, jstring, ReadableArray::javaobject)>(
              "dispatchCommand");

  local_ref<JString> command = make_jstring(commandName);

  local_ref<ReadableArray::javaobject> argsArray =
      castReadableArray(ReadableNativeArray::newObjectCxxArgs(args));

  dispatchCommand(
      javaUIManager_,
      shadowView.surfaceId,
      shadowView.tag,
      command.get(),
      argsArray.get());
}

void FabricMountingManager::sendAccessibilityEvent(
    ShadowView const &shadowView,
    std::string const &eventType) {
  local_ref<JString> eventTypeStr = make_jstring(eventType);

  static auto sendAccessibilityEventFromJS =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<void(jint, jint, jstring)>(
              "sendAccessibilityEventFromJS");

  sendAccessibilityEventFromJS(
      javaUIManager_, shadowView.surfaceId, shadowView.tag, eventTypeStr.get());
}

void FabricMountingManager::setIsJSResponder(
    ShadowView const &shadowView,
    bool isJSResponder,
    bool blockNativeResponder) {
  static auto setJSResponder =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<void(jint, jint, jint, jboolean)>("setJSResponder");

  static auto clearJSResponder = jni::findClassStatic(UIManagerJavaDescriptor)
                                     ->getMethod<void()>("clearJSResponder");

  if (isJSResponder) {
    setJSResponder(
        javaUIManager_,
        shadowView.surfaceId,
        shadowView.tag,
        // The closest non-flattened ancestor of the same value if the node is
        // not flattened. For now, we don't support the case when the node can
        // be flattened because the only component that uses this feature -
        // ScrollView - cannot be flattened.
        shadowView.tag,
        (jboolean)blockNativeResponder);
  } else {
    clearJSResponder(javaUIManager_);
  }
}

void FabricMountingManager::onAnimationStarted() {
  static auto layoutAnimationsStartedJNI =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<void()>("onAnimationStarted");

  layoutAnimationsStartedJNI(javaUIManager_);
}

void FabricMountingManager::onAllAnimationsComplete() {
  static auto allAnimationsCompleteJNI =
      jni::findClassStatic(UIManagerJavaDescriptor)
          ->getMethod<void()>("onAllAnimationsComplete");

  allAnimationsCompleteJNI(javaUIManager_);
}

} // namespace react
} // namespace facebook
