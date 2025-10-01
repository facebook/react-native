/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <jserrorhandler/StackTraceParser.h>

using namespace facebook::react;

#include <string>
#include <unordered_map>

std::unordered_map<std::string, std::string> CapturedExceptions = {
    {"NODE_12",
     "Error: Just an Exception\n"
     "    at promiseMe (/home/xyz/hack/asyncnode.js:11:9)\n"
     "    at async main (/home/xyz/hack/asyncnode.js:15:13)"},
    {"NODE_ANONYM",
     "Error\n"
     "    at Spect.get (C:\\projects\\spect\\src\\index.js:161:26)\n"
     "    at Object.get (C:\\projects\\spect\\src\\index.js:43:36)\n"
     "    at <anonymous>\n"
     "    at (anonymous function).then (C:\\projects\\spect\\src\\index.js:165:33)\n"
     "    at process.runNextTicks [as _tickCallback] (internal/process/task_queues.js:52:5)\n"
     "    at C:\\projects\\spect\\node_modules\\esm\\esm.js:1:34535\n"
     "    at C:\\projects\\spect\\node_modules\\esm\\esm.js:1:34176\n"
     "    at process.<anonymous> (C:\\projects\\spect\\node_modules\\esm\\esm.js:1:34506)\n"
     "    at Function.<anonymous> (C:\\projects\\spect\\node_modules\\esm\\esm.js:1:296856)\n"
     "    at Function.<anonymous> (C:\\projects\\spect\\node_modules\\esm\\esm.js:1:296555)"},
    {"NODE_SPACE",
     "Error\n"
     "    at Spect.get (C:\\project files\\spect\\src\\index.js:161:26)\n"
     "    at Object.get (C:\\project files\\spect\\src\\index.js:43:36)\n"
     "    at <anonymous>\n"
     "    at (anonymous function).then (C:\\project files\\spect\\src\\index.js:165:33)\n"
     "    at process.runNextTicks [as _tickCallback] (internal/process/task_queues.js:52:5)\n"
     "    at C:\\project files\\spect\\node_modules\\esm\\esm.js:1:34535\n"
     "    at C:\\project files\\spect\\node_modules\\esm\\esm.js:1:34176\n"
     "    at process.<anonymous> (C:\\project files\\spect\\node_modules\\esm\\esm.js:1:34506)\n"
     "    at Function.<anonymous> (C:\\project files\\spect\\node_modules\\esm\\esm.js:1:296856)\n"
     "    at Function.<anonymous> (C:\\project files\\spect\\node_modules\\esm\\esm.js:1:296555)"},
    {"OPERA_25",
     "TypeError: Cannot read property 'undef' of null\n"
     "    at http://path/to/file.js:47:22\n"
     "    at foo (http://path/to/file.js:52:15)\n"
     "    at bar (http://path/to/file.js:108:168)"},
    {"CHROME_15",
     "TypeError: Object #<Object> has no method 'undef'\n"
     "    at bar (http://path/to/file.js:13:17)\n"
     "    at bar (http://path/to/file.js:16:5)\n"
     "    at foo (http://path/to/file.js:20:5)\n"
     "    at http://path/to/file.js:24:4"},
    {"CHROME_36",
     "Error: Default error\n"
     "    at dumpExceptionError (http://localhost:8080/file.js:41:27)\n"
     "    at HTMLButtonElement.onclick (http://localhost:8080/file.js:107:146)\n"
     "    at I.e.fn.(anonymous function) [as index] (http://localhost:8080/file.js:10:3651)"},
    {"CHROME_76",
     "Error: BEEP BEEP\n"
     "    at bar (<anonymous>:8:9)\n"
     "    at async foo (<anonymous>:2:3)"},
    {"CHROME_XX_WEBPACK",
     "TypeError: Cannot read property 'error' of undefined\n"
     "   at TESTTESTTEST.eval(webpack:///./src/components/test/test.jsx?:295:108)\n"
     "   at TESTTESTTEST.render(webpack:///./src/components/test/test.jsx?:272:32)\n"
     "   at TESTTESTTEST.tryRender(webpack:///./~/react-transform-catch-errors/lib/index.js?:34:31)\n"
     "   at TESTTESTTEST.proxiedMethod(webpack:///./~/react-proxy/modules/createPrototypeProxy.js?:44:30)\n"
     "   at Module../pages/index.js (C:\\root\\server\\development\\pages\\index.js:182:7)"},
    {"FIREFOX_3",
     "()@http://127.0.0.1:8000/js/stacktrace.js:44\n"
     "(null)@http://127.0.0.1:8000/js/stacktrace.js:31\n"
     "printStackTrace()@http://127.0.0.1:8000/js/stacktrace.js:18\n"
     "bar(1)@http://127.0.0.1:8000/js/file.js:13\n"
     "bar(2)@http://127.0.0.1:8000/js/file.js:16\n"
     "foo()@http://127.0.0.1:8000/js/file.js:20\n"
     "@http://127.0.0.1:8000/js/file.js:24\n"},
    {"FIREFOX_7",
     "()@file:///G:/js/stacktrace.js:44\n"
     "(null)@file:///G:/js/stacktrace.js:31\n"
     "printStackTrace()@file:///G:/js/stacktrace.js:18\n"
     "bar(1)@file:///G:/js/file.js:13\n"
     "bar(2)@file:///G:/js/file.js:16\n"
     "foo()@file:///G:/js/file.js:20\n"
     "@file:///G:/js/file.js:24\n"},
    {"FIREFOX_14",
     "@http://path/to/file.js:48\n"
     "dumpException3@http://path/to/file.js:52\n"
     "onclick@http://path/to/file.js:1\n"},
    {"FIREFOX_31",
     "foo@http://path/to/file.js:41:13\n"
     "bar@http://path/to/file.js:1:1\n"
     ".plugin/e.fn[c]/<@http://path/to/file.js:1:1\n"},
    {"FIREFOX_43_EVAL",
     "baz@http://localhost:8080/file.js line 26 > eval line 2 > eval:1:30\n"
     "foo@http://localhost:8080/file.js line 26 > eval:2:96\n"
     "@http://localhost:8080/file.js line 26 > eval:4:18\n"
     "speak@http://localhost:8080/file.js:26:17\n"
     "@http://localhost:8080/file.js:33:9"},
    {"FIREFOX_44_NS_EXCEPTION",
     "[2]</Bar.prototype._baz/</<@http://path/to/file.js:703:28\n"
     "App.prototype.foo@file:///path/to/file.js:15:2\n"
     "bar@file:///path/to/file.js:20:3\n"
     "@file:///path/to/index.html:23:1\n"},
    {"FIREFOX_50_RESOURCE_URL",
     "render@resource://path/data/content/bundle.js:5529:16\n"
     "dispatchEvent@resource://path/data/content/vendor.bundle.js:18:23028\n"
     "wrapped@resource://path/data/content/bundle.js:7270:25"},
    {"SAFARI_6",
     "@http://path/to/file.js:48\n"
     "dumpException3@http://path/to/file.js:52\n"
     "onclick@http://path/to/file.js:82\n"
     "[native code]"},
    {"SAFARI_7",
     "http://path/to/file.js:48:22\n"
     "foo@http://path/to/file.js:52:15\n"
     "bar@http://path/to/file.js:108:107"},
    {"SAFARI_8",
     "http://path/to/file.js:47:22\n"
     "foo@http://path/to/file.js:52:15\n"
     "bar@http://path/to/file.js:108:23"},
    {"SAFARI_8_EVAL",
     "eval code\n"
     "eval@[native code]\n"
     "foo@http://path/to/file.js:58:21\n"
     "bar@http://path/to/file.js:109:91"},
    {"IE_10",
     "TypeError: Unable to get property 'undef' of undefined or null reference\n"
     "   at Anonymous function (http://path/to/file.js:48:13)\n"
     "   at foo (http://path/to/file.js:46:9)\n"
     "   at bar (http://path/to/file.js:82:1)"},
    {"IE_11",
     "TypeError: Unable to get property 'undef' of undefined or null reference\n"
     "   at Anonymous function (http://path/to/file.js:47:21)\n"
     "   at foo (http://path/to/file.js:45:13)\n"
     "   at bar (http://path/to/file.js:108:1)"},
    {"IE_11_EVAL",
     "ReferenceError: 'getExceptionProps' is undefined\n"
     "   at eval code (eval code:1:1)\n"
     "   at foo (http://path/to/file.js:58:17)\n"
     "   at bar (http://path/to/file.js:109:1)"},
    {"CHROME_48_BLOB",
     "Error: test\n"
     "    at Error (native)\n"
     "    at s (blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:31:29146)\n"
     "    at Object.d [as add] (blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:31:30039)\n"
     "    at blob:http%3A//localhost%3A8080/d4eefe0f-361a-4682-b217-76587d9f712a:15:10978\n"
     "    at blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:1:6911\n"
     "    at n.fire (blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:7:3019)\n"
     "    at n.handle (blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:7:2863)"},
    {"CHROME_48_EVAL",
     "Error: message string\n"
     "at baz (eval at foo (eval at speak (http://localhost:8080/file.js:21:17)), <anonymous>:1:30)\n"
     "at foo (eval at speak (http://localhost:8080/file.js:21:17), <anonymous>:2:96)\n"
     "at eval (eval at speak (http://localhost:8080/file.js:21:17), <anonymous>:4:18)\n"
     "at Object.speak (http://localhost:8080/file.js:21:17)\n"
     "at http://localhost:8080/file.js:31:13\n"},
    {"PHANTOMJS_1_19",
     "Error: foo\n"
     "    at file:///path/to/file.js:878\n"
     "    at foo (http://path/to/file.js:4283)\n"
     "    at http://path/to/file.js:4287"},
    {"ANDROID_REACT_NATIVE",
     "Error: test\n"
     "at render(/home/username/sample-workspace/sampleapp.collect.react/src/components/GpsMonitorScene.js:78:24)\n"
     "at _renderValidatedComponentWithoutOwnerOrContext(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js:1050:29)\n"
     "at _renderValidatedComponent(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js:1075:15)\n"
     "at renderedElement(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js:484:29)\n"
     "at _currentElement(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js:346:40)\n"
     "at child(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactReconciler.js:68:25)\n"
     "at children(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactMultiChild.js:264:10)\n"
     "at this(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/native/ReactNativeBaseComponent.js:74:41)\n"},
    {"ANDROID_REACT_NATIVE_PROD",
     "value@index.android.bundle:12:1917\n"
     "onPress@index.android.bundle:12:2336\n"
     "touchableHandlePress@index.android.bundle:258:1497\n"
     "[native code]\n"
     "_performSideEffectsForTransition@index.android.bundle:252:8508\n"
     "[native code]\n"
     "_receiveSignal@index.android.bundle:252:7291\n"
     "[native code]\n"
     "touchableHandleResponderRelease@index.android.bundle:252:4735\n"
     "[native code]\n"
     "u@index.android.bundle:79:142\n"
     "invokeGuardedCallback@index.android.bundle:79:459\n"
     "invokeGuardedCallbackAndCatchFirstError@index.android.bundle:79:580\n"
     "c@index.android.bundle:95:365\n"
     "a@index.android.bundle:95:567\n"
     "v@index.android.bundle:146:501\n"
     "g@index.android.bundle:146:604\n"
     "forEach@[native code]\n"
     "i@index.android.bundle:149:80\n"
     "processEventQueue@index.android.bundle:146:1432\n"
     "s@index.android.bundle:157:88\n"
     "handleTopLevel@index.android.bundle:157:174\n"
     "index.android.bundle:156:572\n"
     "a@index.android.bundle:93:276\n"
     "c@index.android.bundle:93:60\n"
     "perform@index.android.bundle:177:596\n"
     "batchedUpdates@index.android.bundle:188:464\n"
     "i@index.android.bundle:176:358\n"
     "i@index.android.bundle:93:90\n"
     "u@index.android.bundle:93:150\n"
     "_receiveRootNodeIDEvent@index.android.bundle:156:544\n"
     "receiveTouches@index.android.bundle:156:918\n"
     "value@index.android.bundle:29:3016\n"
     "index.android.bundle:29:955\n"
     "value@index.android.bundle:29:2417\n"
     "value@index.android.bundle:29:927\n"
     "[native code]"},
    {"IOS_REACT_NATIVE_1",
     "_exampleFunction@/home/test/project/App.js:125:13\n"
     "_depRunCallbacks@/home/test/project/node_modules/dep/index.js:77:45\n"
     "tryCallTwo@/home/test/project/node_modules/react-native/node_modules/promise/lib/core.js:45:5\n"
     "doResolve@/home/test/project/node_modules/react-native/node_modules/promise/lib/core.js:200:13"},
    {"IOS_REACT_NATIVE_2",
     "s@33.js:1:531\n"
     "b@1959.js:1:1469\n"
     "onSocketClose@2932.js:1:727\n"
     "value@81.js:1:1505\n"
     "102.js:1:2956\n"
     "value@89.js:1:1247\n"
     "value@42.js:1:3311\n"
     "42.js:1:822\n"
     "value@42.js:1:2565\n"
     "value@42.js:1:794\n"
     "value@[native code]"},

    {"ANONYMOUS_SOURCES",
     "x\n"
     "at new <anonymous> (http://www.example.com/test.js:2:1\n"
     "at <anonymous>:1:2\n"},
    {"NODE_JS_TEST_1",
     "ReferenceError: test is not defined\n"
     "at repl:1:2\n"
     "at REPLServer.self.eval (repl.js:110:21)\n"
     "at Interface.<anonymous> (repl.js:239:12)\n"
     "at Interface.EventEmitter.emit (events.js:95:17)\n"
     "at emitKey (readline.js:1095:12)\n"},
    {"NODE_JS_TEST_2",
     "ReferenceError: breakDown is not defined\n"
     "at null._onTimeout (repl:1:25)\n"
     "at Timer.listOnTimeout [as ontimeout] (timers.js:110:15)\n"},
    {"IO_JS",
     "ReferenceError: test is not defined\n"
     "at repl:1:1\n"
     "at REPLServer.defaultEval (repl.js:154:27)\n"
     "at bound (domain.js:254:14)\n"
     "at REPLServer.runBound [as eval] (domain.js:267:12)\n"
     "at REPLServer.<anonymous> (repl.js:308:12)\n"
     "at emitOne (events.js:77:13)\n"
     "at REPLServer.emit (events.js:169:7)\n"
     "at REPLServer.Interface._onLine (readline.js:210:10)\n"
     "at REPLServer.Interface._line (readline.js:549:8)\n"
     "at REPLServer.Interface._ttyWrite (readline.js:826:14)\n"}};

