#include "File.h"
#include <sstream>
#include <fstream>
#include <sys/mman.h>
#include <assert.h>
#include <errno.h>
#include <v8helpers/V8Utils.h>

using namespace std;

namespace rnv8 {
bool File::Exists(const string& path) {
    std::ifstream infile(path.c_str());
    return infile.good();
}
string File::ReadText(const string& filePath) {
    long len;
    bool isNew;
    const char* content = ReadText(filePath, len, isNew);

    string s(content, len);

    if (isNew) {
        delete[] content;
    }

    return s;
}

void* File::ReadBinary(const string& filePath, long& length) {
    length = 0;
    if (!File::Exists(filePath)) {
        return nullptr;
    }

    auto file = fopen(filePath.c_str(), READ_BINARY);
    if (!file) {
        ReactMarker::logTaggedMarker(ReactMarker::BYTECODE_READ_FAILED, strerror(errno));
        return nullptr;
    }

    if (fseek(file, 0, SEEK_END) == -1) {
        ReactMarker::logTaggedMarker(ReactMarker::BYTECODE_READ_FAILED, strerror(errno));
    }

    length = ftell(file);
    if(length == -1) {
        ReactMarker::logTaggedMarker(ReactMarker::BYTECODE_READ_FAILED, strerror(errno));
    }

    rewind(file);
    uint8_t* data = new uint8_t[length];

    int readBytes = fread(data, sizeof(uint8_t), length, file);
    if (readBytes != length) {
        ReactMarker::logTaggedMarker(ReactMarker::BYTECODE_READ_FAILED, strerror(errno));
    }

    fclose(file);

    return data;
}

bool File::WriteBinary(const string& filePath, const void* data, long length) {
    
	auto file = fopen(filePath.c_str(), WRITE_BINARY);
	//LOGD("V8Executor::WriteBinary entry %s", filePath.c_str());
    if (!file) {
		//LOGD("V8Executor::WriteBinary file is NULL %s", strerror(errno));
        return false;
    }
	//LOGD("V8Executor::WriteBinary after file open ");
    long writtenBytes = fwrite(data, sizeof(uint8_t), length, file);
    fclose(file);
	//LOGD("V8Executor::WriteBinary after file write  ");
    return writtenBytes == length;
}

const char* File::ReadText(const string& filePath, long& charLength, bool& isNew) {
    FILE* file = fopen(filePath.c_str(), "rb");
    fseek(file, 0, SEEK_END);

    charLength = ftell(file);
    isNew = charLength > BUFFER_SIZE;

    rewind(file);

    if (isNew) {
        char* newBuffer = new char[charLength];
        fread(newBuffer, 1, charLength, file);
        fclose(file);

        return newBuffer;
    }

    fread(Buffer, 1, charLength, file);
    fclose(file);

    return Buffer;
}

MemoryMappedFile MemoryMappedFile::Open(const char* filePath) {
    void* memory = nullptr;
    long length = 0;
    if (FILE* file = fopen(filePath, "r+")) {
        if (fseek(file, 0, SEEK_END) == 0) {
            length = ftell(file);
            if (length >= 0) {
                memory = mmap(NULL, length, PROT_READ, MAP_SHARED, fileno(file), 0);
                if (memory == MAP_FAILED) {
                    memory = nullptr;
                }
            }
        }
        fclose(file);
    }
    return MemoryMappedFile(memory, length);
}

MemoryMappedFile::MemoryMappedFile(void* memory, size_t size)
    :
    memory(memory), size(size) {
}

MemoryMappedFile::~MemoryMappedFile() {
    int result = munmap(this->memory, this->size);
    assert(result == 0);
}

char* File::Buffer = new char[BUFFER_SIZE];

const char* File::WRITE_BINARY = "wb";
const char* File::READ_BINARY = "rb";
}
