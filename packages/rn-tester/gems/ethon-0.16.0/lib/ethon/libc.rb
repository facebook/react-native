# frozen_string_literal: true
module Ethon

  # FFI Wrapper module for Libc.
  #
  # @api private
  module Libc
    extend FFI::Library
    ffi_lib 'c'

    # :nodoc:
    def self.windows?
      Gem.win_platform?
    end

    unless windows?
      attach_function :getdtablesize, [], :int
      attach_function :free, [:pointer], :void
    end
  end
end
