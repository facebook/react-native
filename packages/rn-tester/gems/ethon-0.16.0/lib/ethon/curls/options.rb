# frozen_string_literal: true
module Ethon
  module Curls

    # This module contains logic for setting options on
    # easy or multi interface.
    module Options

      OPTION_STRINGS = { :easy => 'easy_options', :multi => 'multi_options' }.freeze
      FOPTION_STRINGS = { :easy => 'EASY_OPTIONS', :multi => 'MULTI_OPTIONS' }.freeze
      FUNCS = { :easy => 'easy_setopt', :multi => 'multi_setopt' }.freeze
      # Sets appropriate option for easy, depending on value type.
      def set_option(option, value, handle, type = :easy)
        type = type.to_sym unless type.is_a?(Symbol)
        raise NameError, "Ethon::Curls::Options unknown type #{type}." unless respond_to?(OPTION_STRINGS[type])
        opthash=send(OPTION_STRINGS[type], nil)
        raise Errors::InvalidOption.new(option) unless opthash.include?(option)

        case opthash[option][:type]
        when :none
          return if value.nil?
          value=1
          va_type=:long
        when :int
          return if value.nil?
          va_type=:long
          value=value.to_i
        when :bool
          return if value.nil?
          va_type=:long
          value=(value&&value!=0) ? 1 : 0
        when :time
          return if value.nil?
          va_type=:long
          value=value.to_i
        when :enum
          return if value.nil?
          va_type=:long
          value = case value
          when Symbol
            opthash[option][:opts][value]
          when String
            opthash[option][:opts][value.to_sym]
          else
            value
          end.to_i
        when :bitmask
          return if value.nil?
          va_type=:long
          value = case value
          when Symbol
            opthash[option][:opts][value]
          when Array
            value.inject(0) { |res,v| res|opthash[option][:opts][v] }
          else
            value
          end.to_i
        when :string
          va_type=:string
          value=value.to_s unless value.nil?
        when :string_as_pointer
          va_type = :pointer
          s = ''
          s = value.to_s unless value.nil?
          value = FFI::MemoryPointer.new(:char, s.bytesize)
          value.put_bytes(0, s)
        when :string_escape_null
          va_type=:string
          value=Util.escape_zero_byte(value) unless value.nil?
        when :ffipointer
          va_type=:pointer
          raise Errors::InvalidValue.new(option,value) unless value.nil? or value.is_a? FFI::Pointer
        when :curl_slist
          va_type=:pointer
          raise Errors::InvalidValue.new(option,value) unless value.nil? or value.is_a? FFI::Pointer
        when :buffer
          raise NotImplementedError, "Ethon::Curls::Options option #{option} buffer type not implemented."
        when :dontuse_object
          raise NotImplementedError, "Ethon::Curls::Options option #{option} type not implemented."
        when :cbdata
          raise NotImplementedError, "Ethon::Curls::Options option #{option} callback data type not implemented. Use Ruby closures."
        when :callback
          va_type=:callback
          raise Errors::InvalidValue.new(option,value) unless value.nil? or value.is_a? Proc
        when :socket_callback
          va_type=:socket_callback
          raise Errors::InvalidValue.new(option,value) unless value.nil? or value.is_a? Proc
        when :timer_callback
          va_type=:timer_callback
          raise Errors::InvalidValue.new(option,value) unless value.nil? or value.is_a? Proc
        when :debug_callback
          va_type=:debug_callback
          raise Errors::InvalidValue.new(option,value) unless value.nil? or value.is_a? Proc
        when :progress_callback
          va_type=:progress_callback
          raise Errors::InvalidValue.new(option,value) unless value.nil? or value.is_a? Proc
        when :off_t
          return if value.nil?
          va_type=:int64
          value=value.to_i
        end

        if va_type==:long or va_type==:int64 then
            bits=FFI.type_size(va_type)*8
            tv=((value<0) ? value.abs-1 : value)
            raise Errors::InvalidValue.new(option,value) unless tv<(1<<bits)
        end
        send(FUNCS[type], handle, opthash[option][:opt], va_type, value)
      end

      OPTION_TYPE_BASE = {
        :long => 0,
        :objectpoint => 10000,
        :functionpoint => 20000,
        :off_t => 30000
      }
      OPTION_TYPE_MAP = {
        :none => :long,
        :int => :long,
        :bool => :long,
        :time => :long,
        :enum => :long, # Two ways to specify values (as opts parameter):
                        #   * Array of symbols, these will number sequentially
                        #     starting at 0. Skip elements with nil. (see :netrc)
                        #   * Hash of :symbol => enum_value (See :proxytype)
        :bitmask => :long, # Three ways to specify values (as opts parameter):
                           #   * Hash of :symbol => bitmask_value or Array.
                           #     An Array can be an array of already defined
                           #     Symbols, which represents a bitwise or of those
                           #     symbols. (See :httpauth)
                           #   * Array of symbols, these will number the bits
                           #     sequentially (i.e. 0, 1, 2, 4, etc.). Skip
                           #     elements with nil. The last element can be a
                           #     Hash, which will be interpreted as above.
                           #     (See :protocols)
                           # :all defaults to all bits set
        :string => :objectpoint,
        :string_escape_null => :objectpoint,
        :string_as_pointer => :objectpoint,
        :ffipointer => :objectpoint, # FFI::Pointer
        :curl_slist => :objectpoint,
        :buffer => :objectpoint, # A memory buffer of size defined in the options
        :dontuse_object => :objectpoint, # An object we don't support (e.g. FILE*)
        :cbdata => :objectpoint,
        :callback => :functionpoint,
        :socket_callback => :functionpoint,
        :timer_callback => :functionpoint,
        :debug_callback => :functionpoint,
        :progress_callback => :functionpoint,
        :off_t => :off_t,
      }

      def self.option(ftype,name,type,num,opts=nil)
        case type
        when :enum
          if opts.is_a? Array then
            opts=Hash[opts.each_with_index.to_a]
          elsif not opts.is_a? Hash then
            raise TypeError, "Ethon::Curls::Options #{ftype} #{name} Expected opts to be an Array or a Hash."
          end

        when :bitmask
          if opts.is_a? Array then
            if opts.last.is_a? Hash then
              hopts=opts.pop
            else
              hopts={}
            end
            opts.each_with_index do |v,i|
                next if v.nil?
                if i==0 then
                  hopts[v]=0
                else
                  hopts[v]=1<<(i-1)
                end
            end
            opts=hopts
          elsif not opts.is_a? Hash then
            raise TypeError, "Ethon::Curls::Options #{ftype} #{name} Expected opts to be an Array or a Hash."
          end
          opts[:all]=-1 unless opts.include? :all
          opts.each do |k,v|
            if v.is_a? Array then
              opts[k]=v.map { |b| opts[b] }.inject :|
            end
          end

        when :buffer
          raise TypeError, "Ethon::Curls::Options #{ftype} #{name} Expected opts to be an Array or a Hash." unless opts.is_a? Integer

        else
          raise ArgumentError, "Ethon::Curls::Options #{ftype} #{name} Expected no opts." unless opts.nil?
        end
        opthash=const_get(FOPTION_STRINGS[ftype])
        opthash[name] = { :type => type,
                          :opt => OPTION_TYPE_BASE[OPTION_TYPE_MAP[type]] + num,
                          :opts => opts }
      end

      def self.option_alias(ftype,name,*aliases)
        opthash=const_get(FOPTION_STRINGS[ftype])
        aliases.each { |a| opthash[a]=opthash[name] }
      end

      def self.option_type(type)
        cname = FOPTION_STRINGS[type]
        const_set(cname, {})
        define_method(OPTION_STRINGS[type]) do |rt|
          return Ethon::Curls::Options.const_get(cname).map { |k, v| [k, v[:opt]] } if rt == :enum
          Ethon::Curls::Options.const_get(cname)
        end
      end

      # Curl multi options, refer
      # Defined @ https://github.com/bagder/curl/blob/master/include/curl/multi.h
      # Documentation @ http://curl.haxx.se/libcurl/c/curl_multi_setopt.html
      option_type :multi

      option :multi, :socketfunction, :socket_callback, 1
      option :multi, :socketdata, :cbdata, 2
      option :multi, :pipelining, :int, 3
      option :multi, :timerfunction, :timer_callback, 4
      option :multi, :timerdata, :cbdata, 5
      option :multi, :maxconnects, :int, 6
      option :multi, :max_host_connections, :int, 7
      option :multi, :max_pipeline_length, :int, 8
      option :multi, :content_length_penalty_size, :off_t, 9
      option :multi, :chunk_length_penalty_size, :off_t, 10
      option :multi, :pipelining_site_bl, :dontuse_object, 11
      option :multi, :pipelining_server_bl, :dontuse_object, 12
      option :multi, :max_total_connections, :int, 3

      # Curl easy options
      # Defined @ https://github.com/bagder/curl/blob/master/include/curl/curl.h
      # Documentation @ http://curl.haxx.se/libcurl/c/curl_easy_setopt.html
      ## BEHAVIOR OPTIONS
      option_type :easy

      option :easy, :verbose, :bool, 41
      option :easy, :header, :bool, 42
      option :easy, :noprogress, :bool, 43
      option :easy, :nosignal, :bool, 99
      option :easy, :wildcardmatch, :bool, 197
      ## CALLBACK OPTIONS
      option :easy, :writefunction, :callback, 11
      option :easy, :file, :cbdata, 1
      option_alias :easy, :file, :writedata
      option :easy, :readfunction, :callback, 12
      option :easy, :infile, :cbdata, 9
      option_alias :easy, :infile, :readdata
      option :easy, :ioctlfunction, :callback, 130
      option :easy, :ioctldata, :cbdata, 131
      option :easy, :seekfunction, :callback, 167
      option :easy, :seekdata, :cbdata, 168
      option :easy, :sockoptfunction, :callback, 148
      option :easy, :sockoptdata, :cbdata, 149
      option :easy, :opensocketfunction, :callback, 163
      option :easy, :opensocketdata, :cbdata, 164
      option :easy, :closesocketfunction, :callback, 208
      option :easy, :closesocketdata, :cbdata, 209
      option :easy, :path_as_is, :bool, 234
      option :easy, :progressfunction, :progress_callback, 56
      option :easy, :progressdata, :cbdata, 57
      option :easy, :headerfunction, :callback, 79
      option :easy, :writeheader, :cbdata, 29
      option_alias :easy, :writeheader, :headerdata
      option :easy, :debugfunction, :debug_callback, 94
      option :easy, :debugdata, :cbdata, 95
      option :easy, :ssl_ctx_function, :callback, 108
      option :easy, :ssl_ctx_data, :cbdata, 109
      option :easy, :conv_to_network_function, :callback, 143
      option :easy, :conv_from_network_function, :callback, 142
      option :easy, :conv_from_utf8_function, :callback, 144
      option :easy, :interleavefunction, :callback, 196
      option :easy, :interleavedata, :cbdata, 195
      option :easy, :chunk_bgn_function, :callback, 198
      option :easy, :chunk_end_function, :callback, 199
      option :easy, :chunk_data, :cbdata, 201
      option :easy, :fnmatch_function, :callback, 200
      option :easy, :fnmatch_data, :cbdata, 202
      option :easy, :xferinfofunction, :progress_callback, 219
      option :easy, :xferinfodata, :cbdata, 57
      ## ERROR OPTIONS
      option :easy, :errorbuffer, :buffer, 10, 256
      option :easy, :stderr, :dontuse_object, 37
      option :easy, :failonerror, :bool, 45
      ## NETWORK OPTIONS
      option :easy, :url, :string, 2
      option :easy, :protocols, :bitmask, 181, [nil, :http, :https, :ftp, :ftps, :scp, :sftp, :telnet, :ldap, :ldaps, :dict, :file, :tftp, :imap, :imaps, :pop3, :pop3s, :smtp, :smtps, :rtsp, :rtmp, :rtmpt, :rtmpe, :rtmpte, :rtmps, :rtmpts, :gopher]
      option :easy, :redir_protocols, :bitmask, 182, [nil, :http, :https, :ftp, :ftps, :scp, :sftp, :telnet, :ldap, :ldaps, :dict, :file, :tftp, :imap, :imaps, :pop3, :pop3s, :smtp, :smtps, :rtsp, :rtmp, :rtmpt, :rtmpe, :rtmpte, :rtmps, :rtmpts, :gopher]
      option :easy, :proxy, :string, 4
      option :easy, :proxyport, :int, 59
      option :easy, :proxytype, :enum, 101, [:http, :http_1_0, :https, nil, :socks4, :socks5, :socks4a, :socks5_hostname]
      option :easy, :noproxy, :string, 177
      option :easy, :httpproxytunnel, :bool, 61
      option :easy, :socks5_gssapi_service, :string, 179
      option :easy, :socks5_gssapi_nec, :bool, 180
      option :easy, :interface, :string, 62
      option :easy, :localport, :int, 139
      option :easy, :localportrange, :int, 140
      option :easy, :dns_cache_timeout, :int, 92
      option :easy, :dns_use_global_cache, :bool, 91 # Obsolete
      option :easy, :dns_interface, :string, 221
      option :easy, :dns_local_ip4, :string, 222
      option :easy, :dns_shuffle_addresses, :bool, 275
      option :easy, :buffersize, :int, 98
      option :easy, :port, :int, 3
      option :easy, :tcp_nodelay, :bool, 121
      option :easy, :address_scope, :int, 171
      option :easy, :tcp_fastopen, :bool, 212
      option :easy, :tcp_keepalive, :bool, 213
      option :easy, :tcp_keepidle, :int, 214
      option :easy, :tcp_keepintvl, :int, 215
      ## NAMES and PASSWORDS OPTIONS (Authentication)
      option :easy, :netrc, :enum, 51, [:ignored, :optional, :required]
      option :easy, :netrc_file, :string, 118
      option :easy, :userpwd, :string, 5
      option :easy, :proxyuserpwd, :string, 6
      option :easy, :username, :string, 173
      option :easy, :password, :string, 174
      option :easy, :proxyusername, :string, 175
      option :easy, :proxypassword, :string, 176
      option :easy, :httpauth, :bitmask, 107, [:none, :basic, :digest, :gssnegotiate, :ntlm, :digest_ie, :ntlm_wb, {:only => 1<<31, :any => ~0x10, :anysafe => ~0x11, :auto => 0x1f}]
      option :easy, :tlsauth_type, :enum, 206, [:none, :srp]
      option :easy, :tlsauth_username, :string, 204
      option :easy, :tlsauth_password, :string, 205
      option :easy, :proxyauth, :bitmask, 111, [:none, :basic, :digest, :gssnegotiate, :ntlm, :digest_ie, :ntlm_wb, {:only => 1<<31, :any => ~0x10, :anysafe => ~0x11, :auto => 0x1f}]
      option :easy, :sasl_ir, :bool, 218
      ## HTTP OPTIONS
      option :easy, :autoreferer, :bool, 58
      option :easy, :accept_encoding, :string, 102
      option_alias :easy, :accept_encoding, :encoding
      option :easy, :transfer_encoding, :bool, 207
      option :easy, :followlocation, :bool, 52
      option :easy, :unrestricted_auth, :bool, 105
      option :easy, :maxredirs, :int, 68
      option :easy, :postredir, :bitmask, 161, [:get_all, :post_301, :post_302, :post_303, {:post_all => [:post_301, :post_302, :post_303]}]
      option_alias :easy, :postredir, :post301
      option :easy, :put, :bool, 54
      option :easy, :post, :bool, 47
      option :easy, :postfields, :string, 15
      option :easy, :postfieldsize, :int, 60
      option :easy, :postfieldsize_large, :off_t, 120
      option :easy, :copypostfields, :string_as_pointer, 165
      option :easy, :httppost, :ffipointer, 24
      option :easy, :referer, :string, 16
      option :easy, :useragent, :string, 18
      option :easy, :httpheader, :curl_slist, 23
      option :easy, :http200aliases, :curl_slist, 104
      option :easy, :cookie, :string, 22
      option :easy, :cookiefile, :string, 31
      option :easy, :cookiejar, :string, 82
      option :easy, :cookiesession, :bool, 96
      option :easy, :cookielist, :string, 135
      option :easy, :httpget, :bool, 80
      option :easy, :http_version, :enum, 84, [:none, :httpv1_0, :httpv1_1, :httpv2_0, :httpv2_tls, :httpv2_prior_knowledge]
      option :easy, :ignore_content_length, :bool, 136
      option :easy, :http_content_decoding, :bool, 158
      option :easy, :http_transfer_decoding, :bool, 157
      ## SMTP OPTIONS
      option :easy, :mail_from, :string, 186
      option :easy, :mail_rcpt, :curl_slist, 187
      option :easy, :mail_auth, :string, 217
      ## TFTP OPTIONS
      option :easy, :tftp_blksize, :int, 178
      ## FTP OPTIONS
      option :easy, :ftpport, :string, 17
      option :easy, :quote, :curl_slist, 28
      option :easy, :postquote, :curl_slist, 39
      option :easy, :prequote, :curl_slist, 93
      option :easy, :dirlistonly, :bool, 48
      option_alias :easy, :dirlistonly, :ftplistonly
      option :easy, :append, :bool, 50
      option_alias :easy, :append, :ftpappend
      option :easy, :ftp_use_eprt, :bool, 106
      option :easy, :ftp_use_epsv, :bool, 85
      option :easy, :ftp_use_pret, :bool, 188
      option :easy, :ftp_create_missing_dirs, :bool, 110
      option :easy, :ftp_response_timeout, :int, 112
      option_alias :easy, :ftp_response_timeout, :server_response_timeout
      option :easy, :ftp_alternative_to_user, :string, 147
      option :easy, :ftp_skip_pasv_ip, :bool, 137
      option :easy, :ftpsslauth, :enum, 129, [:default, :ssl, :tls]
      option :easy, :ftp_ssl_ccc, :enum, 154, [:none, :passive, :active]
      option :easy, :ftp_account, :string, 134
      option :easy, :ftp_filemethod, :enum, 138, [:default, :multicwd, :nocwd, :singlecwd]
      ## RTSP OPTIONS
      option :easy, :rtsp_request, :enum, 189, [:none, :options, :describe, :announce, :setup, :play, :pause, :teardown, :get_parameter, :set_parameter, :record, :receive]
      option :easy, :rtsp_session_id, :string, 190
      option :easy, :rtsp_stream_uri, :string, 191
      option :easy, :rtsp_transport, :string, 192
      option_alias :easy, :httpheader, :rtspheader
      option :easy, :rtsp_client_cseq, :int, 193
      option :easy, :rtsp_server_cseq, :int, 194
      ## PROTOCOL OPTIONS
      option :easy, :transfertext, :bool, 53
      option :easy, :proxy_transfer_mode, :bool, 166
      option :easy, :crlf, :bool, 27
      option :easy, :range, :string, 7
      option :easy, :resume_from, :int, 21
      option :easy, :resume_from_large, :off_t, 116
      option :easy, :customrequest, :string, 36
      option :easy, :filetime, :bool, 69
      option :easy, :nobody, :bool, 44
      option :easy, :infilesize, :int, 14
      option :easy, :infilesize_large, :off_t, 115
      option :easy, :upload, :bool, 46
      option :easy, :maxfilesize, :int, 114
      option :easy, :maxfilesize_large, :off_t, 117
      option :easy, :timecondition, :enum, 33, [:none, :ifmodsince, :ifunmodsince, :lastmod]
      option :easy, :timevalue, :time, 34
      ## CONNECTION OPTIONS
      option :easy, :timeout, :int, 13
      option :easy, :timeout_ms, :int, 155
      option :easy, :low_speed_limit, :int, 19
      option :easy, :low_speed_time, :int, 20
      option :easy, :max_send_speed_large, :off_t, 145
      option :easy, :max_recv_speed_large, :off_t, 146
      option :easy, :maxconnects, :int, 71
      option :easy, :fresh_connect, :bool, 74
      option :easy, :forbid_reuse, :bool, 75
      option :easy, :connecttimeout, :int, 78
      option :easy, :connecttimeout_ms, :int, 156
      option :easy, :ipresolve, :enum, 113, [:whatever, :v4, :v6]
      option :easy, :connect_only, :bool, 141
      option :easy, :use_ssl, :enum, 119, [:none, :try, :control, :all]
      option_alias :easy, :use_ssl, :ftp_ssl
      option :easy, :resolve, :curl_slist, 203
      option :easy, :dns_servers, :string, 211
      option :easy, :accepttimeout_ms, :int, 212
      option :easy, :unix_socket_path, :string, 231
      option :easy, :pipewait, :bool, 237
      option_alias :easy, :unix_socket_path, :unix_socket
      ## SSL and SECURITY OPTIONS
      option :easy, :sslcert, :string, 25
      option :easy, :sslcerttype, :string, 86
      option :easy, :sslkey, :string, 87
      option :easy, :sslkeytype, :string, 88
      option :easy, :keypasswd, :string, 26
      option_alias :easy, :keypasswd, :sslcertpasswd
      option_alias :easy, :keypasswd, :sslkeypasswd
      option :easy, :sslengine, :string, 89
      option :easy, :sslengine_default, :none, 90
      option :easy, :sslversion, :enum, 32, [:default, :tlsv1, :sslv2, :sslv3, :tlsv1_0, :tlsv1_1, :tlsv1_2, :tlsv1_3]
      option :easy, :ssl_verifypeer, :bool, 64
      option :easy, :cainfo, :string, 65
      option :easy, :issuercert, :string, 170
      option :easy, :capath, :string, 97
      option :easy, :crlfile, :string, 169
      option :easy, :ssl_verifyhost, :int, 81
      option :easy, :certinfo, :bool, 172
      option :easy, :random_file, :string, 76
      option :easy, :egdsocket, :string, 77
      option :easy, :ssl_cipher_list, :string, 83
      option :easy, :ssl_sessionid_cache, :bool, 150
      option :easy, :ssl_options, :bitmask, 216, [nil, :allow_beast]
      option :easy, :krblevel, :string, 63
      option_alias :easy, :krblevel, :krb4level
      option :easy, :gssapi_delegation, :bitmask, 210, [:none, :policy_flag, :flag]
      option :easy, :pinnedpublickey, :string, 230
      option_alias :easy, :pinnedpublickey, :pinned_public_key
      ## PROXY SSL OPTIONS
      option :easy, :proxy_cainfo, :string, 246
      option :easy, :proxy_capath, :string, 247
      option :easy, :proxy_ssl_verifypeer, :bool, 248
      option :easy, :proxy_ssl_verifyhost, :int, 249
      option :easy, :proxy_sslversion, :enum, 250, [:default, :tlsv1, :sslv2, :sslv3, :tlsv1_0, :tlsv1_1, :tlsv1_2, :tlsv1_3]
      option :easy, :proxy_tlsauth_username, :string, 251
      option :easy, :proxy_tlsauth_password, :string, 252
      option :easy, :proxy_tlsauth_type, :enum, 253, [:none, :srp]
      option :easy, :proxy_sslcert, :string, 254
      option :easy, :proxy_sslcerttype, :string, 255
      option :easy, :proxy_sslkey, :string, 256
      option :easy, :proxy_sslkeytype, :string, 257
      option :easy, :proxy_keypasswd, :string, 258
      option_alias :easy, :proxy_keypasswd, :proxy_sslcertpasswd
      option_alias :easy, :proxy_keypasswd, :proxy_sslkeypasswd
      option :easy, :proxy_ssl_cipher_list, :string, 259
      option :easy, :proxy_crlfile, :string, 260
      option :easy, :proxy_ssl_options, :bitmask, 261, [nil, :allow_beast]
      option :easy, :pre_proxy, :string, 262
      option :easy, :proxy_pinnedpublickey, :string, 263
      option_alias :easy, :proxy_pinnedpublickey, :proxy_pinned_public_key
      option :easy, :proxy_issuercert, :string, 296
      ## SSH OPTIONS
      option :easy, :ssh_auth_types, :bitmask, 151, [:none, :publickey, :password, :host, :keyboard, :agent, {:any => [:all], :default => [:any]}]
      option :easy, :ssh_host_public_key_md5, :string, 162
      option :easy, :ssh_public_keyfile, :string, 152
      option :easy, :ssh_private_keyfile, :string, 153
      option :easy, :ssh_knownhosts, :string, 183
      option :easy, :ssh_keyfunction, :callback, 184
      option :easy, :khstat, :enum, -1, [:fine_add_to_file, :fine, :reject, :defer] # Kludge to make this enum available... Access via CurL::EASY_OPTIONS[:khstat][:opt]
      option :easy, :ssh_keydata, :cbdata, 185
      ## OTHER OPTIONS
      option :easy, :private, :cbdata, 103
      option :easy, :share, :dontuse_object, 100
      option :easy, :new_file_perms, :int, 159
      option :easy, :new_directory_perms, :int, 160
      ## TELNET OPTIONS
      option :easy, :telnetoptions, :curl_slist, 70
    end
  end
end
