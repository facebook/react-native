# HTTPClient - HTTP client library.
# Copyright (C) 2000-2015  NAKAMURA, Hiroshi  <nahi@ruby-lang.org>.
#
# This program is copyrighted free software by NAKAMURA, Hiroshi.  You can
# redistribute it and/or modify it under the same terms of Ruby's license;
# either the dual license version in 2003, or any later version.


unless ''.respond_to?(:bytesize)
  class String
    alias bytesize size
  end
end

if RUBY_VERSION < "1.9.3"
  require 'uri'
  module URI
    class Generic
      def hostname
        v = self.host
        /\A\[(.*)\]\z/ =~ v ? $1 : v
      end
    end
  end
end

# With recent JRuby 1.7 + jruby-openssl, X509CRL#extentions_to_text causes
# StringIndexOOBException when we try to dump SSL Server Certificate.
# when one of extensions has "" as value.
if defined?(JRUBY_VERSION)
  require 'openssl'
  require 'java'
  module OpenSSL
    module X509
      class Certificate
        java_import 'java.security.cert.Certificate'
        java_import 'java.security.cert.CertificateFactory'
        java_import 'java.io.ByteArrayInputStream'
        def to_text
          cf = CertificateFactory.getInstance('X.509')
          cf.generateCertificate(ByteArrayInputStream.new(self.to_der.to_java_bytes)).toString
        end
      end
    end
  end
end


class HTTPClient


  # A module for common function.
  module Util

    # URI abstraction; Addressable::URI or URI
    require 'uri'
    begin
      require 'addressable/uri'
      # Older versions doesn't have #default_port
      unless Addressable::URI.instance_methods.include?(:default_port) # 1.9 only
        raise LoadError
      end
      class AddressableURI < Addressable::URI
        # Overwrites the original definition just for one line...
        def authority
          self.host && @authority ||= (begin
            authority = ""
            if self.userinfo != nil
              authority << "#{self.userinfo}@"
            end
            authority << self.host
            if self.port != self.default_port # ...HERE! Compares with default_port because self.port is not nil in this wrapper.
              authority << ":#{self.port}"
            end
            authority
          end)
        end

        # HTTPClient expects urify("http://foo/").port to be not nil but 80 like URI.
        def port
          super || default_port
        end

        # Captured from uri/generic.rb
        def hostname
          v = self.host
          /\A\[(.*)\]\z/ =~ v ? $1 : v
        end
      end
      AddressableEnabled = true
    rescue LoadError
      AddressableEnabled = false
    end

    # Keyword argument helper.
    # args:: given arguments.
    # *field:: a list of arguments to be extracted.
    #
    # You can extract 3 arguments (a, b, c) with:
    #
    #   include Util
    #   def my_method(*args)
    #     a, b, c = keyword_argument(args, :a, :b, :c)
    #     ...
    #   end
    #   my_method(1, 2, 3)
    #   my_method(:b => 2, :a = 1)
    #
    # instead of;
    #
    #   def my_method(a, b, c)
    #     ...
    #   end
    #
    def keyword_argument(args, *field)
      if args.size == 1 and Hash === args[0]
        h = args[0]
        if field.any? { |f| h.key?(f) }
          return h.values_at(*field)
        end
      end
      args
    end

    # Keyword argument to hash helper.
    # args:: given arguments.
    # *field:: a list of arguments to be extracted.
    #
    # Returns hash which has defined keys. When a Hash given, returns it
    # including undefined keys. When an Array given, returns a Hash which only
    # includes defined keys.
    def argument_to_hash(args, *field)
      return nil if args.empty?
      if args.size == 1 and Hash === args[0]
        h = args[0]
        if field.any? { |f| h.key?(f) }
          return h
        end
      end
      h = {}
      field.each_with_index do |e, idx|
        h[e] = args[idx]
      end
      h
    end

    # Gets an URI instance.
    def urify(uri)
      if uri.nil?
        nil
      elsif uri.is_a?(URI)
        uri
      elsif AddressableEnabled
        AddressableURI.parse(uri.to_s)
      else
        URI.parse(uri.to_s)
      end
    end
    module_function :urify

    # Returns true if the given 2 URIs have a part_of relationship.
    # * the same scheme
    # * the same host String (no host resolution or IP-addr conversion)
    # * the same port number
    # * target URI's path starts with base URI's path.
    def uri_part_of(uri, part)
      ((uri.scheme == part.scheme) and
       (uri.host == part.host) and
       (uri.port == part.port) and
       uri.path.upcase.index(part.path.upcase) == 0)
    end
    module_function :uri_part_of

    # Returns parent directory URI of the given URI.
    def uri_dirname(uri)
      uri = uri.clone
      uri.path = uri.path.sub(/\/[^\/]*\z/, '/')
      uri
    end
    module_function :uri_dirname

    # Finds a value of a Hash.
    def hash_find_value(hash, &block)
      v = hash.find(&block)
      v ? v[1] : nil
    end
    module_function :hash_find_value

    # Try to require a feature and returns true/false if loaded
    #
    # It returns 'true' for the second require in contrast of the standard
    # require returns false if the feature is already loaded.
    def try_require(feature)
      require feature
      true
    rescue LoadError
      false
    end
    module_function :try_require

    # show one warning message only once by caching message
    #
    # it cached all messages in memory so be careful not to show many kinds of warning message.
    @@__warned = {}
    def warning(message)
      return if @@__warned.key?(message)
      warn(message)
      @@__warned[message] = true
    end

    # Checks if the given URI is https.
    def https?(uri)
      uri.scheme && uri.scheme.downcase == 'https'
    end

    def http?(uri)
      uri.scheme && uri.scheme.downcase == 'http'
    end
  end


end
