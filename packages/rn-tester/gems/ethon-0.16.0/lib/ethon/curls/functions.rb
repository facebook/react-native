# frozen_string_literal: true
module Ethon
  module Curls

    # This module contains the functions to be attached in order to work with
    # libcurl.
    module Functions

      # :nodoc:
      def self.extended(base)
        base.attach_function :global_init,                :curl_global_init,         [:long],                        :int
        base.attach_function :global_cleanup,             :curl_global_cleanup,      [],                             :void
        base.attach_function :free,                       :curl_free,                [:pointer],                     :void

        base.attach_function :easy_init,                  :curl_easy_init,           [],                             :pointer
        base.attach_function :easy_cleanup,               :curl_easy_cleanup,        [:pointer],                     :void
        base.attach_function :easy_getinfo,               :curl_easy_getinfo,        [:pointer, :info, :varargs],    :easy_code
        base.attach_function :easy_setopt,                :curl_easy_setopt,         [:pointer, :easy_option, :varargs], :easy_code
        base.instance_variable_set(:@blocking, true)
        base.attach_function :easy_perform,               :curl_easy_perform,        [:pointer],                     :easy_code
        base.attach_function :easy_strerror,              :curl_easy_strerror,       [:easy_code],                   :string
        base.attach_function :easy_escape,                :curl_easy_escape,         [:pointer, :pointer, :int],     :pointer
        base.attach_function :easy_reset,                 :curl_easy_reset,          [:pointer],                     :void
        base.attach_function :easy_duphandle,             :curl_easy_duphandle,      [:pointer],                     :pointer

        base.attach_function :formadd,                    :curl_formadd,             [:pointer, :pointer, :varargs], :int
        base.attach_function :formfree,                   :curl_formfree,            [:pointer],                     :void

        base.attach_function :multi_init,                 :curl_multi_init,          [],                             :pointer
        base.attach_function :multi_cleanup,              :curl_multi_cleanup,       [:pointer],                     :void
        base.attach_function :multi_add_handle,           :curl_multi_add_handle,    [:pointer, :pointer],           :multi_code
        base.attach_function :multi_remove_handle,        :curl_multi_remove_handle, [:pointer, :pointer],           :multi_code
        base.attach_function :multi_info_read,            :curl_multi_info_read,     [:pointer, :pointer],           Curl::Msg.ptr
        base.attach_function :multi_perform,              :curl_multi_perform,       [:pointer, :pointer],           :multi_code
        base.attach_function :multi_timeout,              :curl_multi_timeout,       [:pointer, :pointer],           :multi_code
        base.attach_function :multi_fdset,                :curl_multi_fdset,         [:pointer, Curl::FDSet.ptr, Curl::FDSet.ptr, Curl::FDSet.ptr, :pointer], :multi_code
        base.attach_function :multi_strerror,             :curl_multi_strerror,      [:int],                         :string
        base.attach_function :multi_setopt,               :curl_multi_setopt,        [:pointer, :multi_option, :varargs], :multi_code
        base.attach_function :multi_socket_action,        :curl_multi_socket_action, [:pointer, :int, :socket_readiness, :pointer], :multi_code

        base.attach_function :version,                    :curl_version,             [],                             :string
        base.attach_function :version_info,               :curl_version_info,        [],                             Curl::VersionInfoData.ptr

        base.attach_function :slist_append,               :curl_slist_append,        [:pointer, :string],            :pointer
        base.attach_function :slist_free_all,             :curl_slist_free_all,      [:pointer],                     :void
        base.instance_variable_set(:@blocking, true)

        if Curl.windows?
            base.ffi_lib 'ws2_32'
        else
            base.ffi_lib ::FFI::Library::LIBC
        end

        base.attach_function :select,                                            [:int, Curl::FDSet.ptr, Curl::FDSet.ptr, Curl::FDSet.ptr, Curl::Timeval.ptr], :int
      end
    end
  end
end
