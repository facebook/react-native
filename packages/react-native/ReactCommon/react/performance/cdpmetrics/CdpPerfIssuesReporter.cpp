/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CdpPerfIssuesReporter.h"

#include <folly/dynamic.h>
#include <folly/json.h>
#include <string_view>

namespace facebook::react {

namespace {

constexpr std::string_view issuesReporterName =
    "__react_native_perf_issues_reporter";

} // namespace

CdpPerfIssuesReporter::CdpPerfIssuesReporter(RuntimeExecutor runtimeExecutor)
    : runtimeExecutor_(std::move(runtimeExecutor)) {}

void CdpPerfIssuesReporter::onMeasureEntry(
    const PerformanceMeasure& entry,
    const std::optional<UserTimingDetailProvider>& detailProvider) {
  std::optional<folly::dynamic> maybeDetail = nullptr;
  if (detailProvider.has_value()) {
    maybeDetail = (*detailProvider)();
  }

  if (!maybeDetail.has_value() || !maybeDetail->isObject()) {
    return;
  }

  runtimeExecutor_([entry,
                    detail = std::move(*maybeDetail)](jsi::Runtime& runtime) {
    auto global = runtime.global();
    if (!global.hasProperty(runtime, issuesReporterName.data())) {
      return;
    }

    if (detail.count("rnPerfIssue") != 0 && detail["rnPerfIssue"].isObject()) {
      auto& perfIssue = detail["rnPerfIssue"];

      if (perfIssue.count("name") != 0 && perfIssue.count("severity") != 0 &&
          perfIssue.count("description") != 0) {
        auto jsonString = folly::toJson(perfIssue);
        auto jsiString = jsi::String::createFromUtf8(runtime, jsonString);
        auto issuesReporter =
            global.getPropertyAsFunction(runtime, issuesReporterName.data());
        issuesReporter.call(runtime, jsiString);
      }
    }
  });
}

} // namespace facebook::react
