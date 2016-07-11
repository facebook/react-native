/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once
#include <cstring>
#include <string>
#include <sstream>

namespace facebook {

#define FROM_HERE facebook::ProgramLocation(__FUNCTION__, __FILE__, __LINE__)

class ProgramLocation {
public:
  ProgramLocation() : m_functionName("Unspecified"), m_fileName("Unspecified"), m_lineNumber(0) {}

  ProgramLocation(const char* functionName, const char* fileName, int line) :
      m_functionName(functionName),
      m_fileName(fileName),
      m_lineNumber(line)
    {}

  const char* functionName() const { return m_functionName; }
  const char* fileName() const { return m_fileName; }
  int lineNumber() const { return m_lineNumber; }

  std::string asFormattedString() const {
    std::stringstream str;
    str << "Function " << m_functionName << " in file " << m_fileName << ":" << m_lineNumber;
    return str.str();
  }

  bool operator==(const ProgramLocation& other) const {
    // Assumes that the strings are static
    return (m_functionName == other.m_functionName) && (m_fileName == other.m_fileName) && m_lineNumber == other.m_lineNumber;
  }

private:
  const char* m_functionName;
  const char* m_fileName;
  int m_lineNumber;
};

}
