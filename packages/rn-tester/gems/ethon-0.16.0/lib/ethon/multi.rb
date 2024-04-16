# frozen_string_literal: true
require 'ethon/easy/util'
require 'ethon/multi/stack'
require 'ethon/multi/operations'
require 'ethon/multi/options'

module Ethon

  # This class represents libcurl multi.
  class Multi
    include Ethon::Multi::Stack
    include Ethon::Multi::Operations
    include Ethon::Multi::Options

    # Create a new multi. Initialize curl in case
    # it didn't happen before.
    #
    # @example Create a new Multi.
    #   Multi.new
    #
    # @param [ Hash ] options The options.
    #
    # @option options :socketdata [String]
    #  Pass a pointer to whatever you want passed to the
    #  curl_socket_callback's forth argument, the userp pointer. This is not
    #  used by libcurl but only passed-thru as-is. Set the callback pointer
    #  with CURLMOPT_SOCKETFUNCTION.
    # @option options :pipelining [Boolean]
    #  Pass a long set to 1 to enable or 0 to disable. Enabling pipelining
    #  on a multi handle will make it attempt to perform HTTP Pipelining as
    #  far as possible for transfers using this handle. This means that if
    #  you add a second request that can use an already existing connection,
    #  the second request will be "piped" on the same connection rather than
    #  being executed in parallel. (Added in 7.16.0)
    # @option options :timerfunction [Proc]
    #  Pass a pointer to a function matching the curl_multi_timer_callback
    #  prototype. This function will then be called when the timeout value
    #  changes. The timeout value is at what latest time the application
    #  should call one of the "performing" functions of the multi interface
    #  (curl_multi_socket_action(3) and curl_multi_perform(3)) - to allow
    #  libcurl to keep timeouts and retries etc to work. A timeout value of
    #  -1 means that there is no timeout at all, and 0 means that the
    #  timeout is already reached. Libcurl attempts to limit calling this
    #  only when the fixed future timeout time actually changes. See also
    #  CURLMOPT_TIMERDATA. This callback can be used instead of, or in
    #  addition to, curl_multi_timeout(3). (Added in 7.16.0)
    # @option options :timerdata [String]
    #  Pass a pointer to whatever you want passed to the
    #  curl_multi_timer_callback's third argument, the userp pointer. This
    #  is not used by libcurl but only passed-thru as-is. Set the callback
    #  pointer with CURLMOPT_TIMERFUNCTION. (Added in 7.16.0)
    # @option options :maxconnects [Integer]
    #  Pass a long. The set number will be used as the maximum amount of
    #  simultaneously open connections that libcurl may cache. Default is
    #  10, and libcurl will enlarge the size for each added easy handle to
    #  make it fit 4 times the number of added easy handles.
    #  By setting this option, you can prevent the cache size from growing
    #  beyond the limit set by you.
    #  When the cache is full, curl closes the oldest one in the cache to
    #  prevent the number of open connections from increasing.
    #  This option is for the multi handle's use only, when using the easy
    #  interface you should instead use the CURLOPT_MAXCONNECTS option.
    #  (Added in 7.16.3)
    # @option options :max_total_connections [Integer]
    # Pass a long. The set number will be used as the maximum amount of 
    # simultaneously open connections in total. For each new session, 
    # libcurl will open a new connection up to the limit set by 
    # CURLMOPT_MAX_TOTAL_CONNECTIONS. When the limit is reached, the 
    # sessions will be pending until there are available connections. 
    # If CURLMOPT_PIPELINING is 1, libcurl will try to pipeline if the host 
    # is capable of it.
    # The default value is 0, which means that there is no limit. However, 
    # for backwards compatibility, setting it to 0 when CURLMOPT_PIPELINING 
    # is 1 will not be treated as unlimited. Instead it will open only 1 
    # connection and try to pipeline on it.
    # (Added in 7.30.0)
    # @option options :execution_mode [Boolean]
    #  Either :perform (default) or :socket_action, specifies the usage
    #  method that will be used on this multi object. The default :perform
    #  mode provides a #perform function that uses curl_multi_perform
    #  behind the scenes to automatically continue execution until all
    #  requests have completed. The :socket_action mode provides an API
    #  that allows the {Multi} object to be integrated into an external
    #  IO loop, by calling #socket_action and responding to the 
    #  socketfunction and timerfunction callbacks, using the underlying
    #  curl_multi_socket_action semantics.
    #
    # @return [ Multi ] The new multi.
    def initialize(options = {})
      Curl.init
      @execution_mode = options.delete(:execution_mode) || :perform
      set_attributes(options)
      init_vars
    end

    # Set given options.
    #
    # @example Set options.
    #   multi.set_attributes(options)
    #
    # @raise InvalidOption
    #
    # @see initialize
    #
    # @api private
    def set_attributes(options)
      options.each_pair do |key, value|
        unless respond_to?("#{key}=")
          raise Errors::InvalidOption.new(key)
        end
        method("#{key}=").call(value)
      end
    end

    private

    # Internal function to gate functions to a specific execution mode
    #
    # @raise ArgumentError
    #
    # @api private
    def ensure_execution_mode(expected_mode)
      raise ArgumentError, "Expected the Multi to be in #{expected_mode} but it was in #{@execution_mode}" if expected_mode != @execution_mode
    end
  end
end
