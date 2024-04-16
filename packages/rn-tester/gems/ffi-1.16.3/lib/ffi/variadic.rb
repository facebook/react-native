#
# Copyright (C) 2008, 2009 Wayne Meissner
# Copyright (C) 2009 Luc Heinrich
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

module FFI
  class VariadicInvoker
    def call(*args, &block)
      param_types = Array.new(@fixed)
      param_values = Array.new
      @fixed.each_with_index do |t, i|
        param_values << args[i]
      end
      i = @fixed.length
      while i < args.length
        param_types << FFI.find_type(args[i], @type_map)
        param_values << args[i + 1]
        i += 2
      end
      invoke(param_types, param_values, &block)
    end

    #
    # Attach the invoker to module +mod+ as +mname+
    #
    def attach(mod, mname)
      invoker = self
      params = "*args"
      call = "call"
      mname = mname.to_sym
      mod.module_eval <<-code, __FILE__, __LINE__
        @ffi_functions = {} unless defined?(@ffi_functions)
        @ffi_functions[#{mname.inspect}] = invoker

        def self.#{mname}(#{params})
          @ffi_functions[#{mname.inspect}].#{call}(#{params})
        end

        define_method(#{mname.inspect}, &method(#{mname.inspect}))
      code
      invoker
    end

    # Retrieve Array of parameter types
    #
    # This method returns an Array of FFI types accepted as function parameters.
    #
    # @return [Array<FFI::Type>]
    def param_types
      [*@fixed, Type::Builtin::VARARGS]
    end
  end
end
