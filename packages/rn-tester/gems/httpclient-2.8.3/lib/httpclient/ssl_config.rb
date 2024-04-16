# HTTPClient - HTTP client library.
# Copyright (C) 2000-2015  NAKAMURA, Hiroshi  <nahi@ruby-lang.org>.
#
# This program is copyrighted free software by NAKAMURA, Hiroshi.  You can
# redistribute it and/or modify it under the same terms of Ruby's license;
# either the dual license version in 2003, or any later version.


class HTTPClient

  begin
    require 'openssl'
    SSLEnabled = true
  rescue LoadError
    SSLEnabled = false
  end

  # Represents SSL configuration for HTTPClient instance.
  # The implementation depends on OpenSSL.
  #
  # == Trust Anchor Control
  #
  # SSLConfig loads 'httpclient/cacert.pem' as a trust anchor
  # (trusted certificate(s)) with add_trust_ca in initialization time.
  # This means that HTTPClient instance trusts some CA certificates by default,
  # like Web browsers.  'httpclient/cacert.pem' is downloaded from curl web
  # site by the author and included in released package.
  #
  # On JRuby, HTTPClient uses Java runtime's trusted CA certificates, not
  # cacert.pem by default. You can load cacert.pem by calling
  # SSLConfig#load_trust_ca manually like:
  #
  #   HTTPClient.new { self.ssl_config.load_trust_ca }.get("https://...")
  #
  # You may want to change trust anchor by yourself.  Call clear_cert_store
  # then add_trust_ca for that purpose.
  class SSLConfig
    include HTTPClient::Util
    if SSLEnabled
      include OpenSSL

      module ::OpenSSL
        module X509
          class Store
            attr_reader :_httpclient_cert_store_items

            # TODO: use prepend instead when we drop JRuby + 1.9.x support
            wrapped = {}

            wrapped[:initialize] = instance_method(:initialize)
            define_method(:initialize) do |*args|
              wrapped[:initialize].bind(self).call(*args)
              @_httpclient_cert_store_items = [ENV['SSL_CERT_FILE'] || :default]
            end

            [:add_cert, :add_file, :add_path].each do |m|
              wrapped[m] = instance_method(m)
              define_method(m) do |cert|
                res = wrapped[m].bind(self).call(cert)
                @_httpclient_cert_store_items << cert
                res
              end
            end
          end
        end
      end
    end

    class << self
    private
      def attr_config(symbol)
        name = symbol.to_s
        ivar_name = "@#{name}"
        define_method(name) {
          instance_variable_get(ivar_name)
        }
        define_method("#{name}=") { |rhs|
          if instance_variable_get(ivar_name) != rhs
            instance_variable_set(ivar_name, rhs)
            change_notify
          end
        }
        symbol
      end
    end


    CIPHERS_DEFAULT = "ALL:!aNULL:!eNULL:!SSLv2" # OpenSSL >1.0.0 default

    # Which TLS protocol version (also called method) will be used. Defaults
    # to :auto which means that OpenSSL decides (In my tests this resulted
    # with always the highest available protocol being used).
    # String name of OpenSSL's SSL version method name: TLSv1_2, TLSv1_1, TLSv1,
    # SSLv2, SSLv23, SSLv3 or :auto (and nil) to allow version negotiation (default).
    # See {OpenSSL::SSL::SSLContext::METHODS} for a list of available versions
    # in your specific Ruby environment.
    attr_config :ssl_version
    # OpenSSL::X509::Certificate:: certificate for SSL client authentication.
    # nil by default. (no client authentication)
    attr_config :client_cert
    # OpenSSL::PKey::PKey:: private key for SSL client authentication.
    # nil by default. (no client authentication)
    attr_config :client_key
    # OpenSSL::PKey::PKey:: private key pass phrase for client_key.
    # nil by default. (no pass phrase)
    attr_config :client_key_pass

    # A number which represents OpenSSL's verify mode.  Default value is
    # OpenSSL::SSL::VERIFY_PEER | OpenSSL::SSL::VERIFY_FAIL_IF_NO_PEER_CERT.
    attr_config :verify_mode
    # A number of verify depth.  Certification path which length is longer than
    # this depth is not allowed.
    # CAUTION: this is OpenSSL specific option and ignored on JRuby.
    attr_config :verify_depth
    # A callback handler for custom certificate verification.  nil by default.
    # If the handler is set, handler.call is invoked just after general
    # OpenSSL's verification.  handler.call is invoked with 2 arguments,
    # ok and ctx; ok is a result of general OpenSSL's verification.  ctx is a
    # OpenSSL::X509::StoreContext.
    attr_config :verify_callback
    # SSL timeout in sec.  nil by default.
    attr_config :timeout
    # A number of OpenSSL's SSL options.  Default value is
    # OpenSSL::SSL::OP_ALL | OpenSSL::SSL::OP_NO_SSLv2
    # CAUTION: this is OpenSSL specific option and ignored on JRuby.
    # Use ssl_version to specify the TLS version you want to use.
    attr_config :options
    # A String of OpenSSL's cipher configuration.  Default value is
    # ALL:!ADH:!LOW:!EXP:!MD5:+SSLv2:@STRENGTH
    # See ciphers(1) man in OpenSSL for more detail.
    attr_config :ciphers

    # OpenSSL::X509::X509::Store used for verification.  You can reset the
    # store with clear_cert_store and set the new store with cert_store=.
    attr_reader :cert_store # don't use if you don't know what it is.

    # For server side configuration.  Ignore this.
    attr_config :client_ca # :nodoc:

    # These array keeps original files/dirs that was added to @cert_store
    def cert_store_items; @cert_store._httpclient_cert_store_items; end
    attr_reader :cert_store_crl_items

    # Creates a SSLConfig.
    def initialize(client)
      return unless SSLEnabled
      @client = client
      @cert_store = X509::Store.new
      @cert_store_crl_items = []
      @client_cert = @client_key = @client_key_pass = @client_ca = nil
      @verify_mode = SSL::VERIFY_PEER | SSL::VERIFY_FAIL_IF_NO_PEER_CERT
      @verify_depth = nil
      @verify_callback = nil
      @dest = nil
      @timeout = nil
      @ssl_version = :auto
      # Follow ruby-ossl's definition
      @options = OpenSSL::SSL::OP_ALL
      @options &= ~OpenSSL::SSL::OP_DONT_INSERT_EMPTY_FRAGMENTS if defined?(OpenSSL::SSL::OP_DONT_INSERT_EMPTY_FRAGMENTS)
      @options |= OpenSSL::SSL::OP_NO_COMPRESSION if defined?(OpenSSL::SSL::OP_NO_COMPRESSION)
      @options |= OpenSSL::SSL::OP_NO_SSLv2 if defined?(OpenSSL::SSL::OP_NO_SSLv2)
      @options |= OpenSSL::SSL::OP_NO_SSLv3 if defined?(OpenSSL::SSL::OP_NO_SSLv3)
      # OpenSSL 0.9.8 default: "ALL:!ADH:!LOW:!EXP:!MD5:+SSLv2:@STRENGTH"
      @ciphers = CIPHERS_DEFAULT
      @cacerts_loaded = false
    end

    # Sets certificate and private key for SSL client authentication.
    # cert_file:: must be a filename of PEM/DER formatted file.
    # key_file:: must be a filename of PEM/DER formatted file.  Key must be an
    #            RSA key.  If you want to use other PKey algorithm,
    #            use client_key=.
    #
    # Calling this method resets all existing sessions if value is changed.
    def set_client_cert_file(cert_file, key_file, pass = nil)
      if (@client_cert != cert_file) || (@client_key != key_file) || (@client_key_pass != pass)
        @client_cert, @client_key, @client_key_pass = cert_file, key_file, pass
        change_notify
      end
    end

    # Sets OpenSSL's default trusted CA certificates.  Generally, OpenSSL is
    # configured to use OS's trusted CA certificates located at
    # /etc/pki/certs or /etc/ssl/certs.  Unfortunately OpenSSL's Windows build
    # does not work with Windows Certificate Storage.
    #
    # On Windows or when you build OpenSSL manually, you can set the
    # CA certificates directory by SSL_CERT_DIR env variable at runtime.
    #
    #   SSL_CERT_DIR=/etc/ssl/certs ruby -rhttpclient -e "..."
    #
    # Calling this method resets all existing sessions.
    def set_default_paths
      @cacerts_loaded = true # avoid lazy override
      @cert_store = X509::Store.new
      @cert_store.set_default_paths
      change_notify
    end

    # Drops current certificate store (OpenSSL::X509::Store) for SSL and create
    # new one for the next session.
    #
    # Calling this method resets all existing sessions.
    def clear_cert_store
      @cacerts_loaded = true # avoid lazy override
      @cert_store = X509::Store.new
      @cert_store._httpclient_cert_store_items.clear
      change_notify
    end

    # Sets new certificate store (OpenSSL::X509::Store).
    # don't use if you don't know what it is.
    #
    # Calling this method resets all existing sessions.
    def cert_store=(cert_store)
      # This is object equality check, since OpenSSL::X509::Store doesn't overload ==
      if !@cacerts_loaded || (@cert_store != cert_store)
        @cacerts_loaded = true # avoid lazy override
        @cert_store = cert_store
        change_notify
      end
    end

    # Sets trust anchor certificate(s) for verification.
    # trust_ca_file_or_hashed_dir:: a filename of a PEM/DER formatted
    #                               OpenSSL::X509::Certificate or
    #                               a 'c-rehash'eddirectory name which stores
    #                               trusted certificate files.
    #
    # Calling this method resets all existing sessions.
    def add_trust_ca(trust_ca_file_or_hashed_dir)
      unless File.exist?(trust_ca_file_or_hashed_dir)
        trust_ca_file_or_hashed_dir = File.join(File.dirname(__FILE__), trust_ca_file_or_hashed_dir)
      end
      @cacerts_loaded = true # avoid lazy override
      add_trust_ca_to_store(@cert_store, trust_ca_file_or_hashed_dir)
      change_notify
    end
    alias set_trust_ca add_trust_ca

    def add_trust_ca_to_store(cert_store, trust_ca_file_or_hashed_dir)
      if FileTest.directory?(trust_ca_file_or_hashed_dir)
        cert_store.add_path(trust_ca_file_or_hashed_dir)
      else
        cert_store.add_file(trust_ca_file_or_hashed_dir)
      end
    end

    # Loads default trust anchors.
    # Calling this method resets all existing sessions.
    def load_trust_ca
      load_cacerts(@cert_store)
      change_notify
    end

    # Adds CRL for verification.
    # crl:: a OpenSSL::X509::CRL or a filename of a PEM/DER formatted
    #       OpenSSL::X509::CRL.
    #
    # On JRuby, instead of setting CRL by yourself you can set following
    # options to let HTTPClient to perform revocation check with CRL and OCSP:
    # -J-Dcom.sun.security.enableCRLDP=true -J-Dcom.sun.net.ssl.checkRevocation=true
    # ex. jruby -J-Dcom.sun.security.enableCRLDP=true -J-Dcom.sun.net.ssl.checkRevocation=true app.rb
    #
    # Revoked cert example: https://test-sspev.verisign.com:2443/test-SSPEV-revoked-verisign.html
    #
    # Calling this method resets all existing sessions.
    def add_crl(crl)
      unless crl.is_a?(X509::CRL)
        crl = X509::CRL.new(File.open(crl) { |f| f.read })
      end
      @cert_store.add_crl(crl)
      @cert_store_crl_items << crl
      @cert_store.flags = X509::V_FLAG_CRL_CHECK | X509::V_FLAG_CRL_CHECK_ALL
      change_notify
    end
    alias set_crl add_crl

    def verify?
      @verify_mode && (@verify_mode & OpenSSL::SSL::VERIFY_PEER != 0)
    end

    # interfaces for SSLSocket.
    def set_context(ctx) # :nodoc:
      load_trust_ca unless @cacerts_loaded
      @cacerts_loaded = true
      # Verification: Use Store#verify_callback instead of SSLContext#verify*?
      ctx.cert_store = @cert_store
      ctx.verify_mode = @verify_mode
      ctx.verify_depth = @verify_depth if @verify_depth
      ctx.verify_callback = @verify_callback || method(:default_verify_callback)
      # SSL config
      if @client_cert
        ctx.cert = @client_cert.is_a?(X509::Certificate) ?  @client_cert :
          X509::Certificate.new(File.open(@client_cert) { |f| f.read })
      end
      if @client_key
        ctx.key = @client_key.is_a?(PKey::PKey) ? @client_key :
          PKey::RSA.new(File.open(@client_key) { |f| f.read }, @client_key_pass)
      end
      ctx.client_ca = @client_ca
      ctx.timeout = @timeout
      ctx.options = @options
      ctx.ciphers = @ciphers
      ctx.ssl_version = @ssl_version unless @ssl_version == :auto
    end

    # post connection check proc for ruby < 1.8.5.
    # this definition must match with the one in ext/openssl/lib/openssl/ssl.rb
    def post_connection_check(peer_cert, hostname) # :nodoc:
      check_common_name = true
      cert = peer_cert
      cert.extensions.each{|ext|
        next if ext.oid != "subjectAltName"
        ext.value.split(/,\s+/).each{|general_name|
          if /\ADNS:(.*)/ =~ general_name
            check_common_name = false
            reg = Regexp.escape($1).gsub(/\\\*/, "[^.]+")
            return true if /\A#{reg}\z/i =~ hostname
          elsif /\AIP Address:(.*)/ =~ general_name
            check_common_name = false
            return true if $1 == hostname
          end
        }
      }
      if check_common_name
        cert.subject.to_a.each{|oid, value|
          if oid == "CN"
            reg = Regexp.escape(value).gsub(/\\\*/, "[^.]+")
            return true if /\A#{reg}\z/i =~ hostname
          end
        }
      end
      raise SSL::SSLError, "hostname was not match with the server certificate"
    end

    # Default callback for verification: only dumps error.
    def default_verify_callback(is_ok, ctx)
      if $DEBUG
        if is_ok
          warn("ok: #{ctx.current_cert.subject.to_s.dump}")
        else
          warn("ng: #{ctx.current_cert.subject.to_s.dump} at depth #{ctx.error_depth} - #{ctx.error}: #{ctx.error_string} in #{ctx.chain.inspect}")
        end
        warn(ctx.current_cert.to_text)
        warn(ctx.current_cert.to_pem)
      end
      if !is_ok
        depth = ctx.error_depth
        code = ctx.error
        msg = ctx.error_string
        warn("at depth #{depth} - #{code}: #{msg}") if $DEBUG
      end
      is_ok
    end

    # Sample callback method:  CAUTION: does not check CRL/ARL.
    def sample_verify_callback(is_ok, ctx)
      unless is_ok
        depth = ctx.error_depth
        code = ctx.error
        msg = ctx.error_string
        warn("at depth #{depth} - #{code}: #{msg}") if $DEBUG
        return false
      end

      cert = ctx.current_cert
      self_signed = false
      ca = false
      pathlen = nil
      server_auth = true
      self_signed = (cert.subject.cmp(cert.issuer) == 0)

      # Check extensions whatever its criticality is. (sample)
      cert.extensions.each do |ex|
        case ex.oid
        when 'basicConstraints'
          /CA:(TRUE|FALSE), pathlen:(\d+)/ =~ ex.value
          ca = ($1 == 'TRUE')
          pathlen = $2.to_i
        when 'keyUsage'
          usage = ex.value.split(/\s*,\s*/)
          ca = usage.include?('Certificate Sign')
          server_auth = usage.include?('Key Encipherment')
        when 'extendedKeyUsage'
          usage = ex.value.split(/\s*,\s*/)
          server_auth = usage.include?('Netscape Server Gated Crypto')
        when 'nsCertType'
          usage = ex.value.split(/\s*,\s*/)
          ca = usage.include?('SSL CA')
          server_auth = usage.include?('SSL Server')
        end
      end

      if self_signed
        warn('self signing CA') if $DEBUG
        return true
      elsif ca
        warn('middle level CA') if $DEBUG
        return true
      elsif server_auth
        warn('for server authentication') if $DEBUG
        return true
      end

      return false
    end

  private

    def change_notify
      @client.reset_all
      nil
    end

    # Use 2048 bit certs trust anchor
    def load_cacerts(cert_store)
      file = File.join(File.dirname(__FILE__), 'cacert.pem')
      add_trust_ca_to_store(cert_store, file)
    end
  end


end
