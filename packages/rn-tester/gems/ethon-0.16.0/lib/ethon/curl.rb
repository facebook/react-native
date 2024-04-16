# frozen_string_literal: true
require 'ethon/curls/codes'
require 'ethon/curls/options'
require 'ethon/curls/infos'
require 'ethon/curls/form_options'
require 'ethon/curls/messages'
require 'ethon/curls/functions'

module Ethon

  # FFI Wrapper module for Curl. Holds constants and required initializers.
  #
  # @api private
  module Curl
    extend ::FFI::Library
    extend Ethon::Curls::Codes
    extend Ethon::Curls::Options
    extend Ethon::Curls::Infos
    extend Ethon::Curls::FormOptions
    extend Ethon::Curls::Messages

    # :nodoc:
    def self.windows?
      Libc.windows?
    end

    require 'ethon/curls/constants'
    require 'ethon/curls/settings'
    require 'ethon/curls/classes'
    extend Ethon::Curls::Functions

    @blocking = true

    @@initialized = false
    @@curl_mutex = Mutex.new

    class << self
      # This function sets up the program environment that libcurl needs.
      # Think of it as an extension of the library loader.
      #
      # This function must be called at least once within a program (a program is all the
      # code that shares a memory space) before the program calls any other function in libcurl.
      # The environment it sets up is constant for the life of the program and is the same for
      # every program, so multiple calls have the same effect as one call.
      #
      # The flags option is a bit pattern that tells libcurl exactly what features to init,
      # as described below. Set the desired bits by ORing the values together. In normal
      # operation, you must specify CURL_GLOBAL_ALL. Don't use any other value unless
      # you are familiar with it and mean to control internal operations of libcurl.
      #
      # This function is not thread safe. You must not call it when any other thread in
      # the program (i.e. a thread sharing the same memory) is running. This doesn't just
      # mean no other thread that is using libcurl. Because curl_global_init() calls
      # functions of other libraries that are similarly thread unsafe, it could conflict with
      # any other thread that uses these other libraries.
      #
      # @raise [ Ethon::Errors::GlobalInit ] If Curl.global_init fails.
      def init
        @@curl_mutex.synchronize {
          if not @@initialized
            raise Errors::GlobalInit.new if Curl.global_init(GLOBAL_ALL) != 0
            @@initialized = true
            Ethon.logger.debug("ETHON: Libcurl initialized") if Ethon.logger
          end
        }
      end

      # This function releases resources acquired by curl_global_init.
      # You should call curl_global_cleanup once for each call you make to
      # curl_global_init, after you are done using libcurl.
      # This function is not thread safe. You must not call it when any other thread in the
      # program (i.e. a thread sharing the same memory) is running. This doesn't just
      # mean no other thread that is using libcurl. Because curl_global_cleanup calls functions of other
      # libraries that are similarly thread unsafe, it could conflict with
      # any other thread that uses these other libraries.
      # See the description in libcurl of global environment requirements
      # for details of how to use this function.
      def cleanup
        @@curl_mutex.synchronize {
          if @@initialized
            Curl.global_cleanup()
            @@initialized = false
            Ethon.logger.debug("ETHON: Libcurl cleanup") if Ethon.logger
          end
        }
      end

    end
  end
end
