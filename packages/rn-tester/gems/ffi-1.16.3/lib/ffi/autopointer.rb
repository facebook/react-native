#
# Copyright (C) 2008-2010 Wayne Meissner
# Copyright (C) 2008 Mike Dalessio
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

module FFI
  class AutoPointer < Pointer
    extend DataConverter

    # @overload initialize(pointer, method)
    #   @param pointer [Pointer]
    #   @param method [Method]
    #   @return [self]
    #   The passed Method will be invoked at GC time.
    # @overload initialize(pointer, proc)
    #   @param pointer [Pointer]
    #   @return [self]
    #   The passed Proc will be invoked at GC time (SEE WARNING BELOW!)
    #   @note WARNING: passing a proc _may_ cause your pointer to never be
    #     GC'd, unless you're careful to avoid trapping a reference to the
    #     pointer in the proc. See the test specs for examples.
    # @overload initialize(pointer) { |p| ... }
    #   @param pointer [Pointer]
    #   @yieldparam [Pointer] p +pointer+ passed to the block
    #   @return [self]
    #   The passed block will be invoked at GC time.
    #   @note
    #     WARNING: passing a block will cause your pointer to never be GC'd.
    #     This is bad.
    # @overload initialize(pointer)
    #   @param pointer [Pointer]
    #   @return [self]
    #   The pointer's release() class method will be invoked at GC time.
    #
    # @note The safest, and therefore preferred, calling
    #  idiom is to pass a Method as the second parameter. Example usage:
    #
    #   class PointerHelper
    #     def self.release(pointer)
    #       ...
    #     end
    #   end
    #
    #   p = AutoPointer.new(other_pointer, PointerHelper.method(:release))
    #
    #  The above code will cause PointerHelper#release to be invoked at GC time.
    #
    # @note
    #  The last calling idiom (only one parameter) is generally only
    #  going to be useful if you subclass {AutoPointer}, and override
    #  #release, which by default does nothing.
    def initialize(ptr, proc=nil, &block)
      raise TypeError, "Invalid pointer" if ptr.nil? || !ptr.kind_of?(Pointer) ||
          ptr.kind_of?(MemoryPointer) || ptr.kind_of?(AutoPointer)
      super(ptr.type_size, ptr)

      @releaser = if proc
                    if not proc.respond_to?(:call)
                      raise RuntimeError.new("proc must be callable")
                    end
                    Releaser.new(ptr, proc)

                  else
                    if not self.class.respond_to?(:release, true)
                      raise RuntimeError.new("no release method defined")
                    end
                    Releaser.new(ptr, self.class.method(:release))
                  end

      ObjectSpace.define_finalizer(self, @releaser)
      self
    end

    # @return [nil]
    # Free the pointer.
    def free
      @releaser.free
    end

    # @param [Boolean] autorelease
    # @return [Boolean] +autorelease+
    # Set +autorelease+ property. See {Pointer Autorelease section at Pointer}.
    def autorelease=(autorelease)
      raise FrozenError.new("can't modify frozen #{self.class}") if frozen?
      @releaser.autorelease=(autorelease)
    end

    # @return [Boolean] +autorelease+
    # Get +autorelease+ property. See {Pointer Autorelease section at Pointer}.
    def autorelease?
      @releaser.autorelease
    end

    # @abstract Base class for {AutoPointer}'s releasers.
    #
    #  All subclasses of Releaser should define a +#release(ptr)+ method.
    # A releaser is an object in charge of release an {AutoPointer}.
    class Releaser
      attr_accessor :autorelease

      # @param [Pointer] ptr
      # @param [#call] proc
      # @return [nil]
      # A new instance of Releaser.
      def initialize(ptr, proc)
        @ptr = ptr
        @proc = proc
        @autorelease = true
      end

      # @return [nil]
      # Free pointer.
      def free
        if @ptr
          release(@ptr)
          @autorelease = false
          @ptr = nil
          @proc = nil
        end
      end

      # @param args
      # Release pointer if +autorelease+ is set.
      def call(*args)
        release(@ptr) if @autorelease && @ptr
      end

      # Release +ptr+ by using Proc or Method defined at +ptr+
      # {AutoPointer#initialize initialization}.
      #
      # @param [Pointer] ptr
      # @return [nil]
      def release(ptr)
        @proc.call(ptr)
      end
    end

    # Return native type of AutoPointer.
    #
    # Override {DataConverter#native_type}.
    # @return [Type::POINTER]
    # @raise {RuntimeError} if class does not implement a +#release+ method
    def self.native_type
      if not self.respond_to?(:release, true)
        raise RuntimeError.new("no release method defined for #{self.inspect}")
      end
      Type::POINTER
    end

    # Create a new AutoPointer.
    #
    # Override {DataConverter#from_native}.
    # @overload self.from_native(ptr, ctx)
    #   @param [Pointer] ptr
    #   @param ctx not used. Please set +nil+.
    # @return [AutoPointer]
    def self.from_native(val, ctx)
      self.new(val)
    end
  end

end
