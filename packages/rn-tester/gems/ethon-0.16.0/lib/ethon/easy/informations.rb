# frozen_string_literal: true
module Ethon
  class Easy

    # This module contains the methods to return informations
    # from the easy handle. See http://curl.haxx.se/libcurl/c/curl_easy_getinfo.html
    # for more information.
    module Informations

      # Holds available informations and their type, which is needed to
      # request the informations from libcurl.
      AVAILABLE_INFORMATIONS = {
        # Return the available HTTP auth methods.
        :httpauth_avail => :long,

        # Return the total time in seconds for the previous
        # transfer, including name resolution, TCP connection, etc.
        :total_time => :double,

        # Return the time, in seconds, it took from the start
        # until the first byte was received by libcurl. This
        # includes pre-transfer time and also the time the
        # server needs to calculate the result.
        :starttransfer_time => :double,

        # Return the time, in seconds, it took from the start
        # until the SSL/SSH connect/handshake to the remote
        # host was completed. This time is most often very near
        # to the pre-transfer time, except for cases such as HTTP
        # pipelining where the pre-transfer time can be delayed
        # due to waits in line for the pipeline and more.
        :appconnect_time => :double,

        # Return the time, in seconds, it took from the start
        # until the file transfer was just about to begin. This
        # includes all pre-transfer commands and negotiations
        # that are specific to the particular protocol(s) involved.
        # It does not involve the sending of the protocol-
        # specific request that triggers a transfer.
        :pretransfer_time => :double,

        # Return the time, in seconds, it took from the start
        # until the connect to the remote host (or proxy) was completed.
        :connect_time => :double,

        # Return the time, in seconds, it took from the
        # start until the name resolution was completed.
        :namelookup_time => :double,

        # Return the time, in seconds, it took for all redirection steps
        # include name lookup, connect, pretransfer and transfer before the
        # final transaction was started. time_redirect shows the complete
        # execution time for multiple redirections. (Added in 7.12.3)
        :redirect_time => :double,

        # Return the last used effective url.
        :effective_url => :string,

        # Return the string holding the IP address of the most recent
        # connection done with this curl handle. This string
        # may be IPv6 if that's enabled.
        :primary_ip => :string,

        # Return the last received HTTP, FTP or SMTP response code.
        # The value will be zero if no server response code has
        # been received. Note that a proxy's CONNECT response should
        # be read with http_connect_code and not this.
        :response_code => :long,

        :request_size => :long,

        # Return the total number of redirections that were
        # actually followed.
        :redirect_count => :long,

        # URL a redirect would take you to, had you enabled redirects (Added in 7.18.2)
        :redirect_url => :string,

        # Return the bytes, the total amount of bytes that were uploaded
        :size_upload => :double,

        # Return the bytes, the total amount of bytes that were downloaded.
        # The amount is only for the latest transfer and will be reset again
        # for each new transfer. This counts actual payload data, what's
        # also commonly called body. All meta and header data are excluded
        # and will not be counted in this number.
        :size_download => :double,

        # Return the bytes/second, the average upload speed that curl
        # measured for the complete upload
        :speed_upload => :double,

        # Return the bytes/second, the average download speed that curl
        # measured for the complete download
        :speed_download => :double
      }

      AVAILABLE_INFORMATIONS.each do |name, type|
        eval %Q|def #{name}; Curl.send(:get_info_#{type}, :#{name}, handle); end|
      end

      # Returns true if this curl version supports zlib.
      #
      # @example Return wether zlib is supported.
      #   easy.supports_zlib?
      #
      # @return [ Boolean ] True if supported, else false.
      # @deprecated Please use the static version instead
      def supports_zlib?
        Kernel.warn("Ethon: Easy#supports_zlib? is deprecated and will be removed, please use Easy#.")
        Easy.supports_zlib?
      end

    end
  end
end
