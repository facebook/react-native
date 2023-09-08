/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>
#include <string>
#include <vector>

#ifndef JSINSPECTOR_EXPORT
#ifdef _MSC_VER
#ifdef CREATE_SHARED_LIBRARY
#define JSINSPECTOR_EXPORT __declspec(dllexport)
#else
#define JSINSPECTOR_EXPORT
#endif // CREATE_SHARED_LIBRARY
#else // _MSC_VER
#define JSINSPECTOR_EXPORT __attribute__((visibility("default")))
#endif // _MSC_VER
#endif // !defined(JSINSPECTOR_EXPORT)

namespace facebook::react::jsinspector_modern {

class IDestructible {
 public:
  virtual ~IDestructible() = 0;
};

struct InspectorPage {
  const int id;
  const std::string title;
  const std::string vm;
};

/// IRemoteConnection allows the VM to send debugger messages to the client.
class JSINSPECTOR_EXPORT IRemoteConnection : public IDestructible {
 public:
  virtual ~IRemoteConnection() = 0;
  virtual void onMessage(std::string message) = 0;
  virtual void onDisconnect() = 0;
};

/// ILocalConnection allows the client to send debugger messages to the VM.
class JSINSPECTOR_EXPORT ILocalConnection : public IDestructible {
 public:
  virtual ~ILocalConnection() = 0;
  virtual void sendMessage(std::string message) = 0;
  virtual void disconnect() = 0;
};

/// IInspector tracks debuggable JavaScript targets (pages).
class JSINSPECTOR_EXPORT IInspector : public IDestructible {
 public:
  using ConnectFunc = std::function<std::unique_ptr<ILocalConnection>(
      std::unique_ptr<IRemoteConnection>)>;

  virtual ~IInspector() = 0;

  /// addPage is called by the VM to add a page to the list of debuggable pages.
  virtual int addPage(
      const std::string& title,
      const std::string& vm,
      ConnectFunc connectFunc) = 0;

  /// removePage is called by the VM to remove a page from the list of
  /// debuggable pages.
  virtual void removePage(int pageId) = 0;

  /// getPages is called by the client to list all debuggable pages.
  virtual std::vector<InspectorPage> getPages() const = 0;

  /// connect is called by the client to initiate a debugging session on the
  /// given page.
  virtual std::unique_ptr<ILocalConnection> connect(
      int pageId,
      std::unique_ptr<IRemoteConnection> remote) = 0;
};

/// getInspectorInstance retrieves the singleton inspector that tracks all
/// debuggable pages in this process.
extern IInspector& getInspectorInstance();

/// makeTestInspectorInstance creates an independent inspector instance that
/// should only be used in tests.
extern std::unique_ptr<IInspector> makeTestInspectorInstance();

} // namespace facebook::react::jsinspector_modern
