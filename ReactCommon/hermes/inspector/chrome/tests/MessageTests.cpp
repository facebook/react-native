// Copyright 2004-present Facebook. All Rights Reserved.

#include <hermes/inspector/chrome/MessageTypes.h>

#include <iostream>

#include <folly/dynamic.h>
#include <folly/json.h>
#include <gtest/gtest.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {
namespace message {

using folly::dynamic;

TEST(MessageTests, testSerializeSomeFieldsInRequest) {
  debugger::SetBreakpointByUrlRequest req;
  // req.id should default to 0
  req.lineNumber = 2;
  req.url = "http://example.com/example.js";

  dynamic result = req.toDynamic();
  dynamic expected = folly::parseJson(R"({
    "id": 0,
    "method": "Debugger.setBreakpointByUrl",
    "params": {
      "lineNumber": 2,
      "url": "http://example.com/example.js"
    }
  })");
  EXPECT_EQ(result, expected);
}

TEST(MessageTests, testDeserializeSomeFieldsInRequest) {
  dynamic message = folly::parseJson(R"(
    {
      "id": 10,
      "method": "Debugger.setBreakpointByUrl",
      "params": {
        "lineNumber": 42,
        "url": "http://example.com"
      }
    }
  )");
  debugger::SetBreakpointByUrlRequest req(message);

  EXPECT_EQ(req.id, 10);
  EXPECT_EQ(req.method, "Debugger.setBreakpointByUrl");
  EXPECT_EQ(req.lineNumber, 42);
  EXPECT_FALSE(req.columnNumber.hasValue());
  EXPECT_FALSE(req.condition.hasValue());
  EXPECT_EQ(req.url, "http://example.com");
  EXPECT_FALSE(req.urlRegex.hasValue());
}

TEST(MessageTests, testSerializeAllFieldsInRequest) {
  debugger::SetBreakpointByUrlRequest req;
  req.id = 1;
  req.lineNumber = 2;
  req.columnNumber = 3;
  req.condition = "foo == 42";
  req.url = "http://example.com/example.js";
  req.urlRegex = "http://example.com/.*";

  dynamic result = req.toDynamic();
  dynamic expected = folly::parseJson(R"({
    "id": 1,
    "method": "Debugger.setBreakpointByUrl",
    "params": {
      "lineNumber": 2,
      "columnNumber": 3,
      "condition": "foo == 42",
      "url": "http://example.com/example.js",
      "urlRegex": "http://example.com/.*"
    }
  })");
  EXPECT_EQ(result, expected);
}

TEST(MessageTests, testDeserializeAllFieldsInRequest) {
  dynamic message = folly::parseJson(R"({
    "id": 1,
    "method": "Debugger.setBreakpointByUrl",
    "params": {
      "lineNumber": 2,
      "columnNumber": 3,
      "condition": "foo == 42",
      "url": "http://example.com/example.js",
      "urlRegex": "http://example.com/.*"
    }
  })");
  debugger::SetBreakpointByUrlRequest req(message);

  EXPECT_EQ(req.id, 1);
  EXPECT_EQ(req.method, "Debugger.setBreakpointByUrl");
  EXPECT_EQ(req.lineNumber, 2);
  EXPECT_EQ(req.columnNumber, 3);
  EXPECT_EQ(req.condition, "foo == 42");
  EXPECT_EQ(req.url, "http://example.com/example.js");
  EXPECT_EQ(req.urlRegex, "http://example.com/.*");
}

TEST(MessageTests, testSerializeResponse) {
  debugger::Location location;
  location.scriptId = "myScriptId";
  location.lineNumber = 2;
  location.columnNumber = 3;

  debugger::SetBreakpointByUrlResponse resp;
  resp.id = 1;
  resp.breakpointId = "myBreakpointId";
  resp.locations = {location};

  dynamic result = resp.toDynamic();
  dynamic expected = folly::parseJson(R"({
    "id": 1,
    "result": {
      "breakpointId": "myBreakpointId",
      "locations": [
        {
          "lineNumber": 2,
          "columnNumber": 3,
          "scriptId": "myScriptId"
        }
      ]
    }
  })");
  EXPECT_EQ(result, expected);
}

TEST(MessageTests, testDeserializeResponse) {
  dynamic message = folly::parseJson(R"({
    "id": 1,
    "result": {
      "breakpointId": "myBreakpointId",
      "locations": [
        {
          "lineNumber": 2,
          "columnNumber": 3,
          "scriptId": "myScriptId"
        }
      ]
    }
  })");
  debugger::SetBreakpointByUrlResponse resp(message);

  EXPECT_EQ(resp.id, 1);
  EXPECT_EQ(resp.breakpointId, "myBreakpointId");
  EXPECT_EQ(resp.locations.size(), 1);
  EXPECT_EQ(resp.locations[0].lineNumber, 2);
  EXPECT_EQ(resp.locations[0].columnNumber, 3);
  EXPECT_EQ(resp.locations[0].scriptId, "myScriptId");
}

