/*
 * Copyright 2017 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#pragma once

#include <chrono>
#include <iosfwd>

#include <folly/portability/SysTypes.h>

namespace folly {

class TimePoint {
 public:
  explicit TimePoint(bool set = true)
    : tid_(0) {
    if (set) {
      reset();
    }
  }

  void reset();

  bool isUnset() const {
    return (timeStart_.time_since_epoch().count() == 0 &&
            timeEnd_.time_since_epoch().count() == 0 &&
            timeWaiting_.count() == 0);
  }

  std::chrono::system_clock::time_point getTime() const {
    return timeStart_;
  }

  std::chrono::system_clock::time_point getTimeStart() const {
    return timeStart_;
  }

  std::chrono::system_clock::time_point getTimeEnd() const {
    return timeStart_;
  }

  std::chrono::milliseconds getTimeWaiting() const {
    return timeWaiting_;
  }

  pid_t getTid() const {
    return tid_;
  }

 private:
  std::chrono::system_clock::time_point timeStart_;
  std::chrono::system_clock::time_point timeEnd_;
  std::chrono::milliseconds timeWaiting_{0};
  pid_t tid_;
};

std::ostream& operator<<(std::ostream& os, const TimePoint& timePoint);

bool checkTimeout(const TimePoint& start,
                  const TimePoint& end,
                  std::chrono::milliseconds expectedMS,
                  bool allowSmaller,
                  std::chrono::milliseconds tolerance =
                  std::chrono::milliseconds(5));

}
