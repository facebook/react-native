/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <exception>
#include <iostream>
#include <stdexcept>

#include <cxxreact/JSDeltaBundleClient.h>
#include <folly/dynamic.h>
#include <folly/json.h>

using namespace facebook::react;

TEST(JSDeltaBundleClient, PatchStartupCode) {
  JSDeltaBundleClient client;

  folly::dynamic delta1 = folly::parseJson(R"({
    "base": true,
    "revisionId": "rev0",
    "pre": "pre",
    "post": "post",
    "modules": [
      [0, "0"],
      [1, "1"]
    ]
  })");

  client.patch(delta1);

  EXPECT_STREQ(client.getStartupCode()->c_str(), "pre\npost\n");

  folly::dynamic delta2 = folly::parseJson(R"({
      "base": true,
      "revisionId": "rev1",
      "pre": "pre2",
      "post": "post2",
      "modules": []
    })");

  client.patch(delta2);

  EXPECT_STREQ(client.getStartupCode()->c_str(), "pre2\npost2\n");
}

TEST(JSDeltaBundleClient, PatchModule) {
  JSDeltaBundleClient client;

  folly::dynamic delta1 = folly::parseJson(R"({
    "base": true,
    "revisionId": "rev0",
    "pre": "pre",
    "post": "post",
    "modules": [
      [0, "0"],
      [1, "1"]
    ]
  })");

  client.patch(delta1);

  EXPECT_EQ(client.getModule(0).code, "0");
  EXPECT_EQ(client.getModule(1).code, "1");

  ASSERT_THROW(client.getModule(2), JSModulesUnbundle::ModuleNotFound);

  folly::dynamic delta2 = folly::parseJson(R"({
    "base": false,
    "revisionId": "rev1",
    "added": [
      [2, "2"]
    ],
    "modified": [
      [0, "0.1"]
    ],
    "deleted": [1]
  })");

  client.patch(delta2);

  EXPECT_EQ(client.getModule(0).code, "0.1");
  EXPECT_EQ(client.getModule(2).code, "2");
  ASSERT_THROW(client.getModule(1), JSModulesUnbundle::ModuleNotFound);

  folly::dynamic delta3 = folly::parseJson(R"({
    "base": true,
    "revisionId": "rev2",
    "pre": "pre",
    "post": "post",
    "modules": [
      [3, "3"],
      [4, "4"]
    ]
  })");

  client.patch(delta3);

  ASSERT_THROW(client.getModule(0), JSModulesUnbundle::ModuleNotFound);
  ASSERT_THROW(client.getModule(1), JSModulesUnbundle::ModuleNotFound);
  ASSERT_THROW(client.getModule(2), JSModulesUnbundle::ModuleNotFound);

  EXPECT_EQ(client.getModule(3).code, "3");
  EXPECT_EQ(client.getModule(4).code, "4");
}

TEST(JSDeltaBundleClient, Clear) {
  JSDeltaBundleClient client;

  folly::dynamic delta1 = folly::parseJson(R"({
    "base": true,
    "revisionId": "rev0",
    "pre": "pre",
    "post": "post",
    "modules": [
      [0, "0"],
      [1, "1"]
    ]
  })");

  client.patch(delta1);

  client.clear();

  ASSERT_THROW(client.getModule(0), JSModulesUnbundle::ModuleNotFound);
  ASSERT_THROW(client.getModule(1), JSModulesUnbundle::ModuleNotFound);

  EXPECT_STREQ(client.getStartupCode()->c_str(), "");
}
