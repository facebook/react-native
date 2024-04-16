# HTTPClient - HTTP client library.
# Copyright (C) 2000-2015  NAKAMURA, Hiroshi  <nahi@ruby-lang.org>.
#
# This program is copyrighted free software by NAKAMURA, Hiroshi.  You can
# redistribute it and/or modify it under the same terms of Ruby's license;
# either the dual license version in 2003, or any later version.


require 'java'
require 'httpclient/ssl_config'


class HTTPClient

unless defined?(SSLSocket)

  class JavaSocketWrap
    java_import 'java.net.InetSocketAddress'
    java_import 'java.io.BufferedInputStream'

    BUF_SIZE = 1024 * 16

    def self.connect(socket, site, opts = {})
      socket_addr = InetSocketAddress.new(site.host, site.port)
      if opts[:connect_timeout]
        socket.connect(socket_addr, opts[:connect_timeout])
      else
        socket.connect(socket_addr)
      end
      socket.setSoTimeout(opts[:so_timeout]) if opts[:so_timeout]
      socket.setKeepAlive(true) if opts[:tcp_keepalive]
      socket
    end

    def initialize(socket, debug_dev = nil)
      @socket = socket
      @debug_dev = debug_dev
      @outstr = @socket.getOutputStream
      @instr = BufferedInputStream.new(@socket.getInputStream)
      @buf = (' ' * BUF_SIZE).to_java_bytes
      @bufstr = ''
    end

    def close
      @socket.close
    end

    def closed?
      @socket.isClosed
    end

    def eof?
      @socket.isClosed
    end

    def gets(rs)
      while (size = @bufstr.index(rs)).nil?
        if fill() == -1
          size = @bufstr.size
          break
        end
      end
      str = @bufstr.slice!(0, size + rs.size)
      debug(str)
      str
    end

    def read(size, buf = nil)
      while @bufstr.size < size
        if fill() == -1
          break
        end
      end
      str = @bufstr.slice!(0, size)
      debug(str)
      if buf
        buf.replace(str)
      else
        str
      end
    end

    def readpartial(size, buf = nil)
      while @bufstr.size == 0
        if fill() == -1
          raise EOFError.new('end of file reached')
        end
      end
      str = @bufstr.slice!(0, size)
      debug(str)
      if buf
        buf.replace(str)
      else
        str
      end
    end

    def <<(str)
      rv = @outstr.write(str.to_java_bytes)
      debug(str)
      rv
    end

    def flush
      @socket.flush
    end

    def sync
      true
    end

    def sync=(sync)
      unless sync
        raise "sync = false is not supported. This option was introduced for backward compatibility just in case."
      end
    end

  private

    def fill
      begin
        size = @instr.read(@buf)
        if size > 0
          @bufstr << String.from_java_bytes(@buf, Encoding::BINARY)[0, size]
        end
        size
      rescue java.io.IOException => e
        raise OpenSSL::SSL::SSLError.new("#{e.class}: #{e.getMessage}")
      end
    end

    def debug(str)
      @debug_dev << str if @debug_dev && str
    end
  end

  class JRubySSLSocket < JavaSocketWrap
    java_import 'java.io.ByteArrayInputStream'
    java_import 'java.io.InputStreamReader'
    java_import 'java.net.Socket'
    java_import 'java.security.KeyStore'
    java_import 'java.security.cert.Certificate'
    java_import 'java.security.cert.CertificateFactory'
    java_import 'javax.net.ssl.KeyManagerFactory'
    java_import 'javax.net.ssl.SSLContext'
    java_import 'javax.net.ssl.SSLSocketFactory'
    java_import 'javax.net.ssl.TrustManager'
    java_import 'javax.net.ssl.TrustManagerFactory'
    java_import 'javax.net.ssl.X509TrustManager'
    java_import 'org.jruby.ext.openssl.x509store.PEMInputOutput'

    class JavaCertificate
      attr_reader :cert

      def initialize(cert)
        @cert = cert
      end

      def subject
        @cert.getSubjectDN
      end

      def to_text
        @cert.toString
      end

      def to_pem
        '(not in PEM format)'
      end
    end

    class SSLStoreContext
      attr_reader :current_cert, :chain, :error_depth, :error, :error_string

      def initialize(current_cert, chain, error_depth, error, error_string)
        @current_cert, @chain, @error_depth, @error, @error_string =
          current_cert, chain, error_depth, error, error_string
      end
    end

    class JSSEVerifyCallback
      def initialize(verify_callback)
        @verify_callback = verify_callback
      end

      def call(is_ok, chain, error_depth = -1, error = -1, error_string = '(unknown)')
        if @verify_callback
          ruby_chain = chain.map { |cert|
            JavaCertificate.new(cert)
          }.reverse
          # NOTE: The order depends on provider implementation
          ruby_chain.each do |cert|
            is_ok = @verify_callback.call(
              is_ok,
              SSLStoreContext.new(cert, ruby_chain, error_depth, error, error_string)
            )
          end
        end
        is_ok
      end
    end

    class VerifyNoneTrustManagerFactory
      class VerifyNoneTrustManager
        include X509TrustManager

        def initialize(verify_callback)
          @verify_callback = JSSEVerifyCallback.new(verify_callback)
        end

        def checkServerTrusted(chain, authType)
          @verify_callback.call(true, chain)
        end

        def checkClientTrusted(chain, authType); end
        def getAcceptedIssuers; end
      end

      def initialize(verify_callback = nil)
        @verify_callback = verify_callback
      end

      def init(trustStore)
        @managers = [VerifyNoneTrustManager.new(@verify_callback)].to_java(X509TrustManager)
      end

      def getTrustManagers
        @managers
      end
    end

    class SystemTrustManagerFactory
      class SystemTrustManager
        include X509TrustManager

        def initialize(original, verify_callback)
          @original = original
          @verify_callback = JSSEVerifyCallback.new(verify_callback)
        end

        def checkServerTrusted(chain, authType)
          is_ok = false
          excn = nil
          # TODO can we detect the depth from excn?
          error_depth = -1
          error = nil
          error_message = nil
          begin
            @original.checkServerTrusted(chain, authType)
            is_ok = true
          rescue java.security.cert.CertificateException => excn
            is_ok = false
            error = excn.class.name
            error_message = excn.getMessage
          end
          is_ok = @verify_callback.call(is_ok, chain, error_depth, error, error_message)
          unless is_ok
            excn ||= OpenSSL::SSL::SSLError.new('verifycallback failed')
            raise excn
          end
        end

        def checkClientTrusted(chain, authType); end
        def getAcceptedIssuers; end
      end

      def initialize(verify_callback = nil)
        @verify_callback = verify_callback
      end

      def init(trust_store)
        tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm)
        tmf.java_method(:init, [KeyStore]).call(trust_store)
        @original = tmf.getTrustManagers.find { |tm|
          tm.is_a?(X509TrustManager)
        }
        @managers = [SystemTrustManager.new(@original, @verify_callback)].to_java(X509TrustManager)
      end

      def getTrustManagers
        @managers
      end
    end

    module PEMUtils
      def self.read_certificate(pem)
        cert = pem.sub(/.*?-----BEGIN CERTIFICATE-----/m, '').sub(/-----END CERTIFICATE-----.*?/m, '')
        der = cert.unpack('m*').first
        cf = CertificateFactory.getInstance('X.509')
        cf.generateCertificate(ByteArrayInputStream.new(der.to_java_bytes))
      end

      def self.read_private_key(pem, password)
        if password
          password = password.unpack('C*').to_java(:char)
        end
        PEMInputOutput.read_private_key(InputStreamReader.new(ByteArrayInputStream.new(pem.to_java_bytes)), password)
      end
    end

    class KeyStoreLoader
      PASSWORD = 16.times.map { rand(256) }.to_java(:char)

      def initialize
        @keystore = KeyStore.getInstance('JKS')
        @keystore.load(nil)
      end

      def add(cert_source, key_source, password)
        cert_str = cert_source.respond_to?(:to_pem) ? cert_source.to_pem : File.read(cert_source.to_s)
        cert = PEMUtils.read_certificate(cert_str)
        @keystore.setCertificateEntry('client_cert', cert)
        key_str = key_source.respond_to?(:to_pem) ? key_source.to_pem : File.read(key_source.to_s)
        key_pair = PEMUtils.read_private_key(key_str, password)
        @keystore.setKeyEntry('client_key', key_pair.getPrivate, PASSWORD, [cert].to_java(Certificate))
      end

      def keystore
        @keystore
      end
    end

    class TrustStoreLoader
      attr_reader :size

      def initialize
        @trust_store = KeyStore.getInstance('JKS')
        @trust_store.load(nil)
        @size = 0
      end

      def add(cert_source)
        return if cert_source == :default
        if cert_source.respond_to?(:to_pem)
          pem = cert_source.to_pem
          load_pem(pem)
        elsif File.directory?(cert_source)
          warn("#{cert_source}: directory not yet supported")
          return
        else
          pem = nil
          File.read(cert_source).each_line do |line|
            case line
            when /-----BEGIN CERTIFICATE-----/
              pem = ''
            when /-----END CERTIFICATE-----/
              load_pem(pem)
              # keep parsing in case where multiple certificates in a file
            else
              if pem
                pem << line
              end
            end
          end
        end
      end

      def trust_store
        if @size == 0
          nil
        else
          @trust_store
        end
      end

    private

      def load_pem(pem)
        cert = PEMUtils.read_certificate(pem)
        @size += 1
        @trust_store.setCertificateEntry("cert_#{@size}", cert)
      end
    end

    # Ported from commons-httpclient 'BrowserCompatHostnameVerifier'
    class BrowserCompatHostnameVerifier
      BAD_COUNTRY_2LDS = %w(ac co com ed edu go gouv gov info lg ne net or org).sort
      require 'ipaddr'

      def extract_sans(cert, subject_type)
        sans = cert.getSubjectAlternativeNames rescue nil
        if sans.nil?
          return nil
        end
        sans.find_all { |san|
          san.first.to_i == subject_type
        }.map { |san|
          san[1]
        }
      end

      def extract_cn(cert)
        subject = cert.getSubjectX500Principal()
        if subject
          subject_dn = javax.naming.ldap.LdapName.new(subject.toString)
          subject_dn.getRdns.to_a.reverse.each do |rdn|
            attributes = rdn.toAttributes
            cn = attributes.get('cn')
            if cn
              if value = cn.get
                return value.to_s
              end
            end
          end
        end
      end

      def ipaddr?(addr)
        !(IPAddr.new(addr) rescue nil).nil?
      end

      def verify(hostname, cert)
        is_ipaddr = ipaddr?(hostname)
        sans = extract_sans(cert, is_ipaddr ? 7 : 2)
        cn = extract_cn(cert)
        if sans
          sans.each do |san|
            return true if match_identify(hostname, san)
          end
          raise OpenSSL::SSL::SSLError.new("Certificate for <#{hostname}> doesn't match any of the subject alternative names: #{sans}")
        elsif cn
          return true if match_identify(hostname, cn)
          raise OpenSSL::SSL::SSLError.new("Certificate for <#{hostname}> doesn't match common name of the certificate subject: #{cn}")
        end
        raise OpenSSL::SSL::SSLError.new("Certificate subject for for <#{hostname}> doesn't contain a common name and does not have alternative names")
      end

      def match_identify(hostname, identity)
        if hostname.nil?
          return false
        end
        hostname = hostname.downcase
        identity = identity.downcase
        parts = identity.split('.')
        if parts.length >= 3 && parts.first.end_with?('*') && valid_country_wildcard(parts)
          create_wildcard_regexp(identity) =~ hostname
        else
          hostname == identity
        end
      end

      def create_wildcard_regexp(value)
        # Escape first then search '\*' for meta-char interpolation
        labels = value.split('.').map { |e| Regexp.escape(e) }
        # Handle '*'s only at the left-most label, exclude A-label and U-label
        labels[0].gsub!(/\\\*/, '[^.]+') if !labels[0].start_with?('xn\-\-') and labels[0].ascii_only?
        /\A#{labels.join('\.')}\z/i
      end

      def valid_country_wildcard(parts)
        if parts.length != 3 || parts[2].length != 2
          true
        else
          !BAD_COUNTRY_2LDS.include?(parts[1])
        end
      end
    end

    def self.create_socket(session)
      opts = {
        :connect_timeout => session.connect_timeout * 1000,
        # send_timeout is ignored in JRuby
        :so_timeout => session.receive_timeout * 1000,
        :tcp_keepalive => session.tcp_keepalive,
        :debug_dev => session.debug_dev
      }
      socket = nil
      begin
        if session.proxy
          site = session.proxy || session.dest
          socket = JavaSocketWrap.connect(Socket.new, site, opts)
          session.connect_ssl_proxy(JavaSocketWrap.new(socket), Util.urify(session.dest.to_s))
        end
        new(socket, session.dest, session.ssl_config, opts)
      rescue
        socket.close if socket
        raise
      end
    end

    DEFAULT_SSL_PROTOCOL = (java.lang.System.getProperty('java.specification.version') == '1.7') ? 'TLSv1.2' : 'TLS'
    def initialize(socket, dest, config, opts = {})
      @config = config
      begin
        @ssl_socket = create_ssl_socket(socket, dest, config, opts)
        ssl_version = java_ssl_version(config)
        @ssl_socket.setEnabledProtocols([ssl_version].to_java(java.lang.String)) if ssl_version != DEFAULT_SSL_PROTOCOL
        if config.ciphers != SSLConfig::CIPHERS_DEFAULT
          @ssl_socket.setEnabledCipherSuites(config.ciphers.to_java(java.lang.String))
        end
        ssl_connect(dest.host)
      rescue java.security.GeneralSecurityException => e
        raise OpenSSL::SSL::SSLError.new(e.getMessage)
      rescue java.io.IOException => e
        raise OpenSSL::SSL::SSLError.new("#{e.class}: #{e.getMessage}")
      end

      super(@ssl_socket, opts[:debug_dev])
    end

    def java_ssl_version(config)
      if config.ssl_version == :auto
        DEFAULT_SSL_PROTOCOL
      else
        config.ssl_version.to_s.tr('_', '.')
      end
    end

    def create_ssl_context(config)
      unless config.cert_store_crl_items.empty?
        raise NotImplementedError.new('Manual CRL configuration is not yet supported')
      end

      km = nil
      if config.client_cert && config.client_key
        loader = KeyStoreLoader.new
        loader.add(config.client_cert, config.client_key, config.client_key_pass)
        kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm)
        kmf.init(loader.keystore, KeyStoreLoader::PASSWORD)
        km = kmf.getKeyManagers
      end

      trust_store = nil
      verify_callback = config.verify_callback || config.method(:default_verify_callback)
      if !config.verify?
        tmf = VerifyNoneTrustManagerFactory.new(verify_callback)
      else
        tmf = SystemTrustManagerFactory.new(verify_callback)
        loader = TrustStoreLoader.new
        config.cert_store_items.each do |item|
          loader.add(item)
        end
        trust_store = loader.trust_store
      end
      tmf.init(trust_store)
      tm = tmf.getTrustManagers

      ctx = SSLContext.getInstance(java_ssl_version(config))
      ctx.init(km, tm, nil)
      if config.timeout
        ctx.getClientSessionContext.setSessionTimeout(config.timeout)
      end
      ctx
    end

    def create_ssl_socket(socket, dest, config, opts)
      ctx = create_ssl_context(config)
      factory = ctx.getSocketFactory
      if socket
        ssl_socket = factory.createSocket(socket, dest.host, dest.port, true)
      else
        ssl_socket = factory.createSocket
        JavaSocketWrap.connect(ssl_socket, dest, opts)
      end
      ssl_socket
    end

    def peer_cert
      @peer_cert
    end

  private

    def ssl_connect(hostname)
      @ssl_socket.startHandshake
      ssl_session = @ssl_socket.getSession
      @peer_cert = JavaCertificate.new(ssl_session.getPeerCertificates.first)
      if $DEBUG
        warn("Protocol version: #{ssl_session.getProtocol}")
        warn("Cipher: #{@ssl_socket.getSession.getCipherSuite}")
      end
      post_connection_check(hostname)
    end

    def post_connection_check(hostname)
      if !@config.verify?
        return
      else
        BrowserCompatHostnameVerifier.new.verify(hostname, @peer_cert.cert)
      end
    end
  end

  SSLSocket = JRubySSLSocket

end

end
