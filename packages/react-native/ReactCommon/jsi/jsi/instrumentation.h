/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <chrono>
#include <iosfwd>
#include <string>
#include <tuple>
#include <unordered_map>

#include <jsi/jsi.h>

namespace facebook {
namespace jsi {

/// Methods for starting and collecting instrumentation, an \c Instrumentation
/// instance is associated with a particular \c Runtime instance, which it
/// controls the instrumentation of.
/// None of these functions should return newly created jsi values, nor should
/// it modify the values of any jsi values in the heap (although GCs are fine).
class JSI_EXPORT Instrumentation {
 public:
  /// Additional options controlling what to include when capturing a heap
  /// snapshot.
  struct HeapSnapshotOptions {
    bool captureNumericValue{false};
  };

  virtual ~Instrumentation() = default;

  /// Returns GC statistics as a JSON-encoded string, with an object containing
  /// "type" and "version" fields outermost. "type" is a string, unique to a
  /// particular implementation of \c jsi::Instrumentation, and "version" is a
  /// number to indicate any revision to that implementation and its output
  /// format.
  ///
  /// \pre This call can only be made on the instrumentation instance of a
  ///   runtime initialised to collect GC statistics.
  ///
  /// \post All cumulative measurements mentioned in the output are accumulated
  ///   across the entire lifetime of the Runtime.
  ///
  /// \return the GC statistics collected so far, as a JSON-encoded string.
  virtual std::string getRecordedGCStats() = 0;

  /// Request statistics about the current state of the runtime's heap. This
  /// function can be called at any time, and should produce information that is
  /// correct at the instant it is called (i.e, not stale).
  ///
  /// \return a map from a string key to a number associated with that
  /// statistic.
  virtual std::unordered_map<std::string, int64_t> getHeapInfo(
      bool includeExpensive) = 0;

  /// Perform a full garbage collection.
  /// \param cause The cause of this collection, as it should be reported in
  ///   logs.
  virtual void collectGarbage(std::string cause) = 0;

  /// A HeapStatsUpdate is a tuple of the fragment index, the number of objects
  /// in that fragment, and the number of bytes used by those objects.
  /// A "fragment" is a view of all objects allocated within a time slice.
  using HeapStatsUpdate = std::tuple<uint64_t, uint64_t, uint64_t>;

  /// Start capturing JS stack-traces for all JS heap allocated objects. These
  /// can be accessed via \c ::createSnapshotToFile().
  /// \param fragmentCallback If present, invoke this callback every so often
  ///   with the most recently seen object ID, and a list of fragments that have
  ///   been updated. This callback will be invoked on the same thread that the
  ///   runtime is using.
  virtual void startTrackingHeapObjectStackTraces(
      std::function<void(
          uint64_t lastSeenObjectID,
          std::chrono::microseconds timestamp,
          std::vector<HeapStatsUpdate> stats)> fragmentCallback) = 0;

  /// Stop capture JS stack-traces for JS heap allocated objects.
  virtual void stopTrackingHeapObjectStackTraces() = 0;

  /// Start a heap sampling profiler that will sample heap allocations, and the
  /// stack trace they were allocated at. Reports a summary of which functions
  /// allocated the most.
  /// \param samplingInterval The number of bytes allocated to wait between
  ///   samples. This will be used as the expected value of a poisson
  ///   distribution.
  virtual void startHeapSampling(size_t samplingInterval) = 0;

  /// Turns off the heap sampling profiler previously enabled via
  /// \c startHeapSampling. Writes the output of the sampling heap profiler to
  /// \p os. The output is a JSON formatted string.
  virtual void stopHeapSampling(std::ostream& os) = 0;

  /// Captures the heap to a file
  ///
  /// \param path to save the heap capture.
  /// \param options additional options for what to capture.
  virtual void createSnapshotToFile(
      const std::string& path,
      const HeapSnapshotOptions& options = {false}) = 0;

  /// Captures the heap to an output stream
  ///
  /// \param os output stream to write to.
  /// \param options additional options for what to capture.
  virtual void createSnapshotToStream(
      std::ostream& os,
      const HeapSnapshotOptions& options = {false}) = 0;

  /// If the runtime has been created to trace to a temp file, flush
  /// any unwritten parts of the trace of bridge traffic to the file,
  /// and return the name of  the file.  Otherwise, return the empty string.
  /// Tracing is disabled after this call.
  virtual std::string flushAndDisableBridgeTrafficTrace() = 0;

  /// Write basic block profile trace to the given file name.
  virtual void writeBasicBlockProfileTraceToFile(
      const std::string& fileName) const = 0;

  /// Write the opcode stats to the given stream.
  virtual void dumpOpcodeStats(std::ostream& os) const = 0;

  /// Dump external profiler symbols to the given file name.
  virtual void dumpProfilerSymbolsToFile(const std::string& fileName) const = 0;
};

} // namespace jsi
} // namespace facebook
