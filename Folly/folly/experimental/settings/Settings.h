/*
 * Copyright 2018-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#pragma once

#include <functional>
#include <string>

#include <folly/Range.h>
#include <folly/experimental/settings/SettingsMetadata.h>
#include <folly/experimental/settings/detail/SettingsImpl.h>

namespace folly {
namespace settings {

class Snapshot;
namespace detail {

/**
 * @param TrivialPtr location of the small type storage.  Optimization
 *   for better inlining.
 */
template <class T, std::atomic<uint64_t>* TrivialPtr>
class SettingWrapper {
 public:
  /**
   * Returns the setting's current value.
   *
   * As an optimization, returns by value for small types, and by
   * const& for larger types.  Note that the returned reference is not
   * guaranteed to be long-lived and should not be saved anywhere. In
   * particular, a set() call might invalidate a reference obtained
   * here after some amount of time (on the order of minutes).
   */
  std::conditional_t<IsSmallPOD<T>::value, T, const T&> operator*() const {
    return core_.getWithHint(*TrivialPtr);
  }
  const T* operator->() const {
    return &core_.getSlow().value;
  }

  /**
   * Atomically updates the setting's current value.  Will invalidate
   * any previous calls to operator*() after some amount of time (on
   * the order of minutes).
   *
   * @param reason  Will be stored with the current value, useful for debugging.
   * @throws std::runtime_error  If we can't convert t to string.
   */
  void set(const T& t, StringPiece reason = "api") {
    core_.set(t, reason);
  }

  /**
   * Returns the default value this setting was constructed with.
   * NOTE: SettingsMetadata is type-agnostic, so it only stores the string
   * representation of the default value.  This method returns the
   * actual value that was passed on construction.
   */
  const T& defaultValue() const {
    return core_.defaultValue();
  }

  explicit SettingWrapper(SettingCore<T>& core) : core_(core) {}

 private:
  SettingCore<T>& core_;
  friend class folly::settings::Snapshot;
};

/* C++20 has std::type_indentity */
template <class T>
struct TypeIdentity {
  using type = T;
};
template <class T>
using TypeIdentityT = typename TypeIdentity<T>::type;

/**
 * Optimization: fast-path on top of the Meyers singleton. Each
 * translation unit gets this code inlined, while the slow path
 * initialization code is not.  We check the global pointer which
 * should only be initialized after the Meyers singleton. It's ok for
 * multiple calls to attempt to update the global pointer, as they
 * would be serialized on the Meyer's singleton initialization lock
 * anyway.
 *
 * Both FOLLY_SETTING_DECLARE and FOLLY_SETTING_DEFINE will provide
 * a copy of this function and we work around ODR by using different
 * overload types.
 *
 * Requires a trailing semicolon.
 */
#define FOLLY_SETTINGS_DEFINE_LOCAL_FUNC__(                                   \
    _project, _name, _Type, _overloadType)                                    \
  extern std::atomic<folly::settings::detail::SettingCore<_Type>*>            \
      FOLLY_SETTINGS_CACHE__##_project##_##_name;                             \
  extern std::atomic<uint64_t> FOLLY_SETTINGS_TRIVIAL__##_project##_##_name;  \
  folly::settings::detail::SettingCore<_Type>&                                \
      FOLLY_SETTINGS_FUNC__##_project##_##_name();                            \
  FOLLY_ALWAYS_INLINE auto FOLLY_SETTINGS_LOCAL_FUNC__##_project##_##_name(   \
      _overloadType) {                                                        \
    if (!FOLLY_SETTINGS_CACHE__##_project##_##_name.load()) {                 \
      FOLLY_SETTINGS_CACHE__##_project##_##_name.store(                       \
          &FOLLY_SETTINGS_FUNC__##_project##_##_name());                      \
    }                                                                         \
    return folly::settings::detail::                                          \
        SettingWrapper<_Type, &FOLLY_SETTINGS_TRIVIAL__##_project##_##_name>( \
            *FOLLY_SETTINGS_CACHE__##_project##_##_name.load());              \
  }                                                                           \
  /* This is here just to force a semicolon */                                \
  folly::settings::detail::SettingCore<_Type>&                                \
      FOLLY_SETTINGS_FUNC__##_project##_##_name()

} // namespace detail

