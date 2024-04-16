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

require 'ffi/dynamic_library'

module FFI
  CURRENT_PROCESS = USE_THIS_PROCESS_AS_LIBRARY = FFI.make_shareable(Object.new)

  # @param [String, FFI::LibraryPath] lib library name or LibraryPath object
  # @return [String] library name formatted for current platform
  # Transform a generic library name to a platform library name
  # @example
  #  # Linux
  #  FFI.map_library_name 'c'     # -> "libc.so.6"
  #  FFI.map_library_name 'jpeg'  # -> "libjpeg.so"
  #  # Windows
  #  FFI.map_library_name 'c'     # -> "msvcrt.dll"
  #  FFI.map_library_name 'jpeg'  # -> "jpeg.dll"
  def self.map_library_name(lib)
    # Mangle the library name to reflect the native library naming conventions
    LibraryPath.wrap(lib).to_s
  end

  # Exception raised when a function is not found in libraries
  class NotFoundError < LoadError
    def initialize(function, *libraries)
      super("Function '#{function}' not found in [#{libraries[0].nil? ? 'current process' : libraries.join(", ")}]")
    end
  end

  # This module is the base to use native functions.
  #
  # A basic usage may be:
  #  require 'ffi'
  #
  #  module Hello
  #    extend FFI::Library
  #    ffi_lib FFI::Library::LIBC
  #    attach_function 'puts', [ :string ], :int
  #  end
  #
  #  Hello.puts("Hello, World")
  #
  #
  module Library
    CURRENT_PROCESS = FFI::CURRENT_PROCESS
    LIBC = FFI::Platform::LIBC

    # @param mod extended object
    # @return [nil]
    # @raise {RuntimeError} if +mod+ is not a Module
    # Test if extended object is a Module. If not, raise RuntimeError.
    def self.extended(mod)
      raise RuntimeError.new("must only be extended by module") unless mod.kind_of?(::Module)
    end


    # @param [Array] names names of libraries to load
    # @return [Array<DynamicLibrary>]
    # @raise {LoadError} if a library cannot be opened
    # Load native libraries.
    def ffi_lib(*names)
      raise LoadError.new("library names list must not be empty") if names.empty?

      lib_flags = defined?(@ffi_lib_flags) && @ffi_lib_flags

      @ffi_libs = names.map do |name|
        FFI::DynamicLibrary.send(:load_library, name, lib_flags)
      end
    end

    # Set the calling convention for {#attach_function} and {#callback}
    #
    # @see http://en.wikipedia.org/wiki/Stdcall#stdcall
    # @note +:stdcall+ is typically used for attaching Windows API functions
    #
    # @param [Symbol] convention one of +:default+, +:stdcall+
    # @return [Symbol] the new calling convention
    def ffi_convention(convention = nil)
      @ffi_convention ||= :default
      @ffi_convention = convention if convention
      @ffi_convention
    end

    # @see #ffi_lib
    # @return [Array<FFI::DynamicLibrary>] array of currently loaded FFI libraries
    # @raise [LoadError] if no libraries have been loaded (using {#ffi_lib})
    # Get FFI libraries loaded using {#ffi_lib}.
    def ffi_libraries
      raise LoadError.new("no library specified") if !defined?(@ffi_libs) || @ffi_libs.empty?
      @ffi_libs
    end

    # Flags used in {#ffi_lib}.
    #
    # This map allows you to supply symbols to {#ffi_lib_flags} instead of
    # the actual constants.
    FlagsMap = {
      :global => DynamicLibrary::RTLD_GLOBAL,
      :local => DynamicLibrary::RTLD_LOCAL,
      :lazy => DynamicLibrary::RTLD_LAZY,
      :now => DynamicLibrary::RTLD_NOW
    }

    # Sets library flags for {#ffi_lib}.
    #
    # @example
    #   ffi_lib_flags(:lazy, :local) # => 5
    #
    # @param [Symbol, …] flags (see {FlagsMap})
    # @return [Fixnum] the new value
    def ffi_lib_flags(*flags)
      @ffi_lib_flags = flags.inject(0) { |result, f| result | FlagsMap[f] }
    end


    ##
    # @overload attach_function(func, args, returns, options = {})
    #  @example attach function without an explicit name
    #    module Foo
    #      extend FFI::Library
    #      ffi_lib FFI::Library::LIBC
    #      attach_function :malloc, [:size_t], :pointer
    #    end
    #    # now callable via Foo.malloc
    # @overload attach_function(name, func, args, returns, options = {})
    #  @example attach function with an explicit name
    #    module Bar
    #      extend FFI::Library
    #      ffi_lib FFI::Library::LIBC
    #      attach_function :c_malloc, :malloc, [:size_t], :pointer
    #    end
    #    # now callable via Bar.c_malloc
    #
    # Attach C function +func+ to this module.
    #
    #
    # @param [#to_s] name name of ruby method to attach as
    # @param [#to_s] func name of C function to attach
    # @param [Array<Symbol>] args an array of types
    # @param [Symbol] returns type of return value
    # @option options [Boolean] :blocking (@blocking) set to true if the C function is a blocking call
    # @option options [Symbol] :convention (:default) calling convention (see {#ffi_convention})
    # @option options [FFI::Enums] :enums
    # @option options [Hash] :type_map
    #
    # @return [FFI::VariadicInvoker]
    #
    # @raise [FFI::NotFoundError] if +func+ cannot be found in the attached libraries (see {#ffi_lib})
    def attach_function(name, func, args, returns = nil, options = nil)
      mname, a2, a3, a4, a5 = name, func, args, returns, options
      cname, arg_types, ret_type, opts = (a4 && (a2.is_a?(String) || a2.is_a?(Symbol))) ? [ a2, a3, a4, a5 ] : [ mname.to_s, a2, a3, a4 ]

      # Convert :foo to the native type
      arg_types = arg_types.map { |e| find_type(e) }
      options = {
        :convention => ffi_convention,
        :type_map => defined?(@ffi_typedefs) ? @ffi_typedefs : nil,
        :blocking => defined?(@blocking) && @blocking,
        :enums => defined?(@ffi_enums) ? @ffi_enums : nil,
      }

      @blocking = false
      options.merge!(opts) if opts && opts.is_a?(Hash)

      # Try to locate the function in any of the libraries
      invokers = []
      ffi_libraries.each do |lib|
        if invokers.empty?
          begin
            function = nil
            function_names(cname, arg_types).find do |fname|
              function = lib.find_function(fname)
            end
            raise LoadError unless function

            invokers << if arg_types[-1] == FFI::NativeType::VARARGS
              VariadicInvoker.new(function, arg_types, find_type(ret_type), options)

            else
              Function.new(find_type(ret_type), arg_types, function, options)
            end

          rescue LoadError
          end
        end
      end
      invoker = invokers.compact.shift
      raise FFI::NotFoundError.new(cname.to_s, ffi_libraries.map { |lib| lib.name }) unless invoker

      invoker.attach(self, mname.to_s)
      invoker
    end

    # @param [#to_s] name function name
    # @param [Array] arg_types function's argument types
    # @return [Array<String>]
    # This function returns a list of possible names to lookup.
    # @note Function names on windows may be decorated if they are using stdcall. See
    #   * http://en.wikipedia.org/wiki/Name_mangling#C_name_decoration_in_Microsoft_Windows
    #   * http://msdn.microsoft.com/en-us/library/zxk0tw93%28v=VS.100%29.aspx
    #   * http://en.wikibooks.org/wiki/X86_Disassembly/Calling_Conventions#STDCALL
    #   Note that decorated names can be overridden via def files.  Also note that the
    #   windows api, although using, doesn't have decorated names.
    def function_names(name, arg_types)
      result = [name.to_s]
      if ffi_convention == :stdcall
        # Get the size of each parameter
        size = arg_types.inject(0) do |mem, arg|
          size = arg.size
          # The size must be a multiple of 4
          size += (4 - size) % 4
          mem + size
        end

        result << "_#{name.to_s}@#{size}" # win32
        result << "#{name.to_s}@#{size}" # win64
      end
      result
    end

    # @overload attach_variable(mname, cname, type)
    #   @param [#to_s] mname name of ruby method to attach as
    #   @param [#to_s] cname name of C variable to attach
    #   @param [DataConverter, Struct, Symbol, Type] type C variable's type
    #   @example
    #     module Bar
    #       extend FFI::Library
    #       ffi_lib 'my_lib'
    #       attach_variable :c_myvar, :myvar, :long
    #     end
    #     # now callable via Bar.c_myvar
    # @overload attach_variable(cname, type)
    #   @param [#to_s] mname name of ruby method to attach as
    #   @param [DataConverter, Struct, Symbol, Type] type C variable's type
    #   @example
    #     module Bar
    #       extend FFI::Library
    #       ffi_lib 'my_lib'
    #       attach_variable :myvar, :long
    #     end
    #     # now callable via Bar.myvar
    # @return [DynamicLibrary::Symbol]
    # @raise {FFI::NotFoundError} if +cname+ cannot be found in libraries
    #
    # Attach C variable +cname+ to this module.
    def attach_variable(mname, a1, a2 = nil)
      cname, type = a2 ? [ a1, a2 ] : [ mname.to_s, a1 ]
      mname = mname.to_sym
      address = nil
      ffi_libraries.each do |lib|
        begin
          address = lib.find_variable(cname.to_s)
          break unless address.nil?
        rescue LoadError
        end
      end

      raise FFI::NotFoundError.new(cname, ffi_libraries) if address.nil? || address.null?
      if type.is_a?(Class) && type < FFI::Struct
        # If it is a global struct, just attach directly to the pointer
        s = s = type.new(address) # Assigning twice to suppress unused variable warning
        self.module_eval <<-code, __FILE__, __LINE__
          @ffi_gsvars = {} unless defined?(@ffi_gsvars)
          @ffi_gsvars[#{mname.inspect}] = s
          def self.#{mname}
            @ffi_gsvars[#{mname.inspect}]
          end
        code

      else
        sc = Class.new(FFI::Struct)
        sc.layout :gvar, find_type(type)
        s = sc.new(address)
        #
        # Attach to this module as mname/mname=
        #
        self.module_eval <<-code, __FILE__, __LINE__
          @ffi_gvars = {} unless defined?(@ffi_gvars)
          @ffi_gvars[#{mname.inspect}] = s
          def self.#{mname}
            @ffi_gvars[#{mname.inspect}][:gvar]
          end
          def self.#{mname}=(value)
            @ffi_gvars[#{mname.inspect}][:gvar] = value
          end
        code

      end

      address
    end


    # @overload callback(name, params, ret)
    #   @param name callback name to add to type map
    #   @param [Array] params array of parameters' types
    #   @param [DataConverter, Struct, Symbol, Type] ret callback return type
    # @overload callback(params, ret)
    #   @param [Array] params array of parameters' types
    #   @param [DataConverter, Struct, Symbol, Type] ret callback return type
    # @return [FFI::CallbackInfo]
    def callback(*args)
      raise ArgumentError, "wrong number of arguments" if args.length < 2 || args.length > 3
      name, params, ret = if args.length == 3
        args
      else
        [ nil, args[0], args[1] ]
      end

      native_params = params.map { |e| find_type(e) }
      raise ArgumentError, "callbacks cannot have variadic parameters" if native_params.include?(FFI::Type::VARARGS)
      options = Hash.new
      options[:convention] = ffi_convention
      options[:enums] = @ffi_enums if defined?(@ffi_enums)
      ret_type = find_type(ret)
      if ret_type == Type::STRING
        raise TypeError, ":string is not allowed as return type of callbacks"
      end
      cb = FFI::CallbackInfo.new(ret_type, native_params, options)

      # Add to the symbol -> type map (unless there was no name)
      unless name.nil?
        typedef cb, name
      end

      cb
    end

    # Register or get an already registered type definition.
    #
    # To register a new type definition, +old+ should be a {FFI::Type}. +add+
    # is in this case the type definition.
    #
    # If +old+ is a {DataConverter}, a {Type::Mapped} is returned.
    #
    # If +old+ is +:enum+
    # * and +add+ is an +Array+, a call to {#enum} is made with +add+ as single parameter;
    # * in others cases, +info+ is used to create a named enum.
    #
    # If +old+ is a key for type map, #typedef get +old+ type definition.
    #
    # @param [DataConverter, Symbol, Type] old
    # @param [Symbol] add
    # @param [Symbol] info
    # @return [FFI::Enum, FFI::Type]
    def typedef(old, add, info=nil)
      @ffi_typedefs = Hash.new unless defined?(@ffi_typedefs)

      @ffi_typedefs[add] = if old.kind_of?(FFI::Type)
        old

      elsif @ffi_typedefs.has_key?(old)
        @ffi_typedefs[old]

      elsif old.is_a?(DataConverter)
        FFI::Type::Mapped.new(old)

      elsif old == :enum
        if add.kind_of?(Array)
          self.enum(add)
        else
          self.enum(info, add)
        end

      else
        FFI.find_type(old)
      end
    end

    private
    # Generic enum builder
    #  @param [Class] klass can be one of FFI::Enum or FFI::Bitmask
    #  @param args (see #enum or #bitmask)
    def generic_enum(klass, *args)
      native_type = args.first.kind_of?(FFI::Type) ? args.shift : nil
      name, values = if args[0].kind_of?(Symbol) && args[1].kind_of?(Array)
        [ args[0], args[1] ]
      elsif args[0].kind_of?(Array)
        [ nil, args[0] ]
      else
        [ nil, args ]
      end
      @ffi_enums = FFI::Enums.new unless defined?(@ffi_enums)
      @ffi_enums << (e = native_type ? klass.new(native_type, values, name) : klass.new(values, name))

      # If called with a name, add a typedef alias
      typedef(e, name) if name
      e
    end

    public
    # @overload enum(name, values)
    #  Create a named enum.
    #  @example
    #   enum :foo, [:zero, :one, :two]  # named enum
    #  @param [Symbol] name name for new enum
    #  @param [Array] values values for enum
    # @overload enum(*args)
    #  Create an unnamed enum.
    #  @example
    #   enum :zero, :one, :two  # unnamed enum
    #  @param args values for enum
    # @overload enum(values)
    #  Create an unnamed enum.
    #  @example
    #   enum [:zero, :one, :two]  # unnamed enum, equivalent to above example
    #  @param [Array] values values for enum
    # @overload enum(native_type, name, values)
    #  Create a named enum and specify the native type.
    #  @example
    #   enum FFI::Type::UINT64, :foo, [:zero, :one, :two]  # named enum
    #  @param [FFI::Type] native_type native type for new enum
    #  @param [Symbol] name name for new enum
    #  @param [Array] values values for enum
    # @overload enum(native_type, *args)
    #  Create an unnamed enum and specify the native type.
    #  @example
    #   enum FFI::Type::UINT64, :zero, :one, :two  # unnamed enum
    #  @param [FFI::Type] native_type native type for new enum
    #  @param args values for enum
    # @overload enum(native_type, values)
    #  Create an unnamed enum and specify the native type.
    #  @example
    #   enum Type::UINT64, [:zero, :one, :two]  # unnamed enum, equivalent to above example
    #  @param [FFI::Type] native_type native type for new enum
    #  @param [Array] values values for enum
    # @return [FFI::Enum]
    # Create a new {FFI::Enum}.
    def enum(*args)
      generic_enum(FFI::Enum, *args)
    end

    # @overload bitmask(name, values)
    #  Create a named bitmask
    #  @example
    #   bitmask :foo, [:red, :green, :blue] # bits 0,1,2 are used
    #   bitmask :foo, [:red, :green, 5, :blue] # bits 0,5,6 are used
    #  @param [Symbol] name for new bitmask
    #  @param [Array<Symbol, Integer>] values for new bitmask
    # @overload bitmask(*args)
    #  Create an unamed bitmask
    #  @example
    #   bm = bitmask :red, :green, :blue # bits 0,1,2 are used
    #   bm = bitmask :red, :green, 5, blue # bits 0,5,6 are used
    #  @param [Symbol, Integer] args values for new bitmask
    # @overload bitmask(values)
    #  Create an unamed bitmask
    #  @example
    #   bm = bitmask [:red, :green, :blue] # bits 0,1,2 are used
    #   bm = bitmask [:red, :green, 5, blue] # bits 0,5,6 are used
    #  @param [Array<Symbol, Integer>] values for new bitmask
    # @overload bitmask(native_type, name, values)
    #  Create a named enum and specify the native type.
    #  @example
    #   bitmask FFI::Type::UINT64, :foo, [:red, :green, :blue]
    #  @param [FFI::Type] native_type native type for new bitmask
    #  @param [Symbol] name for new bitmask
    #  @param [Array<Symbol, Integer>] values for new bitmask
    # @overload bitmask(native_type, *args)
    #  @example
    #   bitmask FFI::Type::UINT64, :red, :green, :blue
    #  @param [FFI::Type] native_type native type for new bitmask
    #  @param [Symbol, Integer] args values for new bitmask
    # @overload bitmask(native_type, values)
    #  Create a named enum and specify the native type.
    #  @example
    #   bitmask FFI::Type::UINT64, [:red, :green, :blue]
    #  @param [FFI::Type] native_type native type for new bitmask
    #  @param [Array<Symbol, Integer>] values for new bitmask
    # @return [FFI::Bitmask]
    # Create a new FFI::Bitmask
    def bitmask(*args)
      generic_enum(FFI::Bitmask, *args)
    end

    # @param name
    # @return [FFI::Enum]
    # Find an enum by name.
    def enum_type(name)
      @ffi_enums.find(name) if defined?(@ffi_enums)
    end

    # @param symbol
    # @return [FFI::Enum]
    # Find an enum by a symbol it contains.
    def enum_value(symbol)
      @ffi_enums.__map_symbol(symbol)
    end

    # @param [DataConverter, Type, Struct, Symbol] t type to find
    # @return [Type]
    # Find a type definition.
    def find_type(t)
      if t.kind_of?(Type)
        t

      elsif defined?(@ffi_typedefs) && @ffi_typedefs.has_key?(t)
        @ffi_typedefs[t]

      elsif t.is_a?(Class) && t < Struct
        Type::POINTER

      elsif t.is_a?(DataConverter)
        # Add a typedef so next time the converter is used, it hits the cache
        typedef Type::Mapped.new(t), t

      end || FFI.find_type(t)
    end

    # Retrieve all attached functions and their function signature
    #
    # This method returns a Hash of method names of attached functions connected by #attach_function and the corresponding function type.
    # The function type responds to #return_type and #param_types which return the FFI types of the function signature.
    #
    # @return [Hash< Symbol => [FFI::Function, FFI::VariadicInvoker] >]
    def attached_functions
      @ffi_functions || {}
    end

    # Retrieve all attached variables and their type
    #
    # This method returns a Hash of variable names and the corresponding type or variables connected by #attach_variable .
    #
    # @return [Hash< Symbol => ffi_type >]
    def attached_variables
      (
        (@ffi_gsvars || {}).map do |name, gvar|
          [name, gvar.class]
        end +
        (@ffi_gvars || {}).map do |name, gvar|
          [name, gvar.layout[:gvar].type]
        end
      ).to_h
    end

    # Freeze all definitions of the module
    #
    # This freezes the module's definitions, so that it can be used in a Ractor.
    # No further methods or variables can be attached and no further enums or typedefs can be created in this module afterwards.
    def freeze
      instance_variables.each do |name|
        var = instance_variable_get(name)
        FFI.make_shareable(var)
      end
      nil
    end
  end
end
