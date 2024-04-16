#
# Copyright (C) 2008-2010 Wayne Meissner
# Copyright (c) 2007, 2008 Evan Phoenix
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
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#

# see {file:README}
module FFI

  unless defined?(self.custom_typedefs)
    # Truffleruby and JRuby don't support Ractor so far.
    # So they don't need separation between builtin and custom types.
    def self.custom_typedefs
      TypeDefs
    end
    writable_typemap = true
  end

  # @param [Type, DataConverter, Symbol] old type definition used by {FFI.find_type}
  # @param [Symbol] add new type definition's name to add
  # @return [Type]
  # Add a definition type to type definitions.
  #
  # The type definition is local per Ractor.
  def self.typedef(old, add)
    tm = custom_typedefs
    tm[add] = self.find_type(old)
  end

  # (see FFI.typedef)
  def self.add_typedef(old, add)
    typedef old, add
  end

  class << self
    private def __typedef(old, add)
      TypeDefs[add] = self.find_type(old)
    end

    private :custom_typedefs
  end


  # @param [Type, DataConverter, Symbol] name
  # @param [Hash] type_map if nil, {FFI::TypeDefs} is used
  # @return [Type]
  # Find a type in +type_map+ ({FFI::TypeDefs}, by default) from
  # a type objet, a type name (symbol). If +name+ is a {DataConverter},
  # a new {Type::Mapped} is created.
  def self.find_type(name, type_map = nil)
    if name.is_a?(Type)
      name

    elsif type_map&.has_key?(name)
      type_map[name]

    elsif (tm=custom_typedefs).has_key?(name)
      tm[name]

    elsif TypeDefs.has_key?(name)
      TypeDefs[name]

    elsif name.is_a?(DataConverter)
      tm = (type_map || custom_typedefs)
      tm[name] = Type::Mapped.new(name)
    else
      raise TypeError, "unable to resolve type '#{name}'"
    end
  end

  # List of type definitions
  TypeDefs.merge!({
      # The C void type; only useful for function return types
      :void => Type::VOID,

      # C boolean type
      :bool => Type::BOOL,

      # C nul-terminated string
      :string => Type::STRING,

      # C signed char
      :char => Type::CHAR,
      # C unsigned char
      :uchar => Type::UCHAR,

      # C signed short
      :short => Type::SHORT,
      # C unsigned short
      :ushort => Type::USHORT,

      # C signed int
      :int => Type::INT,
      # C unsigned int
      :uint => Type::UINT,

      # C signed long
      :long => Type::LONG,

      # C unsigned long
      :ulong => Type::ULONG,

      # C signed long long integer
      :long_long => Type::LONG_LONG,

      # C unsigned long long integer
      :ulong_long => Type::ULONG_LONG,

      # C single precision float
      :float => Type::FLOAT,

      # C double precision float
      :double => Type::DOUBLE,

      # C long double
      :long_double => Type::LONGDOUBLE,

      # Native memory address
      :pointer => Type::POINTER,

      # 8 bit signed integer
      :int8 => Type::INT8,
      # 8 bit unsigned integer
      :uint8 => Type::UINT8,

      # 16 bit signed integer
      :int16 => Type::INT16,
      # 16 bit unsigned integer
      :uint16 => Type::UINT16,

      # 32 bit signed integer
      :int32 => Type::INT32,
      # 32 bit unsigned integer
      :uint32 => Type::UINT32,

      # 64 bit signed integer
      :int64 => Type::INT64,
      # 64 bit unsigned integer
      :uint64 => Type::UINT64,

      :buffer_in => Type::BUFFER_IN,
      :buffer_out => Type::BUFFER_OUT,
      :buffer_inout => Type::BUFFER_INOUT,

      # Used in function prototypes to indicate the arguments are variadic
      :varargs => Type::VARARGS,
  })

  # This will convert a pointer to a Ruby string (just like `:string`), but
  # also allow to work with the pointer itself. This is useful when you want
  # a Ruby string already containing a copy of the data, but also the pointer
  # to the data for you to do something with it, like freeing it, in case the
  # library handed the memory off to the caller (Ruby-FFI).
  #
  # It's {typedef}'d as +:strptr+.
  class StrPtrConverter
    extend DataConverter
    native_type Type::POINTER

    # @param [Pointer] val
    # @param ctx not used
    # @return [Array(String, Pointer)]
    # Returns a [ String, Pointer ] tuple so the C memory for the string can be freed
    def self.from_native(val, ctx)
      [ val.null? ? nil : val.get_string(0), val ]
    end
  end

  __typedef(StrPtrConverter, :strptr)

  # @param type +type+ is an instance of class accepted by {FFI.find_type}
  # @return [Numeric]
  # Get +type+ size, in bytes.
  def self.type_size(type)
    find_type(type).size
  end

  # Load all the platform dependent types
  begin
    File.open(File.join(Platform::CONF_DIR, 'types.conf'), "r") do |f|
      prefix = "rbx.platform.typedef."
      f.each_line { |line|
        if line.index(prefix) == 0
          new_type, orig_type = line.chomp.slice(prefix.length..-1).split(/\s*=\s*/)
          __typedef(orig_type.to_sym, new_type.to_sym)
        end
      }
    end
    __typedef :pointer, :caddr_t
  rescue Errno::ENOENT
  end

  FFI.make_shareable(TypeDefs) unless writable_typemap
end