TEST(StackTraceParser, nodeWithSpaceInPath) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["NODE_SPACE"]);
  EXPECT_EQ(actualStackFrames.size(), 9);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = R"(C:\project files\spect\src\index.js)",
        .methodName = "Spect.get",
        .lineNumber = 161,
        .column = 25},
       {.file = R"(C:\project files\spect\src\index.js)",
        .methodName = "Object.get",
        .lineNumber = 43,
        .column = 35},
       {.file = R"(C:\project files\spect\src\index.js)",
        .methodName = "(anonymous function).then",
        .lineNumber = 165,
        .column = 32},
       {.file = "internal/process/task_queues.js",
        .methodName = "process.runNextTicks [as _tickCallback]",
        .lineNumber = 52,
        .column = 4},
       {.file = R"(C:\project files\spect\node_modules\esm\esm.js)",
        .methodName = "<unknown>",
        .lineNumber = 1,
        .column = 34534},
       {.file = R"(C:\project files\spect\node_modules\esm\esm.js)",
        .methodName = "<unknown>",
        .lineNumber = 1,
        .column = 34175},
       {.file = R"(C:\project files\spect\node_modules\esm\esm.js)",
        .methodName = "process.<anonymous>",
        .lineNumber = 1,
        .column = 34505},
       {.file = R"(C:\project files\spect\node_modules\esm\esm.js)",
        .methodName = "Function.<anonymous>",
        .lineNumber = 1,
        .column = 296855},
       {.file = R"(C:\project files\spect\node_modules\esm\esm.js)",
        .methodName = "Function.<anonymous>",
        .lineNumber = 1,
        .column = 296554}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, javaScriptCore) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["IOS_REACT_NATIVE_1"]);
  EXPECT_EQ(actualStackFrames.size(), 4);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames = {
      {.file = "/home/test/project/App.js",
       .methodName = "_exampleFunction",
       .lineNumber = 125,
       .column = 12},
      {.file = "/home/test/project/node_modules/dep/index.js",
       .methodName = "_depRunCallbacks",
       .lineNumber = 77,
       .column = 44},
      {.file =
           "/home/test/project/node_modules/react-native/node_modules/promise/lib/core.js",
       .methodName = "tryCallTwo",
       .lineNumber = 45,
       .column = 4},
      {.file =
           "/home/test/project/node_modules/react-native/node_modules/promise/lib/core.js",
       .methodName = "doResolve",
       .lineNumber = 200,
       .column = 12}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, errorInReactNative) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["IOS_REACT_NATIVE_2"]);
  EXPECT_EQ(actualStackFrames.size(), 11);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "33.js", .methodName = "s", .lineNumber = 1, .column = 530},
       {.file = "1959.js", .methodName = "b", .lineNumber = 1, .column = 1468},
       {.file = "2932.js",
        .methodName = "onSocketClose",
        .lineNumber = 1,
        .column = 726},
       {.file = "81.js",
        .methodName = "value",
        .lineNumber = 1,
        .column = 1504},
       {.file = "102.js",
        .methodName = "<unknown>",
        .lineNumber = 1,
        .column = 2955},
       {.file = "89.js",
        .methodName = "value",
        .lineNumber = 1,
        .column = 1246},
       {.file = "42.js",
        .methodName = "value",
        .lineNumber = 1,
        .column = 3310},
       {.file = "42.js",
        .methodName = "<unknown>",
        .lineNumber = 1,
        .column = 821},
       {.file = "42.js",
        .methodName = "value",
        .lineNumber = 1,
        .column = 2564},
       {.file = "42.js", .methodName = "value", .lineNumber = 1, .column = 793},
       {.file = "[native code]",
        .methodName = "value",
        .lineNumber = std::nullopt,
        .column = std::nullopt}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, simpleJavaScriptCoreErrors) {
  auto actualStackFrames =
      StackTraceParser::parse(false, "global code@stack_traces/test:83:55");
  EXPECT_EQ(actualStackFrames.size(), 1);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "stack_traces/test",
        .methodName = "global code",
        .lineNumber = 83,
        .column = 54}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, safari6Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["SAFARI_6"]);
  EXPECT_EQ(actualStackFrames.size(), 4);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://path/to/file.js",
        .methodName = "<unknown>",
        .lineNumber = 48,
        .column = std::nullopt},
       {.file = "http://path/to/file.js",
        .methodName = "dumpException3",
        .lineNumber = 52,
        .column = std::nullopt},
       {.file = "http://path/to/file.js",
        .methodName = "onclick",
        .lineNumber = 82,
        .column = std::nullopt},
       {.file = "[native code]",
        .methodName = "<unknown>",
        .lineNumber = std::nullopt,
        .column = std::nullopt}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, safari7Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["SAFARI_7"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://path/to/file.js",
        .methodName = "<unknown>",
        .lineNumber = 48,
        .column = 21},
       {.file = "http://path/to/file.js",
        .methodName = "foo",
        .lineNumber = 52,
        .column = 14},
       {.file = "http://path/to/file.js",
        .methodName = "bar",
        .lineNumber = 108,
        .column = 106}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, safari8Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["SAFARI_8"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://path/to/file.js",
        .methodName = "<unknown>",
        .lineNumber = 47,
        .column = 21},
       {.file = "http://path/to/file.js",
        .methodName = "foo",
        .lineNumber = 52,
        .column = 14},
       {.file = "http://path/to/file.js",
        .methodName = "bar",
        .lineNumber = 108,
        .column = 22}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, safari8EvalError) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["SAFARI_8_EVAL"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "[native code]",
        .methodName = "eval",
        .lineNumber = std::nullopt,
        .column = std::nullopt},
       {.file = "http://path/to/file.js",
        .methodName = "foo",
        .lineNumber = 58,
        .column = 20},
       {.file = "http://path/to/file.js",
        .methodName = "bar",
        .lineNumber = 109,
        .column = 90}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, firefox3Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["FIREFOX_3"]);
  EXPECT_EQ(actualStackFrames.size(), 7);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://127.0.0.1:8000/js/stacktrace.js",
        .methodName = "<unknown>",
        .lineNumber = 44,
        .column = std::nullopt},
       {.file = "http://127.0.0.1:8000/js/stacktrace.js",
        .methodName = "<unknown>",
        .lineNumber = 31,
        .column = std::nullopt},
       {.file = "http://127.0.0.1:8000/js/stacktrace.js",
        .methodName = "printStackTrace",
        .lineNumber = 18,
        .column = std::nullopt},
       {.file = "http://127.0.0.1:8000/js/file.js",
        .methodName = "bar",
        .lineNumber = 13,
        .column = std::nullopt},
       {.file = "http://127.0.0.1:8000/js/file.js",
        .methodName = "bar",
        .lineNumber = 16,
        .column = std::nullopt},
       {.file = "http://127.0.0.1:8000/js/file.js",
        .methodName = "foo",
        .lineNumber = 20,
        .column = std::nullopt},
       {.file = "http://127.0.0.1:8000/js/file.js",
        .methodName = "<unknown>",
        .lineNumber = 24,
        .column = std::nullopt}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, firefox7Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["FIREFOX_7"]);
  EXPECT_EQ(actualStackFrames.size(), 7);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "file:///G:/js/stacktrace.js",
        .methodName = "<unknown>",
        .lineNumber = 44,
        .column = std::nullopt},
       {.file = "file:///G:/js/stacktrace.js",
        .methodName = "<unknown>",
        .lineNumber = 31,
        .column = std::nullopt},
       {.file = "file:///G:/js/stacktrace.js",
        .methodName = "printStackTrace",
        .lineNumber = 18,
        .column = std::nullopt},
       {.file = "file:///G:/js/file.js",
        .methodName = "bar",
        .lineNumber = 13,
        .column = std::nullopt},
       {.file = "file:///G:/js/file.js",
        .methodName = "bar",
        .lineNumber = 16,
        .column = std::nullopt},
       {.file = "file:///G:/js/file.js",
        .methodName = "foo",
        .lineNumber = 20,
        .column = std::nullopt},
       {.file = "file:///G:/js/file.js",
        .methodName = "<unknown>",
        .lineNumber = 24,
        .column = std::nullopt}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, firefox14Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["FIREFOX_14"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://path/to/file.js",
        .methodName = "<unknown>",
        .lineNumber = 48,
        .column = std::nullopt},
       {.file = "http://path/to/file.js",
        .methodName = "dumpException3",
        .lineNumber = 52,
        .column = std::nullopt},
       {.file = "http://path/to/file.js",
        .methodName = "onclick",
        .lineNumber = 1,
        .column = std::nullopt}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, firefox31Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["FIREFOX_31"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://path/to/file.js",
        .methodName = "foo",
        .lineNumber = 41,
        .column = 12},
       {.file = "http://path/to/file.js",
        .methodName = "bar",
        .lineNumber = 1,
        .column = 0},
       {.file = "http://path/to/file.js",
        .methodName = ".plugin/e.fn[c]/<",
        .lineNumber = 1,
        .column = 0}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, firefox44) {
  auto actualStackFrames = StackTraceParser::parse(
      false, CapturedExceptions["FIREFOX_44_NS_EXCEPTION"]);
  EXPECT_EQ(actualStackFrames.size(), 4);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://path/to/file.js",
        .methodName = "[2]</Bar.prototype._baz/</<",
        .lineNumber = 703,
        .column = 27},
       {.file = "file:///path/to/file.js",
        .methodName = "App.prototype.foo",
        .lineNumber = 15,
        .column = 1},
       {.file = "file:///path/to/file.js",
        .methodName = "bar",
        .lineNumber = 20,
        .column = 2},
       {.file = "file:///path/to/index.html",
        .methodName = "<unknown>",
        .lineNumber = 23,
        .column = 0}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, chromeErrorWithNoLocation) {
  auto actualStackFrames =
      StackTraceParser::parse(false, "error\n at Array.forEach (native)");
  EXPECT_EQ(actualStackFrames.size(), 1);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = std::nullopt,
        .methodName = "Array.forEach",
        .lineNumber = std::nullopt,
        .column = std::nullopt}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, chrome15Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["CHROME_15"]);
  EXPECT_EQ(actualStackFrames.size(), 4);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://path/to/file.js",
        .methodName = "bar",
        .lineNumber = 13,
        .column = 16},
       {.file = "http://path/to/file.js",
        .methodName = "bar",
        .lineNumber = 16,
        .column = 4},
       {.file = "http://path/to/file.js",
        .methodName = "foo",
        .lineNumber = 20,
        .column = 4},
       {.file = "http://path/to/file.js",
        .methodName = "<unknown>",
        .lineNumber = 24,
        .column = 3}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, chrome36Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["CHROME_36"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://localhost:8080/file.js",
        .methodName = "dumpExceptionError",
        .lineNumber = 41,
        .column = 26},
       {.file = "http://localhost:8080/file.js",
        .methodName = "HTMLButtonElement.onclick",
        .lineNumber = 107,
        .column = 145},
       {.file = "http://localhost:8080/file.js",
        .methodName = "I.e.fn.(anonymous function) [as index]",
        .lineNumber = 10,
        .column = 3650}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, chrome76Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["CHROME_76"]);
  EXPECT_EQ(actualStackFrames.size(), 2);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "<anonymous>",
        .methodName = "bar",
        .lineNumber = 8,
        .column = 8},
       {.file = "<anonymous>",
        .methodName = "async foo",
        .lineNumber = 2,
        .column = 2}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, chromeErrorWithWebpackURLS) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["CHROME_XX_WEBPACK"]);
  EXPECT_EQ(actualStackFrames.size(), 5);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "webpack:///./src/components/test/test.jsx?",
        .methodName = "TESTTESTTEST.eval",
        .lineNumber = 295,
        .column = 107},
       {.file = "webpack:///./src/components/test/test.jsx?",
        .methodName = "TESTTESTTEST.render",
        .lineNumber = 272,
        .column = 31},
       {.file = "webpack:///./~/react-transform-catch-errors/lib/index.js?",
        .methodName = "TESTTESTTEST.tryRender",
        .lineNumber = 34,
        .column = 30},
       {.file = "webpack:///./~/react-proxy/modules/createPrototypeProxy.js?",
        .methodName = "TESTTESTTEST.proxiedMethod",
        .lineNumber = 44,
        .column = 29},
       {.file = R"(C:\root\server\development\pages\index.js)",
        .methodName = "Module../pages/index.js",
        .lineNumber = 182,
        .column = 6}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, nestedEvalsFromChrome) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["CHROME_48_EVAL"]);
  EXPECT_EQ(actualStackFrames.size(), 5);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://localhost:8080/file.js",
        .methodName = "baz",
        .lineNumber = 21,
        .column = 16},
       {.file = "http://localhost:8080/file.js",
        .methodName = "foo",
        .lineNumber = 21,
        .column = 16},
       {.file = "http://localhost:8080/file.js",
        .methodName = "eval",
        .lineNumber = 21,
        .column = 16},
       {.file = "http://localhost:8080/file.js",
        .methodName = "Object.speak",
        .lineNumber = 21,
        .column = 16},
       {.file = "http://localhost:8080/file.js",
        .methodName = "<unknown>",
        .lineNumber = 31,
        .column = 12}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, chromeErrorWithBlobURLs) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["CHROME_48_BLOB"]);
  EXPECT_EQ(actualStackFrames.size(), 7);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames = {
      {.file = std::nullopt,
       .methodName = "Error",
       .lineNumber = std::nullopt,
       .column = std::nullopt},
      {.file =
           "blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379",
       .methodName = "s",
       .lineNumber = 31,
       .column = 29145},
      {.file =
           "blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379",
       .methodName = "Object.d [as add]",
       .lineNumber = 31,
       .column = 30038},
      {.file =
           "blob:http%3A//localhost%3A8080/d4eefe0f-361a-4682-b217-76587d9f712a",
       .methodName = "<unknown>",
       .lineNumber = 15,
       .column = 10977},
      {.file =
           "blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379",
       .methodName = "<unknown>",
       .lineNumber = 1,
       .column = 6910},
      {.file =
           "blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379",
       .methodName = "n.fire",
       .lineNumber = 7,
       .column = 3018},
      {.file =
           "blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379",
       .methodName = "n.handle",
       .lineNumber = 7,
       .column = 2862}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, ie10Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["IE_10"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://path/to/file.js",
        .methodName = "Anonymous function",
        .lineNumber = 48,
        .column = 12},
       {.file = "http://path/to/file.js",
        .methodName = "foo",
        .lineNumber = 46,
        .column = 8},
       {.file = "http://path/to/file.js",
        .methodName = "bar",
        .lineNumber = 82,
        .column = 0}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, ie11Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["IE_11"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://path/to/file.js",
        .methodName = "Anonymous function",
        .lineNumber = 47,
        .column = 20},
       {.file = "http://path/to/file.js",
        .methodName = "foo",
        .lineNumber = 45,
        .column = 12},
       {.file = "http://path/to/file.js",
        .methodName = "bar",
        .lineNumber = 108,
        .column = 0}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, ie11EvalError) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["IE_11_EVAL"]);
  EXPECT_EQ(actualStackFrames.size(), 3);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "eval code",
        .methodName = "eval code",
        .lineNumber = 1,
        .column = 0},
       {.file = "http://path/to/file.js",
        .methodName = "foo",
        .lineNumber = 58,
        .column = 16},
       {.file = "http://path/to/file.js",
        .methodName = "bar",
        .lineNumber = 109,
        .column = 0}};
  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, Opera25Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["OPERA_25"]);
  EXPECT_EQ(actualStackFrames.size(), 3);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://path/to/file.js",
        .methodName = "<unknown>",
        .lineNumber = 47,
        .column = 21},
       {.file = "http://path/to/file.js",
        .methodName = "foo",
        .lineNumber = 52,
        .column = 14},
       {.file = "http://path/to/file.js",
        .methodName = "bar",
        .lineNumber = 108,
        .column = 167}};
  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, PhantomJS119Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["PHANTOMJS_1_19"]);
  EXPECT_EQ(actualStackFrames.size(), 3);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "file:///path/to/file.js",
        .methodName = "<unknown>",
        .lineNumber = 878,
        .column = std::nullopt},
       {.file = "http://path/to/file.js",
        .methodName = "foo",
        .lineNumber = 4283,
        .column = std::nullopt},
       {.file = "http://path/to/file.js",
        .methodName = "<unknown>",
        .lineNumber = 4287,
        .column = std::nullopt}};
  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, FirefoxResourceUrlError) {
  auto actualStackFrames = StackTraceParser::parse(
      false, CapturedExceptions["FIREFOX_50_RESOURCE_URL"]);
  EXPECT_EQ(actualStackFrames.size(), 3);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "resource://path/data/content/bundle.js",
        .methodName = "render",
        .lineNumber = 5529,
        .column = 15}};
  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, FirefoxEvalUrlError) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["FIREFOX_43_EVAL"]);
  EXPECT_EQ(actualStackFrames.size(), 5);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://localhost:8080/file.js",
        .methodName = "baz",
        .lineNumber = 26,
        .column = std::nullopt},
       {.file = "http://localhost:8080/file.js",
        .methodName = "foo",
        .lineNumber = 26,
        .column = std::nullopt},
       {.file = "http://localhost:8080/file.js",
        .methodName = "<unknown>",
        .lineNumber = 26,
        .column = std::nullopt},
       {.file = "http://localhost:8080/file.js",
        .methodName = "speak",
        .lineNumber = 26,
        .column = 16},
       {.file = "http://localhost:8080/file.js",
        .methodName = "<unknown>",
        .lineNumber = 33,
        .column = 8}};
  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, ReactNativeAndroidError) {
  auto actualStackFrames = StackTraceParser::parse(
      false, CapturedExceptions["ANDROID_REACT_NATIVE"]);
  EXPECT_EQ(actualStackFrames.size(), 8);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames = {
      {.file =
           "/home/username/sample-workspace/sampleapp.collect.react/src/components/GpsMonitorScene.js",
       .methodName = "render",
       .lineNumber = 78,
       .column = 23},
      {.file =
           "/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/native/ReactNativeBaseComponent.js",
       .methodName = "this",
       .lineNumber = 74,
       .column = 40}};

  EXPECT_EQ(actualStackFrames[0].column, expectedStackFrames[0].column);
  EXPECT_EQ(actualStackFrames[0].file, expectedStackFrames[0].file);
  EXPECT_EQ(actualStackFrames[0].lineNumber, expectedStackFrames[0].lineNumber);
  EXPECT_EQ(actualStackFrames[0].methodName, expectedStackFrames[0].methodName);

  EXPECT_EQ(actualStackFrames[7].column, expectedStackFrames[1].column);
  EXPECT_EQ(actualStackFrames[7].file, expectedStackFrames[1].file);
  EXPECT_EQ(actualStackFrames[7].lineNumber, expectedStackFrames[1].lineNumber);
  EXPECT_EQ(actualStackFrames[7].methodName, expectedStackFrames[1].methodName);
}

