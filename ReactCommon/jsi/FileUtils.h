#pragma once

#include <string>

namespace facebook { namespace react {

class FileUtils {
  public:
      static const char* ReadText(const std::string& filePath, long& length, bool& isNew);
      static std::string ReadText(const std::string& filePath);
      static bool Exists(const std::string& filePath);
      static bool WriteBinary(const std::string& filePath, const void* inData, long length);
      static void* ReadBinary(const std::string& filePath, long& length);
  private:
      static const int BUFFER_SIZE = 1024 * 1024;
      static char* Buffer;
      static const char* WRITE_BINARY;
      static const char* READ_BINARY;
};

}}
