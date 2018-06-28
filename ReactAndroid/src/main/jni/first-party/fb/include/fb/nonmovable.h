/*
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {

struct nonmovable {
  nonmovable(nonmovable&&) = delete;
  nonmovable& operator=(nonmovable&&) = delete;
protected:
  nonmovable() = default;
};

}