TEST(StackTraceParser, ReactNativeAndroidProdError) {
  auto actualStackFrames = StackTraceParser::parse(
      false, CapturedExceptions["ANDROID_REACT_NATIVE_PROD"]);
  EXPECT_EQ(actualStackFrames.size(), 37);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "index.android.bundle",
        .methodName = "value",
        .lineNumber = 12,
        .column = 1916},
       {.file = "index.android.bundle",
        .methodName = "value",
        .lineNumber = 29,
        .column = 926},
       {.file = "[native code]",
        .methodName = "<unknown>",
        .lineNumber = std::nullopt,
        .column = std::nullopt}};
  EXPECT_EQ(actualStackFrames[0].column, expectedStackFrames[0].column);
  EXPECT_EQ(actualStackFrames[0].file, expectedStackFrames[0].file);
  EXPECT_EQ(actualStackFrames[0].lineNumber, expectedStackFrames[0].lineNumber);
  EXPECT_EQ(actualStackFrames[0].methodName, expectedStackFrames[0].methodName);

  EXPECT_EQ(actualStackFrames[35].column, expectedStackFrames[1].column);
  EXPECT_EQ(actualStackFrames[35].file, expectedStackFrames[1].file);
  EXPECT_EQ(
      actualStackFrames[35].lineNumber, expectedStackFrames[1].lineNumber);
  EXPECT_EQ(
      actualStackFrames[35].methodName, expectedStackFrames[1].methodName);

  EXPECT_EQ(actualStackFrames[36].column, expectedStackFrames[2].column);
  EXPECT_EQ(actualStackFrames[36].file, expectedStackFrames[2].file);
  EXPECT_EQ(
      actualStackFrames[36].lineNumber, expectedStackFrames[2].lineNumber);
  EXPECT_EQ(
      actualStackFrames[36].methodName, expectedStackFrames[2].methodName);
}

