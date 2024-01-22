/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsinspector-modern/InspectorInterfaces.h>

#include <optional>
#include <string>

namespace facebook::react::jsinspector_modern {

/**
 * The top-level Target in a React Native app. This is equivalent to the
 * "Host" in React Native's architecture - the entity that manages the
 * lifecycle of a React Instance.
 */
class PageTarget {
 public:
  struct SessionMetadata {
    std::optional<std::string> integrationName;
  };

  /**
   * Creates a new Session connected to this PageTarget, wrapped in an
   * interface which is compatible with \c IInspector::addPage.
   * The caller is responsible for destroying the connection before PageTarget
   * is destroyed, on the same thread where PageTarget's constructor and
   * destructor execute.
   */
  std::unique_ptr<ILocalConnection> connect(
      std::unique_ptr<IRemoteConnection> connectionToFrontend,
      SessionMetadata sessionMetadata = {});
};

} // namespace facebook::react::jsinspector_modern
