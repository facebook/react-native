#pragma once

#include <memory>
#include <jsi/jsi.h>

namespace facebook {
namespace jsi {

// Integer type as it's persist friently.
using ScriptVersion_t = uint64_t;  // It shouldbe std::optional<uint64_t> once we have c++17 available everywhere. Until then, 0 implies versioning not available.
using JSRuntimeVersion_t = uint64_t; // 0 implies version can't be computed. We assert whenever that happens.

struct VersionedBuffer {
  std::shared_ptr<const facebook::jsi::Buffer> buffer;
  ScriptVersion_t version;
};

struct ScriptSignature {
  std::string url;
  ScriptVersion_t version;
};

struct JSRuntimeSignature {
  std::string runtimeName; // e.g. Chakra, V8
  JSRuntimeVersion_t version;
};

// Most JSI::Runtime implementation offer some form of prepared JavaScript which offers better performance characteristics when loading comparing to plain JavaScript.
// Embedders can provide an instance of this interface (through JSI::Runtime implementation's factory method),
// to enable persistance of the prepared script and retrieval on subsequent evaluation of a script.
struct PreparedScriptStore {
  // Try to retrieve the prepared javascript for a given combination of script & runtime.
  // scriptSignature : Javascript url and version
  // RuntimeSignature : Javascript engine type and version
  // prepareTag : Custom tag to uniquely identify JS engine specific preparation schemes. It is usually useful while experimentation and can be null.
  // It is possible that no prepared script is available for a given script & runtime signature. This method should null if so
  virtual std::shared_ptr<const facebook::jsi::Buffer> tryGetPreparedScript(
    const ScriptSignature& scriptSignature,
    const JSRuntimeSignature& runtimeSignature,
    const char* prepareTag // Optional tag. For e.g. eagerly evaluated vs lazy cache.
  ) noexcept = 0;

  // Persist the perpared javascript for a given combination of script & runtime.
  // scriptSignature : Javascript url and version
  // RuntimeSignature : Javascript engine type and version
  // prepareTag : Custom tag to uniquely identify JS engine specific preparation schemes. It is usually useful while experimentation and can be null.
  // It is possible that no prepared script is available for a given script & runtime signature. This method should null if so
  // Any failure in persistance should be identified during the subsequent retrieval through the integrity mechanism which must be put into the storage.
  virtual void persistPreparedScript(
    std::shared_ptr<const facebook::jsi::Buffer> preparedScript,
    const ScriptSignature& scriptMetadata,
    const JSRuntimeSignature& runtimeMetadata,
    const char* prepareTag  // Optional tag. For e.g. eagerly evaluated vs lazy cache.
  ) noexcept = 0;
};

// JSI::Runtime implementation must be provided an instance on this interface to enable version sensitive capabilities such as usage of pre-prepared javascript script.
// Alternatively, this entity can be used to directly provide the Javascript buffer and rich metadata to the JSI::Runtime instance.
struct ScriptStore {
  // Return the Javascript buffer and version corresponding to a given url.
  virtual VersionedBuffer getVersionedScript(const std::string& url) noexcept = 0;

  // Return the version of the Javascript buffer corresponding to a given url.
  virtual ScriptVersion_t getScriptVersion(const std::string& url) noexcept = 0;
};

} // namespace jsi
} // namespace facebook