TEST(StackTraceParser, NodeJsAsyncErrorsVersion12) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["NODE_12"]);
  EXPECT_EQ(actualStackFrames.size(), 2);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "/home/xyz/hack/asyncnode.js",
        .methodName = "promiseMe",
        .lineNumber = 11,
        .column = 8},
       {.file = "/home/xyz/hack/asyncnode.js",
        .methodName = "async main",
        .lineNumber = 15,
        .column = 12}};

  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, NodeJsErrorsWithAnonymousCalls) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["NODE_ANONYM"]);
  EXPECT_EQ(actualStackFrames.size(), 9);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = R"(C:\projects\spect\src\index.js)",
        .methodName = "Spect.get",
        .lineNumber = 161,
        .column = 25},
       {.file = R"(C:\projects\spect\src\index.js)",
        .methodName = "(anonymous function).then",
        .lineNumber = 165,
        .column = 32},
       {.file = R"(C:\projects\spect\node_modules\esm\esm.js)",
        .methodName = "<unknown>",
        .lineNumber = 1,
        .column = 34534},
       {.file = R"(C:\projects\spect\node_modules\esm\esm.js)",
        .methodName = "process.<anonymous>",
        .lineNumber = 1,
        .column = 34505}};
  // Check specific stack frames as per the JavaScript test
  EXPECT_EQ(actualStackFrames[0].column, expectedStackFrames[0].column);
  EXPECT_EQ(actualStackFrames[0].file, expectedStackFrames[0].file);
  EXPECT_EQ(actualStackFrames[0].lineNumber, expectedStackFrames[0].lineNumber);
  EXPECT_EQ(actualStackFrames[0].methodName, expectedStackFrames[0].methodName);

  EXPECT_EQ(actualStackFrames[2].column, expectedStackFrames[1].column);
  EXPECT_EQ(actualStackFrames[2].file, expectedStackFrames[1].file);
  EXPECT_EQ(actualStackFrames[2].lineNumber, expectedStackFrames[1].lineNumber);
  EXPECT_EQ(actualStackFrames[2].methodName, expectedStackFrames[1].methodName);

  EXPECT_EQ(actualStackFrames[4].column, expectedStackFrames[2].column);
  EXPECT_EQ(actualStackFrames[4].file, expectedStackFrames[2].file);
  EXPECT_EQ(actualStackFrames[4].lineNumber, expectedStackFrames[2].lineNumber);
  EXPECT_EQ(actualStackFrames[4].methodName, expectedStackFrames[2].methodName);

  EXPECT_EQ(actualStackFrames[6].column, expectedStackFrames[3].column);
  EXPECT_EQ(actualStackFrames[6].file, expectedStackFrames[3].file);
  EXPECT_EQ(actualStackFrames[6].lineNumber, expectedStackFrames[3].lineNumber);
  EXPECT_EQ(actualStackFrames[6].methodName, expectedStackFrames[3].methodName);
}

