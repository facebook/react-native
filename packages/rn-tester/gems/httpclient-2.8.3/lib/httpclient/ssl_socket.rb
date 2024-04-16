# HTTPClient - HTTP client library.
# Copyright (C) 2000-2015  NAKAMURA, Hiroshi  <nahi@ruby-lang.org>.
#
# This program is copyrighted free software by NAKAMURA, Hiroshi.  You can
# redistribute it and/or modify it under the same terms of Ruby's license;
# either the dual license version in 2003, or any later version.


require 'httpclient/ssl_config'


class HTTPClient

  # Wraps up OpenSSL::SSL::SSLSocket and offers debugging features.
  class SSLSocket
    def self.create_socket(session)
      opts = {
        :debug_dev => session.debug_dev
      }
      site = session.proxy || session.dest
      socket = session.create_socket(site.host, site.port)
      begin
        if session.proxy
          session.connect_ssl_proxy(socket, Util.urify(session.dest.to_s))
        end
        new(socket, session.dest, session.ssl_config, opts)
      rescue
        socket.close
        raise
      end
    end

    def initialize(socket, dest, config, opts = {})
      unless SSLEnabled
        raise ConfigurationError.new('Ruby/OpenSSL module is required')
      end
      @socket = socket
      @config = config
      @ssl_socket = create_openssl_socket(@socket)
      @debug_dev = opts[:debug_dev]
      ssl_connect(dest.host)
    end

    def peer_cert
      @ssl_socket.peer_cert
    end

    def close
      @ssl_socket.close
      @socket.close
    end

    def closed?
      @socket.closed?
    end

    def eof?
      @ssl_socket.eof?
    end

    def gets(rs)
      str = @ssl_socket.gets(rs)
      debug(str)
      str
    end

    def read(size, buf = nil)
      str = @ssl_socket.read(size, buf)
      debug(str)
      str
    end

    def readpartial(size, buf = nil)
      str = @ssl_socket.readpartial(size, buf)
      debug(str)
      str
    end

    def <<(str)
      rv = @ssl_socket.write(str)
      debug(str)
      rv
    end

    def flush
      @ssl_socket.flush
    end

    def sync
      @ssl_socket.sync
    end

    def sync=(sync)
      @ssl_socket.sync = sync
    end

  private

    def ssl_connect(hostname = nil)
      if hostname && @ssl_socket.respond_to?(:hostname=)
        @ssl_socket.hostname = hostname
      end
      @ssl_socket.connect
      if $DEBUG
        if @ssl_socket.respond_to?(:ssl_version)
          warn("Protocol version: #{@ssl_socket.ssl_version}")
        end
        warn("Cipher: #{@ssl_socket.cipher.inspect}")
      end
      post_connection_check(hostname)
    end

    def post_connection_check(hostname)
      verify_mode = @config.verify_mode || OpenSSL::SSL::VERIFY_NONE
      if verify_mode == OpenSSL::SSL::VERIFY_NONE
        return
      elsif @ssl_socket.peer_cert.nil? and
        check_mask(verify_mode, OpenSSL::SSL::VERIFY_FAIL_IF_NO_PEER_CERT)
        raise OpenSSL::SSL::SSLError.new('no peer cert')
      end
      if @ssl_socket.respond_to?(:post_connection_check) and RUBY_VERSION > "1.8.4"
        @ssl_socket.post_connection_check(hostname)
      else
        @config.post_connection_check(@ssl_socket.peer_cert, hostname)
      end
    end

    def check_mask(value, mask)
      value & mask == mask
    end

    def create_openssl_socket(socket)
      ssl_socket = nil
      if OpenSSL::SSL.const_defined?("SSLContext")
        ctx = OpenSSL::SSL::SSLContext.new
        @config.set_context(ctx)
        ssl_socket = OpenSSL::SSL::SSLSocket.new(socket, ctx)
      else
        ssl_socket = OpenSSL::SSL::SSLSocket.new(socket)
        @config.set_context(ssl_socket)
      end
      ssl_socket
    end

    def debug(str)
      @debug_dev << str if @debug_dev && str
    end
  end

end
