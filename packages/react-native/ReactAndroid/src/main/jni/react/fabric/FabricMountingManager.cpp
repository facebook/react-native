/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricMountingManager.h"

#include "EventEmitterWrapper.h"
#include "MountItem.h"
#include "StateWrapperImpl.h"

#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/components/scrollview/ScrollViewProps.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/debug/SystraceSection.h>
#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/ShadowView.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/utils/CoreFeatures.h>

#include <fbjni/fbjni.h>
#include <glog/logging.h>

#include <cfenv>
#include <cmath>
#include <unordered_set>
#include <vector>

namespace facebook::react {

FabricMountingManager::FabricMountingManager(
    std::shared_ptr<const ReactNativeConfig>& config,
    jni::global_ref<JFabricUIManager::javaobject>& javaUIManager)
    : javaUIManager_(javaUIManager) {}

void FabricMountingManager::onSurfaceStart(SurfaceId surfaceId) {
  std::lock_guard lock(allocatedViewsMutex_);
  allocatedViewRegistry_.emplace(surfaceId, std::unordered_set<Tag>{});
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
    case CppMountItem::Undefined:
    case CppMountItem::Multiple:
      return -1;
  }
}

static inline void updateBufferSizes(
    CppMountItem::Type mountItemType,
    size_t numInstructions,
    int& batchMountItemIntsSize,
    int& batchMountItemObjectsSize) {
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
    int& batchMountItemIntsSize,
    int& batchMountItemObjectsSize,
    std::vector<CppMountItem>& cppCommonMountItems,
    std::vector<CppMountItem>& cppDeleteMountItems,
    std::vector<CppMountItem>& cppUpdatePropsMountItems,
    std::vector<CppMountItem>& cppUpdateStateMountItems,
    std::vector<CppMountItem>& cppUpdatePaddingMountItems,
    std::vector<CppMountItem>& cppUpdateLayoutMountItems,
    std::vector<CppMountItem>& cppUpdateOverflowInsetMountItems,
    std::vector<CppMountItem>& cppUpdateEventEmitterMountItems) {
  CppMountItem::Type lastType = CppMountItem::Type::Undefined;
  int numSameType = 0;
  for (const auto& mountItem : cppCommonMountItems) {
    const auto& mountItemType = mountItem.type;

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
}

static inline void writeIntBufferTypePreamble(
    int mountItemType,
    size_t numItems,
    _JNIEnv* env,
    jintArray& intBufferArray,
    int& intBufferPosition) {
  jint temp[2];
  if (numItems == 1) {
    temp[0] = mountItemType;
    env->SetIntArrayRegion(intBufferArray, intBufferPosition, 1, temp);
    intBufferPosition += 1;
  } else {
    temp[0] = mountItemType | CppMountItem::Type::Multiple;
    temp[1] = static_cast<jint>(numItems);
    env->SetIntArrayRegion(intBufferArray, intBufferPosition, 2, temp);
    intBufferPosition += 2;
  }
}

// TODO: this method will be removed when binding for components are code-gen
jni::local_ref<jstring> getPlatformComponentName(const ShadowView& shadowView) {
  static std::string scrollViewComponentName = std::string("ScrollView");
  if (scrollViewComponentName == shadowView.componentName) {
    const auto& newViewProps =
        static_cast<const ScrollViewProps&>(*shadowView.props);
    if (newViewProps.getProbablyMoreHorizontalThanVertical_DEPRECATED()) {
      return jni::make_jstring("AndroidHorizontalScrollView");
    }
  }
  return jni::make_jstring(shadowView.componentName);
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

jni::local_ref<jobject> FabricMountingManager::getProps(
    const ShadowView& oldShadowView,
    const ShadowView& newShadowView) {
  return ReadableNativeMap::newObjectCxxArgs(newShadowView.props->rawProps);
}

void FabricMountingManager::executeMount(
    const MountingTransaction& transaction) {
  SystraceSection section("FabricMountingManager::executeMount");

  std::scoped_lock lock(commitMutex_);
  auto finishTransactionStartTime = telemetryTimePointNow();

  auto env = jni::Environment::current();

  auto telemetry = transaction.getTelemetry();
  auto surfaceId = transaction.getSurfaceId();
  auto& mutations = transaction.getMutations();

  auto revisionNumber = telemetry.getRevisionNumber();

  std::vector<CppMountItem> cppCommonMountItems;
  std::vector<CppMountItem> cppDeleteMountItems;
  std::vector<CppMountItem> cppUpdatePropsMountItems;
  std::vector<CppMountItem> cppUpdateStateMountItems;
  std::vector<CppMountItem> cppUpdatePaddingMountItems;
  std::vector<CppMountItem> cppUpdateLayoutMountItems;
  std::vector<CppMountItem> cppUpdateOverflowInsetMountItems;
  std::vector<CppMountItem> cppUpdateEventEmitterMountItems;

  {
    std::lock_guard allocatedViewsLock(allocatedViewsMutex_);

    auto allocatedViewsIterator = allocatedViewRegistry_.find(surfaceId);
    auto defaultAllocatedViews = std::unordered_set<Tag>{};
    // Do not remove `defaultAllocatedViews` or initialize
    // `std::unordered_set<Tag>{}` inline in below ternary expression - if falsy
    // operand is a value type, the compiler will decide the expression to be a
    // value type, an unnecessary (sometimes expensive) copy will happen as a
    // result.
    const auto& allocatedViewTags =
        allocatedViewsIterator != allocatedViewRegistry_.end()
        ? allocatedViewsIterator->second
        : defaultAllocatedViews;
    if (allocatedViewsIterator == allocatedViewRegistry_.end()) {
      LOG(ERROR) << "Executing commit after surface was stopped!";
    }

    for (const auto& mutation : mutations) {
      const auto& parentShadowView = mutation.parentShadowView;
      const auto& oldChildShadowView = mutation.oldChildShadowView;
      const auto& newChildShadowView = mutation.newChildShadowView;
      auto& mutationType = mutation.type;
      auto& index = mutation.index;

      bool isVirtual = mutation.mutatedViewIsVirtual();
      switch (mutationType) {
        case ShadowViewMutation::Create: {
          bool shouldCreateView =
              !allocatedViewTags.contains(newChildShadowView.tag);

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
            if ((oldChildShadowView.layoutMetrics.overflowInset !=
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
            if (newChildShadowView.layoutMetrics.overflowInset !=
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
      auto& views = allocatedViewsIterator->second;
      for (const auto& mutation : mutations) {
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
      cppUpdateEventEmitterMountItems);

  static auto createMountItemsIntBufferBatchContainer =
      JFabricUIManager::javaClassStatic()
          ->getMethod<jni::alias_ref<JMountItem>(
              jint, jintArray, jni::jtypeArray<jobject>, jint)>(
              "createIntBufferBatchMountItem");

  static auto scheduleMountItem = JFabricUIManager::javaClassStatic()
                                      ->getMethod<void(
                                          JMountItem::javaobject,
                                          jint,
                                          jlong,
                                          jlong,
                                          jlong,
                                          jlong,
                                          jlong,
                                          jlong,
                                          jlong,
                                          jint)>("scheduleMountItem");

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
        telemetryTimePointToMilliseconds(finishTransactionEndTime),
        telemetry.getAffectedLayoutNodesCount());
    return;
  }

  // Allocate the intBuffer and object array, now that we know exact sizes
  // necessary
  jintArray intBufferArray = env->NewIntArray(batchMountItemIntsSize);
  auto objBufferArray =
      jni::JArrayClass<jobject>::newArray(batchMountItemObjectsSize);

  // Fill in arrays
  int intBufferPosition = 0;
  int objBufferPosition = 0;
  int prevMountItemType = -1;
  jint temp[7];
  for (int i = 0; i < cppCommonMountItems.size(); i++) {
    const auto& mountItem = cppCommonMountItems[i];
    const auto& mountItemType = mountItem.type;

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
      auto componentName =
          getPlatformComponentName(mountItem.newChildShadowView);

      int isLayoutable =
          mountItem.newChildShadowView.layoutMetrics != EmptyLayoutMetrics ? 1
                                                                           : 0;
      jni::local_ref<jobject> props =
          getProps(mountItem.oldChildShadowView, mountItem.newChildShadowView);

      // Do not hold onto Java object from C
      // We DO want to hold onto C object from Java, since we don't know the
      // lifetime of the Java object
      jni::local_ref<StateWrapperImpl::JavaPart> javaStateWrapper = nullptr;
      if (mountItem.newChildShadowView.state != nullptr) {
        javaStateWrapper = StateWrapperImpl::newObjectJavaArgs();
        StateWrapperImpl* cStateWrapper = cthis(javaStateWrapper);
        cStateWrapper->state_ = mountItem.newChildShadowView.state;
      }

      // Do not hold a reference to javaEventEmitter from the C++ side.
      auto javaEventEmitter = EventEmitterWrapper::newObjectCxxArgs(
          mountItem.newChildShadowView.eventEmitter);
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

    for (const auto& mountItem : cppUpdatePropsMountItems) {
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

    for (const auto& mountItem : cppUpdateStateMountItems) {
      temp[0] = mountItem.newChildShadowView.tag;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 1, temp);
      intBufferPosition += 1;

      auto state = mountItem.newChildShadowView.state;
      // Do not hold onto Java object from C
      // We DO want to hold onto C object from Java, since we don't know the
      // lifetime of the Java object
      jni::local_ref<StateWrapperImpl::JavaPart> javaStateWrapper = nullptr;
      if (state != nullptr) {
        javaStateWrapper = StateWrapperImpl::newObjectJavaArgs();
        StateWrapperImpl* cStateWrapper = cthis(javaStateWrapper);
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

    for (const auto& mountItem : cppUpdatePaddingMountItems) {
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

    for (const auto& mountItem : cppUpdateLayoutMountItems) {
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

    for (const auto& mountItem : cppUpdateOverflowInsetMountItems) {
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

    for (const auto& mountItem : cppUpdateEventEmitterMountItems) {
      temp[0] = mountItem.newChildShadowView.tag;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 1, temp);
      intBufferPosition += 1;

      // Do not hold a reference to javaEventEmitter from the C++ side.
      auto javaEventEmitter = EventEmitterWrapper::newObjectCxxArgs(
          mountItem.newChildShadowView.eventEmitter);
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

    for (const auto& mountItem : cppDeleteMountItems) {
      temp[0] = mountItem.oldChildShadowView.tag;
      env->SetIntArrayRegion(intBufferArray, intBufferPosition, 1, temp);
      intBufferPosition += 1;
    }
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
      telemetryTimePointToMilliseconds(finishTransactionEndTime),
      telemetry.getAffectedLayoutNodesCount());

  env->DeleteLocalRef(intBufferArray);
}

void FabricMountingManager::preallocateShadowView(
    SurfaceId surfaceId,
    const ShadowView& shadowView) {
  {
    std::lock_guard lock(allocatedViewsMutex_);
    auto allocatedViewsIterator = allocatedViewRegistry_.find(surfaceId);
    if (allocatedViewsIterator == allocatedViewRegistry_.end()) {
      return;
    }
    auto& allocatedViews = allocatedViewsIterator->second;
    if (allocatedViews.find(shadowView.tag) != allocatedViews.end()) {
      return;
    }
    allocatedViews.insert(shadowView.tag);
  }

  bool isLayoutableShadowNode = shadowView.layoutMetrics != EmptyLayoutMetrics;

  static auto preallocateView =
      JFabricUIManager::javaClassStatic()
          ->getMethod<void(
              jint, jint, jstring, jobject, jobject, jobject, jboolean)>(
              "preallocateView");

  // Do not hold onto Java object from C
  // We DO want to hold onto C object from Java, since we don't know the
  // lifetime of the Java object
  jni::local_ref<StateWrapperImpl::JavaPart> javaStateWrapper = nullptr;
  if (shadowView.state != nullptr) {
    javaStateWrapper = StateWrapperImpl::newObjectJavaArgs();
    StateWrapperImpl* cStateWrapper = cthis(javaStateWrapper);
    cStateWrapper->state_ = shadowView.state;
  }

  // Do not hold a reference to javaEventEmitter from the C++ side.
  jni::local_ref<EventEmitterWrapper::JavaPart> javaEventEmitter = nullptr;

  jni::local_ref<jobject> props = getProps({}, shadowView);

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
    const ShadowView& shadowView,
    const std::string& commandName,
    const folly::dynamic& args) {
  static auto dispatchCommand =
      JFabricUIManager::javaClassStatic()
          ->getMethod<void(jint, jint, jstring, ReadableArray::javaobject)>(
              "dispatchCommand");
  auto command = jni::make_jstring(commandName);
  auto argsArray = jni::adopt_local(reinterpret_cast<ReadableArray::javaobject>(
      ReadableNativeArray::newObjectCxxArgs(args).release()));
  dispatchCommand(
      javaUIManager_,
      shadowView.surfaceId,
      shadowView.tag,
      command.get(),
      argsArray.get());
}

void FabricMountingManager::sendAccessibilityEvent(
    const ShadowView& shadowView,
    const std::string& eventType) {
  static auto sendAccessibilityEventFromJS =
      JFabricUIManager::javaClassStatic()->getMethod<void(jint, jint, jstring)>(
          "sendAccessibilityEventFromJS");

  auto eventTypeStr = jni::make_jstring(eventType);
  sendAccessibilityEventFromJS(
      javaUIManager_, shadowView.surfaceId, shadowView.tag, eventTypeStr.get());
}

void FabricMountingManager::setIsJSResponder(
    const ShadowView& shadowView,
    bool isJSResponder,
    bool blockNativeResponder) {
  static auto setJSResponder =
      JFabricUIManager::javaClassStatic()
          ->getMethod<void(jint, jint, jint, jboolean)>("setJSResponder");

  static auto clearJSResponder =
      JFabricUIManager::javaClassStatic()->getMethod<void()>(
          "clearJSResponder");

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
      JFabricUIManager::javaClassStatic()->getMethod<void()>(
          "onAnimationStarted");

  layoutAnimationsStartedJNI(javaUIManager_);
}

void FabricMountingManager::onAllAnimationsComplete() {
  static auto allAnimationsCompleteJNI =
      JFabricUIManager::javaClassStatic()->getMethod<void()>(
          "onAllAnimationsComplete");

  allAnimationsCompleteJNI(javaUIManager_);
}

} // namespace facebook::react