TEST(StackTraceParser, AnonymousSources) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["ANONYMOUS_SOURCES"]);
  EXPECT_EQ(actualStackFrames.size(), 2);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "http://www.example.com/test.js",
        .methodName = "new <anonymous>",
        .lineNumber = 2,
        .column = 0},
       {.file = "<anonymous>",
        .methodName = "<unknown>",
        .lineNumber = 1,
        .column = 1}};

  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, NodeJsTest1) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["NODE_JS_TEST_1"]);
  EXPECT_EQ(actualStackFrames.size(), 5);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "repl",
        .methodName = "<unknown>",
        .lineNumber = 1,
        .column = 1},
       {.file = "repl.js",
        .methodName = "REPLServer.self.eval",
        .lineNumber = 110,
        .column = 20},
       {.file = "repl.js",
        .methodName = "Interface.<anonymous>",
        .lineNumber = 239,
        .column = 11},
       {.file = "events.js",
        .methodName = "Interface.EventEmitter.emit",
        .lineNumber = 95,
        .column = 16},
       {.file = "readline.js",
        .methodName = "emitKey",
        .lineNumber = 1095,
        .column = 11}};
  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, NodeJsTest2) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["NODE_JS_TEST_2"]);
  EXPECT_EQ(actualStackFrames.size(), 2);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "repl",
        .methodName = "null._onTimeout",
        .lineNumber = 1,
        .column = 24},
       {.file = "timers.js",
        .methodName = "Timer.listOnTimeout [as ontimeout]",
        .lineNumber = 110,
        .column = 14}};
  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, IoJs) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["IO_JS"]);
  EXPECT_EQ(actualStackFrames.size(), 10);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "repl",
        .methodName = "<unknown>",
        .lineNumber = 1,
        .column = 0},
       {.file = "repl.js",
        .methodName = "REPLServer.defaultEval",
        .lineNumber = 154,
        .column = 26},
       {.file = "domain.js",
        .methodName = "bound",
        .lineNumber = 254,
        .column = 13},
       {.file = "domain.js",
        .methodName = "REPLServer.runBound [as eval]",
        .lineNumber = 267,
        .column = 11},
       {.file = "repl.js",
        .methodName = "REPLServer.<anonymous>",
        .lineNumber = 308,
        .column = 11},
       {.file = "events.js",
        .methodName = "emitOne",
        .lineNumber = 77,
        .column = 12},
       {.file = "events.js",
        .methodName = "REPLServer.emit",
        .lineNumber = 169,
        .column = 6},
       {.file = "readline.js",
        .methodName = "REPLServer.Interface._onLine",
        .lineNumber = 210,
        .column = 9},
       {.file = "readline.js",
        .methodName = "REPLServer.Interface._line",
        .lineNumber = 549,
        .column = 7},
       {.file = "readline.js",
        .methodName = "REPLServer.Interface._ttyWrite",
        .lineNumber = 826,
        .column = 13}};
  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

