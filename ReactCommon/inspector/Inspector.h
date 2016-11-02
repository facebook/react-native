// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>
#include <string>
#include <vector>
#include <unordered_map>
#include <mutex>

#include <JavaScriptCore/JSBase.h>
#undef WTF_EXPORT_PRIVATE

namespace facebook {
namespace react {

class InspectorController;
class Sender;
/**
 * The inspector exposes method to query for available 'pages' and connect to a specific one.
 * Available Javascript contextes needs to be registered when they are created and removed when
 * they are torn down.
 */
class Inspector {
private:
  class DuplexConnection;
public:
  struct Page {
    const int id;
    const std::string title;
  };

  struct RemoteConnection {
    virtual ~RemoteConnection() = default;
    virtual void onMessage(std::string message) = 0;
    virtual void onDisconnect() = 0;
  };

  class LocalConnection {
  public:
    void sendMessage(std::string message);
    void disconnect();

    LocalConnection(std::shared_ptr<DuplexConnection> duplexConnection);
  private:
    std::shared_ptr<DuplexConnection> duplexConnection_;
  };

  static Inspector& instance();

  void registerGlobalContext(std::string title, JSGlobalContextRef ctx);
  void unregisterGlobalContext(JSGlobalContextRef ctx);

  std::vector<Page> getPages() const;
  std::unique_ptr<LocalConnection> connect(int pageId, std::unique_ptr<RemoteConnection> remote);
private:
  struct PageHolder;

  class DuplexConnection {
  public:
    DuplexConnection(PageHolder& page, std::unique_ptr<RemoteConnection> remoteConnection);
    ~DuplexConnection();

    void sendToRemote(std::string message);
    void sendToLocal(std::string message);
    void terminate(bool local);
  private:
    PageHolder& page_;
    std::unique_ptr<RemoteConnection> remoteConnection_;
    std::mutex localMutex_;
    std::mutex remoteMutex_;
  };

  struct PageHolder {
    PageHolder(std::string name, std::unique_ptr<InspectorController> controller);
    ~PageHolder();

    std::shared_ptr<DuplexConnection> connect(std::unique_ptr<RemoteConnection> remote);

    const std::string name;
    std::unique_ptr<InspectorController> controller;
    std::shared_ptr<DuplexConnection> connection_;
  };

  Inspector() {};
  void disconnect(int pageId);

  int numPages_ = 0;
  std::unordered_map<int, PageHolder> pages_;
  mutable std::mutex registrationMutex_;
};

}
}
