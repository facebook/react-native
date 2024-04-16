#
# Copyright (C) 2008-2010 JRuby project
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
  class Function
    # Only MRI allows function type queries
    if private_method_defined?(:type)
      # Retrieve the return type of the function
      #
      # This method returns FFI type returned by the function.
      #
      # @return [FFI::Type]
      def return_type
        type.return_type
      end

      # Retrieve Array of parameter types
      #
      # This method returns an Array of FFI types accepted as function parameters.
      #
      # @return [Array<FFI::Type>]
      def param_types
        type.param_types
      end
    end

    # Stash the Function in a module variable so it can be inspected by attached_functions.
    # On CRuby it also ensures that it does not get garbage collected.
    module RegisterAttach
      def attach(mod, name)
        funcs = mod.instance_variable_get("@ffi_functions")
        unless funcs
          funcs = {}
          mod.instance_variable_set("@ffi_functions", funcs)
        end
        funcs[name.to_sym] = self
        # Jump to the native attach method of CRuby, JRuby or Tuffleruby
        super
      end
    end
    private_constant :RegisterAttach
    prepend RegisterAttach
  end
end