/**
 * Hermes tests
 */
TEST(StackTraceParser, hermesBytecodeLocation) {
  auto actualStackFrames = StackTraceParser::parse(
      true,
      "TypeError: undefined is not a function\n"
      "    at global (address at unknown:1:9)\n"
      "    at foo$bar (address at /js/foo.hbc:10:1234)");

  EXPECT_EQ(actualStackFrames.size(), 2);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "unknown",
        .methodName = "global",
        .lineNumber = 1,
        .column = 9},
       {.file = "/js/foo.hbc",
        .methodName = "foo$bar",
        .lineNumber = 10,
        .column = 1234}};

  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, internalBytecodeLocation) {
  auto actualStackFrames = StackTraceParser::parse(
      true,
      "TypeError: undefined is not a function\n"
      "    at internal (address at InternalBytecode.js:1:9)\n"
      "    at notInternal (address at /js/InternalBytecode.js:10:1234)");
  EXPECT_EQ(actualStackFrames.size(), 1);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "/js/InternalBytecode.js",
        .methodName = "notInternal",
        .lineNumber = 10,
        .column = 1234}};

  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, sourceLocation) {
  auto actualStackFrames = StackTraceParser::parse(
      true,
      "TypeError: undefined is not a function\n"
      "    at global (unknown:1:9)\n"
      "    at foo$bar (/js/foo.js:10:1234)");
  EXPECT_EQ(actualStackFrames.size(), 2);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "unknown",
        .methodName = "global",
        .lineNumber = 1,
        .column = 8},
       {.file = "/js/foo.js",
        .methodName = "foo$bar",
        .lineNumber = 10,
        .column = 1233}};

  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, tolerateEmptyFilename) {
  auto actualStackFrames = StackTraceParser::parse(
      true,
      "TypeError: undefined is not a function\n"
      "    at global (unknown:1:9)\n"
      "    at foo$bar (:10:1234)");
  EXPECT_EQ(actualStackFrames.size(), 2);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "unknown",
        .methodName = "global",
        .lineNumber = 1,
        .column = 8},
       {.file = "", .methodName = "foo$bar", .lineNumber = 10, .column = 1233}};
  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, skippedFrames) {
  auto actualStackFrames = StackTraceParser::parse(
      true,
      "TypeError: undefined is not a function\n"
      "    at global (unknown:1:9)\n"
      "    ... skipping 50 frames\n"
      "    at foo$bar (/js/foo.js:10:1234)");
  EXPECT_EQ(actualStackFrames.size(), 2);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "unknown",
        .methodName = "global",
        .lineNumber = 1,
        .column = 8},
       {.file = "/js/foo.js",
        .methodName = "foo$bar",
        .lineNumber = 10,
        .column = 1233}};
  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, handleNonStandardLines) {
  auto actualStackFrames = StackTraceParser::parse(
      true,
      "The next line is not a stack frame\n"
      "    at bogus (filename:1:2)\n"
      "    but the real stack trace follows below.\n"
      "    at foo$bar (/js/foo.js:10:1234)");
  EXPECT_EQ(actualStackFrames.size(), 1);
  std::vector<JsErrorHandler::ProcessedError::StackFrame> expectedStackFrames =
      {{.file = "/js/foo.js",
        .methodName = "foo$bar",
        .lineNumber = 10,
        .column = 1233}};
  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}
