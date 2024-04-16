# frozen_string_literal: true
require 'ethon/easy/informations'
require 'ethon/easy/features'
require 'ethon/easy/callbacks'
require 'ethon/easy/options'
require 'ethon/easy/header'
require 'ethon/easy/util'
require 'ethon/easy/params'
require 'ethon/easy/form'
require 'ethon/easy/http'
require 'ethon/easy/operations'
require 'ethon/easy/response_callbacks'
require 'ethon/easy/debug_info'
require 'ethon/easy/mirror'

module Ethon

  # This is the class representing the libcurl easy interface
  # See http://curl.haxx.se/libcurl/c/libcurl-easy.html for more informations.
  #
  # @example You can access the libcurl easy interface through this class, every request is based on it. The simplest setup looks like that:
  #
  #   e = Ethon::Easy.new(url: "www.example.com")
  #   e.perform
  #   #=> :ok
  #
  # @example You can the reuse this Easy for the next request:
  #
  #   e.reset # reset easy handle
  #   e.url = "www.google.com"
  #   e.followlocation = true
  #   e.perform
  #   #=> :ok
  #
  # @see initialize
  class Easy
    include Ethon::Easy::Informations
    include Ethon::Easy::Callbacks
    include Ethon::Easy::Options
    include Ethon::Easy::Header
    include Ethon::Easy::Http
    include Ethon::Easy::Operations
    include Ethon::Easy::ResponseCallbacks
    extend Ethon::Easy::Features

    # Returns the curl return code.
    #
    # @return [ Symbol ] The return code.
    #   * :ok: All fine. Proceed as usual.
    #   * :unsupported_protocol: The URL you passed to libcurl used a
    #     protocol that this libcurl does not support. The support
    #     might be a compile-time option that you didn't use, it can
    #     be a misspelled protocol string or just a protocol
    #     libcurl has no code for.
    #   * :failed_init: Very early initialization code failed. This
    #     is likely to be an internal error or problem, or a
    #     resource problem where something fundamental couldn't
    #     get done at init time.
    #   * :url_malformat: The URL was not properly formatted.
    #   * :not_built_in: A requested feature, protocol or option
    #     was not found built-in in this libcurl due to a build-time
    #     decision. This means that a feature or option was not enabled
    #     or explicitly disabled when libcurl was built and in
    #     order to get it to function you have to get a rebuilt libcurl.
    #   * :couldnt_resolve_proxy: Couldn't resolve proxy. The given
    #     proxy host could not be resolved.
    #   * :couldnt_resolve_host: Couldn't resolve host. The given remote
    #     host was not resolved.
    #   * :couldnt_connect: Failed to connect() to host or proxy.
    #   * :ftp_weird_server_reply: After connecting to a FTP server,
    #     libcurl expects to get a certain reply back. This error
    #     code implies that it got a strange or bad reply. The given
    #     remote server is probably not an OK FTP server.
    #   * :remote_access_denied: We were denied access to the resource
    #     given in the URL. For FTP, this occurs while trying to
    #     change to the remote directory.
    #   * :ftp_accept_failed: While waiting for the server to connect
    #     back when an active FTP session is used, an error code was
    #     sent over the control connection or similar.
    #   * :ftp_weird_pass_reply: After having sent the FTP password to
    #     the server, libcurl expects a proper reply. This error code
    #     indicates that an unexpected code was returned.
    #   * :ftp_accept_timeout: During an active FTP session while
    #     waiting for the server to connect, the CURLOPT_ACCEPTTIMOUT_MS
    #     (or the internal default) timeout expired.
    #   * :ftp_weird_pasv_reply: libcurl failed to get a sensible result
    #     back from the server as a response to either a PASV or a
    #     EPSV command. The server is flawed.
    #   * :ftp_weird_227_format: FTP servers return a 227-line as a response
    #     to a PASV command. If libcurl fails to parse that line,
    #     this return code is passed back.
    #   * :ftp_cant_get_host: An internal failure to lookup the host used
    #     for the new connection.
    #   * :ftp_couldnt_set_type: Received an error when trying to set
    #     the transfer mode to binary or ASCII.
    #   * :partial_file: A file transfer was shorter or larger than
    #     expected. This happens when the server first reports an expected
    #     transfer size, and then delivers data that doesn't match the
    #     previously given size.
    #   * :ftp_couldnt_retr_file: This was either a weird reply to a
    #     'RETR' command or a zero byte transfer complete.
    #   * :quote_error: When sending custom "QUOTE" commands to the
    #     remote server, one of the commands returned an error code that
    #     was 400 or higher (for FTP) or otherwise indicated unsuccessful
    #     completion of the command.
    #   * :http_returned_error: This is returned if CURLOPT_FAILONERROR is
    #     set TRUE and the HTTP server returns an error code that is >= 400.
    #   * :write_error: An error occurred when writing received data to a
    #     local file, or an error was returned to libcurl from a write callback.
    #   * :upload_failed: Failed starting the upload. For FTP, the server
    #     typically denied the STOR command. The error buffer usually
    #     contains the server's explanation for this.
    #   * :read_error: There was a problem reading a local file or an error
    #     returned by the read callback.
    #   * :out_of_memory: A memory allocation request failed. This is serious
    #     badness and things are severely screwed up if this ever occurs.
    #   * :operation_timedout: Operation timeout. The specified time-out
    #     period was reached according to the conditions.
    #   * :ftp_port_failed: The FTP PORT command returned error. This mostly
    #     happens when you haven't specified a good enough address for
    #     libcurl to use. See CURLOPT_FTPPORT.
    #   * :ftp_couldnt_use_rest: The FTP REST command returned error. This
    #     should never happen if the server is sane.
    #   * :range_error: The server does not support or accept range requests.
    #   * :http_post_error: This is an odd error that mainly occurs due to
    #     internal confusion.
    #   * :ssl_connect_error: A problem occurred somewhere in the SSL/TLS
    #     handshake. You really want the error buffer and read the message
    #     there as it pinpoints the problem slightly more. Could be
    #     certificates (file formats, paths, permissions), passwords, and others.
    #   * :bad_download_resume: The download could not be resumed because
    #     the specified offset was out of the file boundary.
    #   * :file_couldnt_read_file: A file given with FILE:// couldn't be
    #     opened. Most likely because the file path doesn't identify an
    #     existing file. Did you check file permissions?
    #   * :ldap_cannot_bind: LDAP cannot bind. LDAP bind operation failed.
    #   * :ldap_search_failed: LDAP search failed.
    #   * :function_not_found: Function not found. A required zlib function was not found.
    #   * :aborted_by_callback: Aborted by callback. A callback returned
    #     "abort" to libcurl.
    #   * :bad_function_argument: Internal error. A function was called with
    #     a bad parameter.
    #   * :interface_failed: Interface error. A specified outgoing interface
    #     could not be used. Set which interface to use for outgoing
    #     connections' source IP address with CURLOPT_INTERFACE.
    #   * :too_many_redirects: Too many redirects. When following redirects,
    #     libcurl hit the maximum amount. Set your limit with CURLOPT_MAXREDIRS.
    #   * :unknown_option: An option passed to libcurl is not recognized/known.
    #     Refer to the appropriate documentation. This is most likely a
    #     problem in the program that uses libcurl. The error buffer might
    #     contain more specific information about which exact option it concerns.
    #   * :telnet_option_syntax: A telnet option string was Illegally formatted.
    #   * :peer_failed_verification: The remote server's SSL certificate or
    #     SSH md5 fingerprint was deemed not OK.
    #   * :got_nothing: Nothing was returned from the server, and under the
    #     circumstances, getting nothing is considered an error.
    #   * :ssl_engine_notfound: The specified crypto engine wasn't found.
    #   * :ssl_engine_setfailed: Failed setting the selected SSL crypto engine as default!
    #   * :send_error: Failed sending network data.
    #   * :recv_error: Failure with receiving network data.
    #   * :ssl_certproblem: problem with the local client certificate.
    #   * :ssl_cipher: Couldn't use specified cipher.
    #   * :bad_content_encoding: Unrecognized transfer encoding.
    #   * :ldap_invalid_url: Invalid LDAP URL.
    #   * :filesize_exceeded: Maximum file size exceeded.
    #   * :use_ssl_failed: Requested FTP SSL level failed.
    #   * :send_fail_rewind: When doing a send operation curl had to rewind the data to
    #     retransmit, but the rewinding operation failed.
    #   * :ssl_engine_initfailed: Initiating the SSL Engine failed.
    #   * :login_denied: The remote server denied curl to login
    #   * :tftp_notfound: File not found on TFTP server.
    #   * :tftp_perm: Permission problem on TFTP server.
    #   * :remote_disk_full: Out of disk space on the server.
    #   * :tftp_illegal: Illegal TFTP operation.
    #   * :tftp_unknownid: Unknown TFTP transfer ID.
    #   * :remote_file_exists: File already exists and will not be overwritten.
    #   * :tftp_nosuchuser: This error should never be returned by a properly
    #     functioning TFTP server.
    #   * :conv_failed: Character conversion failed.
    #   * :conv_reqd: Caller must register conversion callbacks.
    #   * :ssl_cacert_badfile: Problem with reading the SSL CA cert (path? access rights?):
    #   * :remote_file_not_found: The resource referenced in the URL does not exist.
    #   * :ssh: An unspecified error occurred during the SSH session.
    #   * :ssl_shutdown_failed: Failed to shut down the SSL connection.
    #   * :again: Socket is not ready for send/recv wait till it's ready and try again.
    #     This return code is only returned from curl_easy_recv(3) and curl_easy_send(3)
    #   * :ssl_crl_badfile: Failed to load CRL file
    #   * :ssl_issuer_error: Issuer check failed
    #   * :ftp_pret_failed: The FTP server does not understand the PRET command at
    #     all or does not support the given argument. Be careful when
    #     using CURLOPT_CUSTOMREQUEST, a custom LIST command will be sent with PRET CMD
    #     before PASV as well.
    #   * :rtsp_cseq_error: Mismatch of RTSP CSeq numbers.
    #   * :rtsp_session_error: Mismatch of RTSP Session Identifiers.
    #   * :ftp_bad_file_list: Unable to parse FTP file list (during FTP wildcard downloading).
    #   * :chunk_failed: Chunk callback reported error.
    #   * :obsolete: These error codes will never be returned. They were used in an old
    #     libcurl version and are currently unused.
    #
    # @see http://curl.haxx.se/libcurl/c/libcurl-errors.html
    attr_accessor :return_code

    # Initialize a new Easy.
    # It initializes curl, if not already done and applies the provided options.
    # Look into {Ethon::Easy::Options Options} to see what you can provide in the
    # options hash.
    #
    # @example Create a new Easy.
    #   Easy.new(url: "www.google.de")
    #
    # @param [ Hash ] options The options to set.
    # @option options :headers [ Hash ] Request headers.
    #
    # @return [ Easy ] A new Easy.
    #
    # @see Ethon::Easy::Options
    # @see http://curl.haxx.se/libcurl/c/curl_easy_setopt.html
    def initialize(options = {})
      Curl.init
      set_attributes(options)
      set_callbacks
    end

    # Set given options.
    #
    # @example Set options.
    #   easy.set_attributes(options)
    #
    # @param [ Hash ] options The options.
    #
    # @raise InvalidOption
    #
    # @see initialize
    def set_attributes(options)
      options.each_pair do |key, value|
        method = "#{key}="
        unless respond_to?(method)
          raise Errors::InvalidOption.new(key)
        end
        send(method, value)
      end
    end

    # Reset easy. This means resetting all options and instance variables.
    # Also the easy handle is resetted.
    #
    # @example Reset.
    #   easy.reset
    def reset
      @url = nil
      @escape = nil
      @hash = nil
      @on_complete = nil
      @on_headers = nil
      @on_body = nil
      @on_progress = nil
      @procs = nil
      @mirror = nil
      Curl.easy_reset(handle)
      set_callbacks
    end

    # Clones libcurl session handle. This means that all options that is set in
    #   the current handle will be set on duplicated handle.
    def dup
      e = super
      e.handle = Curl.easy_duphandle(handle)
      e.instance_variable_set(:@body_write_callback, nil)
      e.instance_variable_set(:@header_write_callback, nil)
      e.instance_variable_set(:@debug_callback, nil)
      e.instance_variable_set(:@progress_callback, nil)
      e.set_callbacks
      e
    end
    # Url escapes the value.
    #
    # @example Url escape.
    #   easy.escape(value)
    #
    # @param [ String ] value The value to escape.
    #
    # @return [ String ] The escaped value.
    #
    # @api private
    def escape(value)
      string_pointer = Curl.easy_escape(handle, value, value.bytesize)
      returned_string = string_pointer.read_string
      Curl.free(string_pointer)
      returned_string
    end

    # Returns the informations available through libcurl as
    # a hash.
    #
    # @return [ Hash ] The informations hash.
    def to_hash
      Kernel.warn("Ethon: Easy#to_hash is deprecated and will be removed, please use #mirror.")
      mirror.to_hash
    end

    def mirror
      @mirror ||= Mirror.from_easy(self)
    end

    # Return pretty log out.
    #
    # @example Return log out.
    #   easy.log_inspect
    #
    # @return [ String ] The log out.
    def log_inspect
      "EASY #{mirror.log_informations.map{|k, v| "#{k}=#{v}"}.flatten.join(' ')}"
    end
  end
end