TEST(MessageTests, testSerializeNotification) {
  debugger::Location startLocation;
  startLocation.lineNumber = 1;
  startLocation.scriptId = "script1";

  debugger::Location endLocation;
  endLocation.lineNumber = 2;
  endLocation.scriptId = "script2";

  debugger::Scope scope;
  scope.type = "closure";
  scope.object.type = "object";
  scope.object.subtype = "regexp";
  scope.object.className = "RegExp";
  scope.object.value = dynamic::object("foo", "bar");
  scope.object.unserializableValue = "nope";
  scope.object.description = "myDesc";
  scope.object.objectId = "id1";
  scope.name = "myScope";
  scope.startLocation = startLocation;
  scope.endLocation = endLocation;

  debugger::CallFrame frame;
  frame.callFrameId = "callFrame1";
  frame.functionName = "foo1";
  frame.location.scriptId = "script1";
  frame.location.lineNumber = 3;
  frame.location.columnNumber = 4;
  frame.url = "foo.js";
  frame.scopeChain = std::vector<debugger::Scope>{scope};
  frame.thisObj.type = "function";

  debugger::PausedNotification note;
  note.callFrames = std::vector<debugger::CallFrame>{frame};
  note.reason = "debugCommand";
  note.data = dynamic::object("foo", "bar");
  note.hitBreakpoints = std::vector<std::string>{"a", "b"};

  dynamic result = note.toDynamic();
  dynamic expected = folly::parseJson(R"({
    "method": "Debugger.paused",
    "params": {
      "callFrames": [
        {
          "callFrameId": "callFrame1",
          "functionName": "foo1",
          "location": {
            "scriptId": "script1",
            "lineNumber": 3,
            "columnNumber": 4
          },
          "url": "foo.js",
          "scopeChain": [
            {
              "type": "closure",
              "object": {
                "type": "object",
                "subtype": "regexp",
                "className": "RegExp",
                "value": { "foo": "bar" },
                "unserializableValue": "nope",
                "description": "myDesc",
                "objectId": "id1"
              },
              "name": "myScope",
              "startLocation": {
                "lineNumber": 1,
                "scriptId": "script1"
              },
              "endLocation": {
                "lineNumber": 2,
                "scriptId": "script2"
              }
            }
          ],
          "this": { "type": "function" }
        }
      ],
      "reason": "debugCommand",
      "data": {
        "foo": "bar"
      },
      "hitBreakpoints": [ "a", "b" ]
    }
  })");
  EXPECT_EQ(result, expected);
}

TEST(MessageTests, testDeserializeNotification) {
  dynamic message = folly::parseJson(R"({
    "method": "Debugger.paused",
    "params": {
      "callFrames": [
        {
          "callFrameId": "callFrame1",
          "functionName": "foo1",
          "location": {
            "scriptId": "script1",
            "lineNumber": 3,
            "columnNumber": 4
          },
          "url": "foo.js",
          "scopeChain": [
            {
              "type": "closure",
              "object": {
                "type": "object",
                "subtype": "regexp",
                "className": "RegExp",
                "value": { "foo": "bar" },
                "unserializableValue": "nope",
                "description": "myDesc",
                "objectId": "id1"
              },
              "name": "myScope",
              "startLocation": {
                "lineNumber": 1,
                "scriptId": "script1"
              },
              "endLocation": {
                "lineNumber": 2,
                "scriptId": "script2"
              }
            }
          ],
          "this": { "type": "function" }
        }
      ],
      "reason": "debugCommand",
      "data": {
        "foo": "bar"
      },
      "hitBreakpoints": [ "a", "b" ]
    }
  })");
  debugger::PausedNotification note(message);

  EXPECT_EQ(note.method, "Debugger.paused");
  EXPECT_EQ(note.callFrames.size(), 1);
  EXPECT_EQ(note.reason, "debugCommand");
  EXPECT_EQ(note.data, static_cast<dynamic>(dynamic::object("foo", "bar")));
  auto expectedHitBreakpoints = std::vector<std::string>{"a", "b"};
  EXPECT_EQ(note.hitBreakpoints, expectedHitBreakpoints);

  debugger::CallFrame &callFrame = note.callFrames[0];
  EXPECT_EQ(callFrame.callFrameId, "callFrame1");
  EXPECT_EQ(callFrame.functionName, "foo1");
  EXPECT_EQ(callFrame.location.scriptId, "script1");
  EXPECT_EQ(callFrame.location.lineNumber, 3);
  EXPECT_EQ(callFrame.location.columnNumber, 4);
  EXPECT_EQ(callFrame.url, "foo.js");
  EXPECT_EQ(callFrame.scopeChain.size(), 1);
  EXPECT_EQ(callFrame.thisObj.type, "function");

  debugger::Scope &scope = callFrame.scopeChain[0];
  EXPECT_EQ(scope.type, "closure");
  EXPECT_EQ(scope.object.type, "object");
  EXPECT_EQ(scope.object.subtype, "regexp");
  EXPECT_EQ(scope.object.className, "RegExp");
  EXPECT_EQ(
      scope.object.value, static_cast<dynamic>(dynamic::object("foo", "bar")));
  EXPECT_EQ(scope.object.unserializableValue, "nope");
  EXPECT_EQ(scope.object.description, "myDesc");
  EXPECT_EQ(scope.object.objectId, "id1");
  EXPECT_EQ(scope.name, "myScope");

  debugger::Location &startLocation = scope.startLocation.value();
  EXPECT_EQ(startLocation.lineNumber, 1);
  EXPECT_FALSE(startLocation.columnNumber.hasValue());
  EXPECT_EQ(startLocation.scriptId, "script1");

  debugger::Location &endLocation = scope.endLocation.value();
  EXPECT_EQ(endLocation.lineNumber, 2);
  EXPECT_FALSE(endLocation.columnNumber.hasValue());
  EXPECT_EQ(endLocation.scriptId, "script2");
}

