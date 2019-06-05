#include "IndexedRAMBundle.h"
#include <fstream>
#include <sstream>
#include <folly/Memory.h>

namespace facebook {
namespace react {


bool IndexedRAMBundle::isIndexedRAMBundle(const char* sourcePath) {
  std::ifstream bundle_stream(sourcePath, std::ios_base::in);
  BundleHeader header;

  if (!bundle_stream ||
      !bundle_stream.read(reinterpret_cast<char *>(&header), sizeof(header))) {
    return false;
  }

  return parseTypeFromHeader(header) == BundleType::IndexedRAMBundle;
}

bool IndexedRAMBundle::isIndexedRAMBundle(const JSBigString* script) {
  BundleHeader header;
  std::memcpy(reinterpret_cast<char *>(&header),
              script->c_str(),
              sizeof(header));

  return parseTypeFromHeader(header) == BundleType::IndexedRAMBundle;
}

IndexedRAMBundle::IndexedRAMBundle(std::string sourcePath, std::string sourceURL) {
  bundle_ = std::make_unique<std::ifstream>(
    std::ifstream(sourcePath, std::ifstream::binary));
  sourcePath_ = sourcePath;
  sourceURL_ = sourceURL;
  if (!bundle_) {
    throw std::ios_base::failure(
      folly::to<std::string>("Bundle ", sourcePath,
                             "cannot be opened: ", bundle_->rdstate()));
  }
  init();
}

IndexedRAMBundle::IndexedRAMBundle(std::unique_ptr<const JSBigString> script,
                                   std::string sourceURL,
                                   std::string sourcePath) {
  // tmpStream is needed because bundle_ is std::istream type
  // which has no member 'write'
  std::unique_ptr<std::stringstream> tmpStream =
    std::make_unique<std::stringstream>(std::stringstream());
  tmpStream->write(script->c_str(), script->size());
  bundle_ = std::move(tmpStream);
  sourcePath_ = sourcePath;
  sourceURL_ = sourceURL;
  if (!bundle_) {
    throw std::ios_base::failure(
      folly::to<std::string>("Bundle from string cannot be opened: ", bundle_->rdstate()));
  }
  init();
}

void IndexedRAMBundle::init() {
  // read in magic header, number of entries, and length of the startup section
  uint32_t header[3];
  static_assert(
    sizeof(header) == 12,
    "header size must exactly match the input file format");

  readBundle(reinterpret_cast<char *>(header), sizeof(header));
  const size_t numTableEntries = folly::Endian::little(header[1]);
  const size_t startupCodeSize = folly::Endian::little(header[2]);

  // allocate memory for meta data and lookup table.
  table_ = ModuleTable(numTableEntries);
  baseOffset_ = sizeof(header) + table_.byteLength();

  // read the lookup table from the file
  readBundle(
    reinterpret_cast<char *>(table_.data.get()), table_.byteLength());

  // read the startup code
  startupScript_ = std::unique_ptr<JSBigBufferString>(new JSBigBufferString{startupCodeSize - 1});
  readBundle(startupScript_->data(), startupCodeSize - 1);
}

BundleType IndexedRAMBundle::getBundleType() const {
  return BundleType::IndexedRAMBundle;
}

std::string IndexedRAMBundle::getSourceURL() const {
  return sourceURL_;
}

std::string IndexedRAMBundle::getSourcePath() const {
  return sourcePath_;
}

IndexedRAMBundle::Module IndexedRAMBundle::getModule(uint32_t moduleId, const char* bundlePrefix) const {
  Module ret;
  ret.name = folly::to<std::string>(moduleId, ".js");
  if (bundlePrefix) {
    ret.name = folly::to<std::string>(bundlePrefix, "-", ret.name);
  }
  ret.code = getModuleCode(moduleId);
  return ret;
}

std::unique_ptr<const JSBigString> IndexedRAMBundle::getStartupScript() const {
  // It might be used multiple times, so we don't want to move it, but instead copy it.
  std::unique_ptr<JSBigBufferString> script =
    std::make_unique<JSBigBufferString>(startupScript_->size());
  std::memcpy(script->data(), startupScript_->c_str(), startupScript_->size());
  return std::move(script);
}

std::string IndexedRAMBundle::getModuleCode(const uint32_t id) const {
  const auto moduleData = id < table_.numEntries ? &table_.data[id] : nullptr;

  // entries without associated code have offset = 0 and length = 0
  const uint32_t length = moduleData ? folly::Endian::little(moduleData->length) : 0;
  if (length == 0) {
    throw std::ios_base::failure(
      folly::to<std::string>("Error loading module", id, "from RAM Bundle"));
  }

  std::string ret(length - 1, '\0');
  readBundle(&ret.front(), length - 1, baseOffset_ + folly::Endian::little(moduleData->offset));
  return ret;
}

void IndexedRAMBundle::readBundle(char *buffer, const std::streamsize bytes) const {
  if (!bundle_->read(buffer, bytes)) {
    if (bundle_->rdstate() & std::ios::eofbit) {
      throw std::ios_base::failure("Unexpected end of RAM Bundle file");
    }
    throw std::ios_base::failure(
      folly::to<std::string>("Error reading RAM Bundle: ", bundle_->rdstate()));
  }
}

void IndexedRAMBundle::readBundle(
    char *buffer,
    const std::streamsize bytes,
    const std::ifstream::pos_type position) const {

  if (!bundle_->seekg(position)) {
    throw std::ios_base::failure(
      folly::to<std::string>("Error reading RAM Bundle: ", bundle_->rdstate()));
  }
  readBundle(buffer, bytes);
}

}  // namespace react
}  // namespace facebook