/**
 * Defines a setting.
 *
 * FOLLY_SETTING_DEFINE() can only be placed in a single translation unit
 * and will be checked against accidental collisions.
 *
 * The setting API can be accessed via FOLLY_SETTING(project, name).<api_func>()
 * and is documented in the Setting class.
 *
 * All settings for a common namespace; (project, name) must be unique
 * for the whole program.  Collisions are verified at runtime on
 * program startup.
 *
 * @param _project  Project identifier, can only contain [a-zA-Z0-9]
 * @param _name  setting name within the project, can only contain [_a-zA-Z0-9].
 *   The string "<project>_<name>" must be unique for the whole program.
 * @param _Type  setting value type
 * @param _def   default value for the setting
 * @param _desc  setting documentation
 */
#define FOLLY_SETTING_DEFINE(_project, _name, _Type, _def, _desc)             \
  /* Fastpath optimization, see notes in FOLLY_SETTINGS_DEFINE_LOCAL_FUNC__.  \
     Aggregate all off these together in a single section for better TLB      \
     and cache locality. */                                                   \
  __attribute__((__section__(".folly.settings.cache")))                       \
      std::atomic<folly::settings::detail::SettingCore<_Type>*>               \
          FOLLY_SETTINGS_CACHE__##_project##_##_name;                         \
  /* Location for the small value cache (if _Type is small and trivial).      \
     Intentionally located right after the pointer cache above to take        \
     advantage of the prefetching */                                          \
  __attribute__((__section__(".folly.settings.cache"))) std::atomic<uint64_t> \
      FOLLY_SETTINGS_TRIVIAL__##_project##_##_name;                           \
  /* Meyers singleton to avoid SIOF */                                        \
  FOLLY_NOINLINE folly::settings::detail::SettingCore<_Type>&                 \
      FOLLY_SETTINGS_FUNC__##_project##_##_name() {                           \
    static folly::Indestructible<folly::settings::detail::SettingCore<_Type>> \
        setting(                                                              \
            folly::settings::SettingMetadata{                                 \
                #_project, #_name, #_Type, typeid(_Type), #_def, _desc},      \
            folly::settings::detail::TypeIdentityT<_Type>{_def},              \
            FOLLY_SETTINGS_TRIVIAL__##_project##_##_name);                    \
    return *setting;                                                          \
  }                                                                           \
  /* Ensure the setting is registered even if not used in program */          \
  auto& FOLLY_SETTINGS_INIT__##_project##_##_name =                           \
      FOLLY_SETTINGS_FUNC__##_project##_##_name();                            \
  FOLLY_SETTINGS_DEFINE_LOCAL_FUNC__(_project, _name, _Type, char)

/**
 * Declares a setting that's defined elsewhere.
 */
#define FOLLY_SETTING_DECLARE(_project, _name, _Type) \
  FOLLY_SETTINGS_DEFINE_LOCAL_FUNC__(_project, _name, _Type, int)

/**
 * Accesses a defined setting.
 * Rationale for the macro:
 *  1) Searchability, all settings access is done via FOLLY_SETTING(...)
 *  2) Prevents omitting trailing () by accident, which could
 *     lead to bugs like `auto value = *FOLLY_SETTING_project_name;`,
 *     which compiles but dereferences the function pointer instead of
 *     the setting itself.
 */
#define FOLLY_SETTING(_project, _name) \
  FOLLY_SETTINGS_LOCAL_FUNC__##_project##_##_name(0)

/**
 * @return If the setting exists, returns the current settings metadata.
 *         Empty Optional otherwise.
 */
Optional<SettingMetadata> getSettingsMeta(StringPiece settingName);

namespace detail {

/**
 * Like SettingWrapper, but checks against any values saved/updated in a
 * snapshot.
 */
template <class T>
class SnapshotSettingWrapper {
 public:
  /**
   * The references are only valid for the duration of the snapshot's
   * lifetime or until the setting has been updated in the snapshot,
   * whichever happens earlier.
   */
  const T& operator*() const;
  const T* operator->() const {
    return &operator*();
  }

  /**
   * Update the setting in the snapshot, the effects are not visible
   * in this snapshot.
   */
  void set(const T& t, StringPiece reason = "api") {
    core_.set(t, reason, &snapshot_);
  }

 private:
  Snapshot& snapshot_;
  SettingCore<T>& core_;
  friend class folly::settings::Snapshot;

  SnapshotSettingWrapper(Snapshot& snapshot, SettingCore<T>& core)
      : snapshot_(snapshot), core_(core) {}
};

} // namespace detail

/**
 * Captures the current state of all setting values and allows
 * updating multiple settings at once, with verification and rollback.
 *
 * A single snapshot cannot be used concurrently from different
 * threads.  Multiple concurrent snapshots are safe. Passing a single
 * snapshot from one thread to another is safe as long as the user
 * properly synchronizes the handoff.
 *
 * Example usage:
 *
 *   folly::settings::Snapshot snapshot;
 *   // FOLLY_SETTING(project, name) refers to the globally visible value
 *   // snapshot(FOLLY_SETTING(project, name)) refers to the value saved in the
 *   //  snapshot
 *   FOLLY_SETTING(project, name).set(new_value);
 *   assert(*FOLLY_SETTING(project, name) == new_value);
 *   assert(*snapshot(FOLLY_SETTING(project, name)) == old_value);
 *
 *   snapshot(FOLLY_SETTING(project, name)).set(new_snapshot_value);
 *   assert(*FOLLY_SETTING(project, name) == new_value);
 *   assert(*snapshot(FOLLY_SETTING(project, name)) == new_snapshot_value);
 *
 *   // At this point we can discard the snapshot and forget new_snapshot_value,
 *   // or choose to publish:
 *   snapshot.publish();
 *   assert(*FOLLY_SETTING(project, name) == new_snapshot_value);
 */
class Snapshot final : public detail::SnapshotBase {
 public:
  /**
   * Wraps a global FOLLY_SETTING(a, b) and returns a snapshot-local wrapper.
   */
  template <class T, std::atomic<uint64_t>* P>
  detail::SnapshotSettingWrapper<T> operator()(
      detail::SettingWrapper<T, P>&& setting) {
    return detail::SnapshotSettingWrapper<T>(*this, setting.core_);
  }

  /**
   * Returns a snapshot of all current setting values.
   * Global settings changes will not be visible in the snapshot, and vice
   * versa.
   */
  Snapshot() = default;

  /**
   * Apply all settings updates from this snapshot to the global state
   * unconditionally.
   */
  void publish() override;

  /**
   * Look up a setting by name, and update the value from a string
   * representation.
   *
   * @returns True if the setting was successfully updated, false if no setting
   *   with that name was found.
   * @throws std::runtime_error  If there's a conversion error.
   */
  bool setFromString(
      StringPiece settingName,
      StringPiece newValue,
      StringPiece reason) override;

  /**
   * @return If the setting exists, the current setting information.
   *         Empty Optional otherwise.
   */
  Optional<SettingsInfo> getAsString(StringPiece settingName) const override;

  /**
   * Reset the value of the setting identified by name to its default value.
   * The reason will be set to "default".
   *
   * @return  True if the setting was reset, false if the setting is not found.
   */
  bool resetToDefault(StringPiece settingName) override;

  /**
   * Iterates over all known settings and calls
   * func(meta, to<string>(value), reason) for each.
   */
  void forEachSetting(const std::function<
                      void(const SettingMetadata&, StringPiece, StringPiece)>&
                          func) const override;

 private:
  template <typename T>
  friend class detail::SnapshotSettingWrapper;
};

namespace detail {
template <class T>
inline const T& SnapshotSettingWrapper<T>::operator*() const {
  return snapshot_.get(core_).value;
}
} // namespace detail

} // namespace settings
} // namespace folly
