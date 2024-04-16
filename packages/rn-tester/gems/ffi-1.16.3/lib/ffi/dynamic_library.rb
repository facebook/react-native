#
# Copyright (C) 2008-2010 Wayne Meissner
#
# This file is part of ruby-ffi.
#
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#
# * Redistributions of source code must retain the above copyright notice, this
#   list of conditions and the following disclaimer.
# * Redistributions in binary form must reproduce the above copyright notice
#   this list of conditions and the following disclaimer in the documentation
#   and/or other materials provided with the distribution.
# * Neither the name of the Ruby FFI project nor the names of its contributors
#   may be used to endorse or promote products derived from this software
#   without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
# FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
# OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.#

module FFI
  class DynamicLibrary
    SEARCH_PATH = %w[/usr/lib /usr/local/lib /opt/local/lib]
    if FFI::Platform::ARCH == 'aarch64' && FFI::Platform.mac?
      SEARCH_PATH << '/opt/homebrew/lib'
    end

    SEARCH_PATH_MESSAGE = "Searched in <system library path>, #{SEARCH_PATH.join(', ')}".freeze

    def self.load_library(name, flags)
      if name == FFI::CURRENT_PROCESS
        FFI::DynamicLibrary.open(nil, RTLD_LAZY | RTLD_LOCAL)
      else
        flags ||= RTLD_LAZY | RTLD_LOCAL

        libnames = (name.is_a?(::Array) ? name : [name])
        libnames = libnames.map(&:to_s).map { |n| [n, FFI.map_library_name(n)].uniq }.flatten.compact
        errors = []

        libnames.each do |libname|
          lib = try_load(libname, flags, errors)
          return lib if lib

          unless libname.start_with?("/") || FFI::Platform.windows?
            SEARCH_PATH.each do |prefix|
              path = "#{prefix}/#{libname}"
              if File.exist?(path)
                lib = try_load(path, flags, errors)
                return lib if lib
              end
            end
          end
        end

        raise LoadError, [*errors, SEARCH_PATH_MESSAGE].join(".\n")
      end
    end
    private_class_method :load_library

    def self.try_load(libname, flags, errors)
      begin
        lib = FFI::DynamicLibrary.open(libname, flags)
        return lib if lib

      # LoadError for C ext & JRuby, RuntimeError for TruffleRuby
      rescue LoadError, RuntimeError => ex
        if ex.message =~ /(([^ \t()])+\.so([^ \t:()])*):([ \t])*(invalid ELF header|file too short|invalid file format)/
          if File.binread($1) =~ /(?:GROUP|INPUT) *\( *([^ \)]+)/
            return try_load($1, flags, errors)
          end
        end

        errors << ex
        nil
      end
    end
    private_class_method :try_load
  end
end