TEST(MessageTests, TestSerializeAsyncStackTrace) {
  runtime::StackTrace stack;
  stack.description = "childStack";
  stack.parent = std::make_unique<runtime::StackTrace>();
  stack.parent->description = "parentStack";

  dynamic result = stack.toDynamic();
  dynamic expected = folly::parseJson(R"({
    "description": "childStack",
    "callFrames": [],
    "parent": {
      "description": "parentStack",
      "callFrames": []
    }
  })");
  EXPECT_EQ(result, expected);
}

TEST(MessageTests, TestDeserializeAsyncStackTrace) {
  dynamic message = folly::parseJson(R"({
    "description": "childStack",
    "callFrames": [],
    "parent": {
      "description": "parentStack",
      "callFrames": []
    }
  })");
  runtime::StackTrace stack(message);

  EXPECT_EQ(stack.description, "childStack");
  EXPECT_EQ(stack.callFrames.size(), 0);
  EXPECT_EQ(stack.parent->description, "parentStack");
  EXPECT_EQ(stack.parent->callFrames.size(), 0);
}

TEST(MessageTests, TestRequestFromJson) {
  std::unique_ptr<Request> baseReq1 = Request::fromJsonThrowOnError(R"({
    "id": 1,
    "method": "Debugger.enable"
  })");
  auto req1 = static_cast<debugger::EnableRequest *>(baseReq1.get());
  EXPECT_EQ(req1->id, 1);
  EXPECT_EQ(req1->method, "Debugger.enable");

  std::unique_ptr<Request> baseReq2 = Request::fromJsonThrowOnError(R"({
    "id": 2,
    "method": "Debugger.removeBreakpoint",
    "params": {
      "breakpointId": "foobar"
    }
  })");
  auto req2 = static_cast<debugger::RemoveBreakpointRequest *>(baseReq2.get());
  EXPECT_EQ(req2->id, 2);
  EXPECT_EQ(req2->method, "Debugger.removeBreakpoint");
  EXPECT_EQ(req2->breakpointId, "foobar");

  folly::Try<std::unique_ptr<Request>> invalidReq =
      Request::fromJson("invalid");
  EXPECT_TRUE(invalidReq.hasException());
}

struct MyHandler : public NoopRequestHandler {
  void handle(const debugger::EnableRequest &req) override {
    enableReq = req;
  }

  void handle(const debugger::RemoveBreakpointRequest &req) override {
    removeReq = req;
  }

  debugger::EnableRequest enableReq;
  debugger::RemoveBreakpointRequest removeReq;
};

TEST(MessageTests, TestRequestHandler) {
  MyHandler handler;

  std::unique_ptr<Request> enableReq = Request::fromJsonThrowOnError(R"({
    "id": 1,
    "method": "Debugger.enable"
  })");
  enableReq->accept(handler);

  EXPECT_EQ(handler.enableReq.id, 1);
  EXPECT_EQ(handler.enableReq.method, "Debugger.enable");

  std::unique_ptr<Request> removeReq = Request::fromJsonThrowOnError(R"({
    "id": 2,
    "method": "Debugger.removeBreakpoint",
    "params": {
      "breakpointId": "foobar"
    }
  })");
  removeReq->accept(handler);

  EXPECT_EQ(handler.removeReq.id, 2);
  EXPECT_EQ(handler.removeReq.method, "Debugger.removeBreakpoint");
  EXPECT_EQ(handler.removeReq.breakpointId, "foobar");
}

} // namespace message
} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
