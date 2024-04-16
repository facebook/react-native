# frozen_string_literal: true
module Ethon
  module Curl
    callback :callback, [:pointer, :size_t, :size_t, :pointer], :size_t
    callback :socket_callback, [:pointer, :int, :poll_action, :pointer, :pointer], :multi_code
    callback :timer_callback, [:pointer, :long, :pointer], :multi_code
    callback :debug_callback, [:pointer, :debug_info_type, :pointer, :size_t, :pointer], :int
    callback :progress_callback, [:pointer, :long_long, :long_long, :long_long, :long_long], :int
    ffi_lib_flags :now, :global
    ffi_lib ['libcurl', 'libcurl.so.4']
  end
end
