# -*- encoding: utf-8 -*-

# HTTPClient - HTTP client library.
# Copyright (C) 2000-2015  NAKAMURA, Hiroshi  <nahi@ruby-lang.org>.
#
# This program is copyrighted free software by NAKAMURA, Hiroshi.  You can
# redistribute it and/or modify it under the same terms of Ruby's license;
# either the dual license version in 2003, or any later version.


require 'time'
if defined?(Encoding::ASCII_8BIT)
  require 'open-uri' # for encoding
end
require 'httpclient/util'


# A namespace module for HTTP Message definitions used by HTTPClient.
module HTTP


  # Represents HTTP response status code.  Defines constants for HTTP response
  # and some conditional methods.
  module Status
    OK = 200
    CREATED = 201
    ACCEPTED = 202
    NON_AUTHORITATIVE_INFORMATION = 203
    NO_CONTENT = 204
    RESET_CONTENT = 205
    PARTIAL_CONTENT = 206
    MOVED_PERMANENTLY = 301
    FOUND = 302
    SEE_OTHER = 303
    TEMPORARY_REDIRECT = MOVED_TEMPORARILY = 307
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    PROXY_AUTHENTICATE_REQUIRED = 407
    INTERNAL = 500

    # Status codes for successful HTTP response.
    SUCCESSFUL_STATUS = [
      OK, CREATED, ACCEPTED,
      NON_AUTHORITATIVE_INFORMATION, NO_CONTENT,
      RESET_CONTENT, PARTIAL_CONTENT
    ]

    # Status codes which is a redirect.
    REDIRECT_STATUS = [
      MOVED_PERMANENTLY, FOUND, SEE_OTHER,
      TEMPORARY_REDIRECT, MOVED_TEMPORARILY
    ]

    # Returns true if the given status represents successful HTTP response.
    # See also SUCCESSFUL_STATUS.
    def self.successful?(status)
      SUCCESSFUL_STATUS.include?(status)
    end

    # Returns true if the given status is thought to be redirect.
    # See also REDIRECT_STATUS.
    def self.redirect?(status)
      REDIRECT_STATUS.include?(status)
    end
  end


  # Represents a HTTP message.  A message is for a request or a response.
  #
  # Request message is generated from given parameters internally so users
  # don't need to care about it.  Response message is the instance that
  # methods of HTTPClient returns so users need to know how to extract
  # HTTP response data from Message.
  #
  # Some attributes are only for a request or a response, not both.
  #
  # == How to use HTTP response message
  #
  # 1. Gets response message body.
  #
  #     res = clnt.get(url)
  #     p res.content #=> String
  #
  # 2. Gets response status code.
  #
  #     res = clnt.get(url)
  #     p res.status #=> 200, 501, etc. (Integer)
  #
  # 3. Gets response header.
  #
  #     res = clnt.get(url)
  #     res.header['set-cookie'].each do |value|
  #       p value
  #     end
  #     assert_equal(1, res.header['last-modified'].size)
  #     p res.header['last-modified'].first
  #
  class Message
    include HTTPClient::Util

    CRLF = "\r\n"

    # Represents HTTP message header.
    class Headers
      # HTTP version in a HTTP header.  String.
      attr_accessor :http_version
      # Size of body.  nil when size is unknown (e.g. chunked response).
      attr_reader :body_size
      # Request/Response is chunked or not.
      attr_accessor :chunked

      # Request only.  Requested method.
      attr_reader :request_method
      # Request only.  Requested URI.
      attr_accessor :request_uri
      # Request only.  Requested query.
      attr_accessor :request_query
      # Request only.  Requested via proxy or not.
      attr_accessor :request_absolute_uri

      # Response only.  HTTP status
      attr_reader :status_code
      # Response only.  HTTP status reason phrase.
      attr_accessor :reason_phrase

      # Used for dumping response.
      attr_accessor :body_type # :nodoc:
      # Used for dumping response.
      attr_accessor :body_charset # :nodoc:
      # Used for dumping response.
      attr_accessor :body_date # :nodoc:
      # Used for keeping content encoding.
      attr_reader :body_encoding # :nodoc:

      # HTTP response status code to reason phrase mapping definition.
      STATUS_CODE_MAP = {
        Status::OK => 'OK',
        Status::CREATED => "Created",
        Status::NON_AUTHORITATIVE_INFORMATION => "Non-Authoritative Information",
        Status::NO_CONTENT => "No Content",
        Status::RESET_CONTENT => "Reset Content",
        Status::PARTIAL_CONTENT => "Partial Content",
        Status::MOVED_PERMANENTLY => 'Moved Permanently',
        Status::FOUND => 'Found',
        Status::SEE_OTHER => 'See Other',
        Status::TEMPORARY_REDIRECT => 'Temporary Redirect',
        Status::MOVED_TEMPORARILY => 'Temporary Redirect',
        Status::BAD_REQUEST => 'Bad Request',
        Status::INTERNAL => 'Internal Server Error',
      }

      # $KCODE to charset mapping definition.
      CHARSET_MAP = {
        'NONE' => 'us-ascii',
        'EUC'  => 'euc-jp',
        'SJIS' => 'shift_jis',
        'UTF8' => 'utf-8',
      }

      # Creates a Message::Headers.  Use init_request, init_response, or
      # init_connect_request for acutual initialize.
      def initialize
        @http_version = '1.1'
        @body_size = nil
        @chunked = false

        @request_method = nil
        @request_uri = nil
        @request_query = nil
        @request_absolute_uri = nil

        @status_code = nil
        @reason_phrase = nil

        @body_type = nil
        @body_charset = nil
        @body_date = nil
        @body_encoding = nil

        @is_request = nil
        @header_item = []
        @dumped = false
      end

      # Initialize this instance as a CONNECT request.
      def init_connect_request(uri)
        @is_request = true
        @request_method = 'CONNECT'
        @request_uri = uri
        @request_query = nil
        @http_version = '1.0'
      end

      # Placeholder URI object for nil uri.
      NIL_URI = HTTPClient::Util.urify('http://nil-uri-given/')
      # Initialize this instance as a general request.
      def init_request(method, uri, query = nil)
        @is_request = true
        @request_method = method
        @request_uri = uri || NIL_URI
        @request_query = query
        @request_absolute_uri = false
        self
      end

      # Initialize this instance as a response.
      def init_response(status_code, req = nil)
        @is_request = false
        self.status_code = status_code
        if req
          @request_method = req.request_method
          @request_uri = req.request_uri
          @request_query = req.request_query
        end
        self
      end

      # Sets status code and reason phrase.
      def status_code=(status_code)
        @status_code = status_code
        @reason_phrase = STATUS_CODE_MAP[@status_code]
      end

      # Returns 'Content-Type' header value.
      def content_type
        self['Content-Type'][0]
      end

      # Sets 'Content-Type' header value.  Overrides if already exists.
      def content_type=(content_type)
        delete('Content-Type')
        self['Content-Type'] = content_type
      end

      alias contenttype content_type
      alias contenttype= content_type=

      if defined?(Encoding::ASCII_8BIT)
        def set_body_encoding
          if type = self.content_type
            OpenURI::Meta.init(o = '')
            o.meta_add_field('content-type', type)
            @body_encoding = o.encoding
          end
        end
      else
        def set_body_encoding
          @body_encoding = nil
        end
      end

      # Sets byte size of message body.
      # body_size == nil means that the body is_a? IO
      def body_size=(body_size)
        @body_size = body_size
      end

      # Dumps message header part and returns a dumped String.
      def dump
        set_header
        str = nil
        if @is_request
          str = request_line
        else
          str = response_status_line
        end
        str + @header_item.collect { |key, value|
          "#{ key }: #{ value }#{ CRLF }"
        }.join
      end

      # Set Date header
      def set_date_header
        set('Date', Time.now.httpdate)
      end

      # Adds a header.  Addition order is preserved.
      def add(key, value)
        if value.is_a?(Array)
          value.each do |v|
            @header_item.push([key, v])
          end
        else
          @header_item.push([key, value])
        end
      end

      # Sets a header.
      def set(key, value)
        delete(key)
        add(key, value)
      end

      # Returns an Array of headers for the given key.  Each element is a pair
      # of key and value.  It returns an single element Array even if the only
      # one header exists.  If nil key given, it returns all headers.
      def get(key = nil)
        if key.nil?
          all
        else
          key = key.upcase
          @header_item.find_all { |k, v| k.upcase == key }
        end
      end

      # Returns an Array of all headers.
      def all
        @header_item
      end

      # Deletes headers of the given key.
      def delete(key)
        key = key.upcase
        @header_item.delete_if { |k, v| k.upcase == key }
      end

      # Adds a header.  See set.
      def []=(key, value)
        set(key, value)
      end

      # Returns an Array of header values for the given key.
      def [](key)
        get(key).collect { |item| item[1] }
      end

      def set_headers(headers)
        headers.each do |key, value|
          add(key, value)
        end
        set_body_encoding
      end

      def create_query_uri()
        if @request_method == 'CONNECT'
          return "#{@request_uri.host}:#{@request_uri.port}"
        end
        path = @request_uri.path
        path = '/' if path.nil? or path.empty?
        if query_str = create_query_part()
          path += "?#{query_str}"
        end
        path
      end

      def create_query_part()
        query_str = nil
        if @request_uri.query
          query_str = @request_uri.query
        end
        if @request_query
          if query_str
            query_str += "&#{Message.create_query_part_str(@request_query)}"
          else
            query_str = Message.create_query_part_str(@request_query)
          end
        end
        query_str
      end

    private

      def request_line
        path = create_query_uri()
        if @request_absolute_uri
          path = "#{ @request_uri.scheme }://#{ @request_uri.host }:#{ @request_uri.port }#{ path }"
        end
        "#{ @request_method } #{ path } HTTP/#{ @http_version }#{ CRLF }"
      end

      def response_status_line
        if defined?(Apache)
          "HTTP/#{ @http_version } #{ @status_code } #{ @reason_phrase }#{ CRLF }"
        else
          "Status: #{ @status_code } #{ @reason_phrase }#{ CRLF }"
        end
      end

      def set_header
        if @is_request
          set_request_header
        else
          set_response_header
        end
      end

      def set_request_header
        return if @dumped
        @dumped = true
        keep_alive = Message.keep_alive_enabled?(@http_version)
        if !keep_alive and @request_method != 'CONNECT'
          set('Connection', 'close')
        end
        if @chunked
          set('Transfer-Encoding', 'chunked')
        elsif @body_size and (keep_alive or @body_size != 0)
          set('Content-Length', @body_size.to_s)
        end
        if @http_version >= '1.1' and get('Host').empty?
          if @request_uri.port == @request_uri.default_port
            # GFE/1.3 dislikes default port number (returns 404)
            set('Host', "#{@request_uri.hostname}")
          else
            set('Host', "#{@request_uri.hostname}:#{@request_uri.port}")
          end
        end
      end

      def set_response_header
        return if @dumped
        @dumped = true
        if defined?(Apache) && self['Date'].empty?
          set_date_header
        end
        keep_alive = Message.keep_alive_enabled?(@http_version)
        if @chunked
          set('Transfer-Encoding', 'chunked')
        else
          if keep_alive or @body_size != 0
            set('Content-Length', @body_size.to_s)
          end
        end
        if @body_date
          set('Last-Modified', @body_date.httpdate)
        end
        if self['Content-Type'].empty?
          set('Content-Type', "#{ @body_type || 'text/html' }; charset=#{ charset_label }")
        end
      end

      def charset_label
        # TODO: should handle response encoding for 1.9 correctly.
        if RUBY_VERSION > "1.9"
          CHARSET_MAP[@body_charset] || 'us-ascii'
        else
          CHARSET_MAP[@body_charset || $KCODE] || 'us-ascii'
        end
      end
    end


    # Represents HTTP message body.
    class Body
      # Size of body.  nil when size is unknown (e.g. chunked response).
      attr_reader :size
      # maxbytes of IO#read for streaming request.  See DEFAULT_CHUNK_SIZE.
      attr_accessor :chunk_size
      # Hash that keeps IO positions
      attr_accessor :positions

      # Default value for chunk_size
      DEFAULT_CHUNK_SIZE = 1024 * 16

      # Creates a Message::Body.  Use init_request or init_response
      # for acutual initialize.
      def initialize
        @body = nil
        @size = nil
        @positions = nil
        @chunk_size = nil
      end

      # Initialize this instance as a request.
      def init_request(body = nil, boundary = nil)
        @boundary = boundary
        @positions = {}
        set_content(body, boundary)
        @chunk_size = DEFAULT_CHUNK_SIZE
        self
      end

      # Initialize this instance as a response.
      def init_response(body = nil)
        @body = body
        if @body.respond_to?(:bytesize)
          @size = @body.bytesize
        elsif @body.respond_to?(:size)
          @size = @body.size
        else
          @size = nil
        end
        self
      end

      # Dumps message body to given dev.
      # dev needs to respond to <<.
      #
      # Message header must be given as the first argument for performance
      # reason. (header is dumped to dev, too)
      # If no dev (the second argument) given, this method returns a dumped
      # String.
      #
      # assert: @size is not nil
      def dump(header = '', dev = '')
        if @body.is_a?(Parts)
          dev << header
          @body.parts.each do |part|
            if Message.file?(part)
              reset_pos(part)
              dump_file(part, dev, @body.sizes[part])
            else
              dev << part
            end
          end
        elsif Message.file?(@body)
          dev << header
          reset_pos(@body)
          dump_file(@body, dev, @size)
        elsif @body
          dev << header + @body
        else
          dev << header
        end
        dev
      end

      # Dumps message body with chunked encoding to given dev.
      # dev needs to respond to <<.
      #
      # Message header must be given as the first argument for performance
      # reason. (header is dumped to dev, too)
      # If no dev (the second argument) given, this method returns a dumped
      # String.
      def dump_chunked(header = '', dev = '')
        dev << header
        if @body.is_a?(Parts)
          @body.parts.each do |part|
            if Message.file?(part)
              reset_pos(part)
              dump_chunks(part, dev)
            else
              dev << dump_chunk(part)
            end
          end
          dev << (dump_last_chunk + CRLF)
        elsif @body
          reset_pos(@body)
          dump_chunks(@body, dev)
          dev << (dump_last_chunk + CRLF)
        end
        dev
      end

      # Returns a message body itself.
      def content
        @body
      end

    private

      def set_content(body, boundary = nil)
        if Message.file?(body)
          # uses Transfer-Encoding: chunked if body does not respond to :size.
          # bear in mind that server may not support it. at least ruby's CGI doesn't.
          @body = body
          remember_pos(@body)
          @size = body.respond_to?(:size) ? body.size - body.pos : nil
        elsif boundary and Message.multiparam_query?(body)
          @body = build_query_multipart_str(body, boundary)
          @size = @body.size
        else
          @body = Message.create_query_part_str(body)
          @size = @body.bytesize
        end
      end

      def remember_pos(io)
        # IO may not support it (ex. IO.pipe)
        @positions[io] = io.pos if io.respond_to?(:pos)
      end

      def reset_pos(io)
        io.pos = @positions[io] if @positions.key?(io)
      end

      def dump_file(io, dev, sz)
        buf = ''
        rest = sz
        while rest > 0
          n = io.read([rest, @chunk_size].min, buf)
          raise ArgumentError.new("Illegal size value: #size returns #{sz} but cannot read") if n.nil?
          dev << buf
          rest -= n.bytesize
        end
      end

      def dump_chunks(io, dev)
        buf = ''
        while !io.read(@chunk_size, buf).nil?
          dev << dump_chunk(buf)
        end
      end

      def dump_chunk(str)
        dump_chunk_size(str.bytesize) + (str + CRLF)
      end

      def dump_last_chunk
        dump_chunk_size(0)
      end

      def dump_chunk_size(size)
        sprintf("%x", size) + CRLF
      end

      class Parts
        attr_reader :size
        attr_reader :sizes

        def initialize
          @body = []
          @sizes = {}
          @size = 0 # total
          @as_stream = false
        end

        def add(part)
          if Message.file?(part)
            @as_stream = true
            @body << part
            if part.respond_to?(:lstat)
              sz = part.lstat.size
              add_size(part, sz)
            elsif part.respond_to?(:size)
              if sz = part.size
                add_size(part, sz)
              else
                @sizes.clear
                @size = nil
              end
            else
              # use chunked upload
              @sizes.clear
              @size = nil
            end
          elsif @body[-1].is_a?(String)
            @body[-1] += part.to_s
            @size += part.to_s.bytesize if @size
          else
            @body << part.to_s
            @size += part.to_s.bytesize if @size
          end
        end

        def parts
          if @as_stream
            @body
          else
            [@body.join]
          end
        end

      private

        def add_size(part, sz)
          if @size
            @sizes[part] = sz
            @size += sz
          end
        end
      end

      def build_query_multipart_str(query, boundary)
        parts = Parts.new
        query.each do |attr, value|
          headers = ["--#{boundary}"]
          if Message.file?(value)
            remember_pos(value)
            param_str = params_from_file(value).collect { |k, v|
              "#{k}=\"#{v}\""
            }.join("; ")
            if value.respond_to?(:mime_type)
              content_type = value.mime_type
            elsif value.respond_to?(:content_type)
              content_type = value.content_type
            else
              path = value.respond_to?(:path) ? value.path : nil
              content_type = Message.mime_type(path)
            end
            headers << %{Content-Disposition: form-data; name="#{attr}"; #{param_str}}
            headers << %{Content-Type: #{content_type}}
          elsif attr.is_a?(Hash)
            h = attr
            value = h[:content]
            h.each do |h_key, h_val|
              headers << %{#{h_key}: #{h_val}} if h_key != :content
            end
            remember_pos(value) if Message.file?(value)
          else
            headers << %{Content-Disposition: form-data; name="#{attr}"}
            value = value.to_s
          end
          parts.add(headers.join(CRLF) + CRLF + CRLF)
          parts.add(value)
          parts.add(CRLF)
        end
        parts.add("--#{boundary}--" + CRLF + CRLF) # empty epilogue
        parts
      end

      def params_from_file(value)
        params = {}
        original_filename = value.respond_to?(:original_filename) ? value.original_filename : nil
        path = value.respond_to?(:path) ? value.path : nil
        params['filename'] = original_filename || File.basename(path || '')
        # Creation time is not available from File::Stat
        if value.respond_to?(:mtime)
          params['modification-date'] = value.mtime.rfc822
        end
        if value.respond_to?(:atime)
          params['read-date'] = value.atime.rfc822
        end
        params
      end
    end


    class << self
      private :new

      # Creates a Message instance of 'CONNECT' request.
      # 'CONNECT' request does not have Body.
      # uri:: an URI that need to connect.  Only uri.host and uri.port are used.
      def new_connect_request(uri)
        m = new
        m.http_header.init_connect_request(uri)
        m.http_header.body_size = nil
        m
      end

      # Creates a Message instance of general request.
      # method:: HTTP method String.
      # uri:: an URI object which represents an URL of web resource.
      # query:: a Hash or an Array of query part of URL.
      #         e.g. { "a" => "b" } => 'http://host/part?a=b'
      #         Give an array to pass multiple value like
      #         [["a", "b"], ["a", "c"]] => 'http://host/part?a=b&a=c'
      # body:: a Hash or an Array of body part.
      #        e.g. { "a" => "b" } => 'a=b'.
      #        Give an array to pass multiple value like
      #        [["a", "b"], ["a", "c"]] => 'a=b&a=c'.
      # boundary:: When the boundary given, it is sent as
      #            a multipart/form-data using this boundary String.
      def new_request(method, uri, query = nil, body = nil, boundary = nil)
        m = new
        m.http_header.init_request(method, uri, query)
        m.http_body = Body.new
        m.http_body.init_request(body || '', boundary)
        if body
          m.http_header.body_size = m.http_body.size
          m.http_header.chunked = true if m.http_body.size.nil?
        else
          m.http_header.body_size = nil
        end
        m
      end

      # Creates a Message instance of response.
      # body:: a String or an IO of response message body.
      def new_response(body, req = nil)
        m = new
        m.http_header.init_response(Status::OK, req)
        m.http_body = Body.new
        m.http_body.init_response(body)
        m.http_header.body_size = m.http_body.size || 0
        m
      end

      @@mime_type_handler = nil

      # Sets MIME type handler.
      #
      # handler must respond to :call with a single argument :path and returns
      # a MIME type String e.g. 'text/html'.
      # When the handler returns nil or an empty String,
      # 'application/octet-stream' is used.
      #
      # When you set nil to the handler, internal_mime_type is used instead.
      # The handler is nil by default.
      def mime_type_handler=(handler)
        @@mime_type_handler = handler
      end

      # Returns MIME type handler.
      def mime_type_handler
        @@mime_type_handler
      end

      # For backward compatibility.
      alias set_mime_type_func mime_type_handler=
      alias get_mime_type_func mime_type_handler

      def mime_type(path) # :nodoc:
        if @@mime_type_handler
          res = @@mime_type_handler.call(path)
          if !res || res.to_s == ''
            return 'application/octet-stream'
          else
            return res
          end
        else
          internal_mime_type(path)
        end
      end

      # Default MIME type handler.
      # See mime_type_handler=.
      def internal_mime_type(path)
        case path
        when /\.txt$/i
          'text/plain'
        when /\.xml$/i
          'text/xml'
        when /\.(htm|html)$/i
          'text/html'
        when /\.doc$/i
          'application/msword'
        when /\.png$/i
          'image/png'
        when /\.gif$/i
          'image/gif'
        when /\.(jpg|jpeg)$/i
          'image/jpeg'
        else
          'application/octet-stream'
        end
      end

      # Returns true if the given HTTP version allows keep alive connection.
      # version:: String
      def keep_alive_enabled?(version)
        version >= '1.1'
      end

      # Returns true if the given query (or body) has a multiple parameter.
      def multiparam_query?(query)
        query.is_a?(Array) or query.is_a?(Hash)
      end

      # Returns true if the given object is a File.  In HTTPClient, a file is;
      # * must respond to :read for retrieving String chunks.
      # * must respond to :pos and :pos= to rewind for reading.
      #   Rewinding is only needed for following HTTP redirect.  Some IO impl
      #   defines :pos= but raises an Exception for pos= such as StringIO
      #   but there's no problem as far as using it for non-following methods
      #   (get/post/etc.)
      def file?(obj)
        obj.respond_to?(:read) and obj.respond_to?(:pos) and
          obj.respond_to?(:pos=)
      end

      def create_query_part_str(query) # :nodoc:
        if multiparam_query?(query)
          escape_query(query)
        elsif query.respond_to?(:read)
          query = query.read
        else
          query.to_s
        end
      end

      def Array.try_convert(value)
        return value if value.instance_of?(Array)
        return nil if !value.respond_to?(:to_ary)
        converted = value.to_ary
        return converted if converted.instance_of?(Array)

        cname = value.class.name
        raise TypeError, "can't convert %s to %s (%s#%s gives %s)" %
          [cname, Array.name, cname, :to_ary, converted.class.name]
      end unless Array.respond_to?(:try_convert)

      def escape_query(query) # :nodoc:
        pairs = []
        query.each { |attr, value|
          left = escape(attr.to_s) << '='
          if values = Array.try_convert(value)
            values.each { |v|
              if v.respond_to?(:read)
                v = v.read
              end
              pairs.push(left + escape(v.to_s))
            }
          else
            if value.respond_to?(:read)
              value = value.read
            end
            pairs.push(left << escape(value.to_s))
          end
        }
        pairs.join('&')
      end

      # from CGI.escape
      if defined?(Encoding::ASCII_8BIT)
        def escape(str) # :nodoc:
          str.dup.force_encoding(Encoding::ASCII_8BIT).gsub(/([^ a-zA-Z0-9_.-]+)/) {
            '%' + $1.unpack('H2' * $1.bytesize).join('%').upcase
          }.tr(' ', '+')
        end
      else
        def escape(str) # :nodoc:
          str.gsub(/([^ a-zA-Z0-9_.-]+)/n) {
            '%' + $1.unpack('H2' * $1.bytesize).join('%').upcase
          }.tr(' ', '+')
        end
      end

      # from CGI.parse
      def parse(query)
        params = Hash.new([].freeze)
        query.split(/[&;]/n).each do |pairs|
          key, value = pairs.split('=',2).collect{|v| unescape(v) }
          if params.has_key?(key)
            params[key].push(value)
          else
            params[key] = [value]
          end
        end
        params
      end

      # from CGI.unescape
      def unescape(string)
        string.tr('+', ' ').gsub(/((?:%[0-9a-fA-F]{2})+)/n) do
          [$1.delete('%')].pack('H*')
        end
      end
    end


    # HTTP::Message::Headers:: message header.
    attr_accessor :http_header

    # HTTP::Message::Body:: message body.
    attr_reader :http_body

    # OpenSSL::X509::Certificate:: response only.  server certificate which is
    #                              used for retrieving the response.
    attr_accessor :peer_cert

    # The other Message object when this Message is generated instead of
    # the Message because of redirection, negotiation, or format conversion.
    attr_accessor :previous

    # Creates a Message.  This method should be used internally.
    # Use Message.new_connect_request, Message.new_request or
    # Message.new_response instead.
    def initialize # :nodoc:
      @http_header = Headers.new
      @http_body = @peer_cert = nil
      @previous = nil
    end

    # Dumps message (header and body) to given dev.
    # dev needs to respond to <<.
    def dump(dev = '')
      str = @http_header.dump + CRLF
      if @http_header.chunked
        dev = @http_body.dump_chunked(str, dev)
      elsif @http_body
        dev = @http_body.dump(str, dev)
      else
        dev << str
      end
      dev
    end

    # Sets a new body.  header.body_size is updated with new body.size.
    def http_body=(body)
      @http_body = body
      @http_header.body_size = @http_body.size if @http_header
    end
    alias body= http_body=

    # Returns HTTP version in a HTTP header.  String.
    def http_version
      @http_header.http_version
    end

    # Sets HTTP version in a HTTP header.  String.
    def http_version=(http_version)
      @http_header.http_version = http_version
    end

    VERSION_WARNING = 'Message#version (Float) is deprecated. Use Message#http_version (String) instead.'
    def version
      warning(VERSION_WARNING)
      @http_header.http_version.to_f
    end

    def version=(version)
      warning(VERSION_WARNING)
      @http_header.http_version = version
    end

    # Returns HTTP status code in response.  Integer.
    def status
      @http_header.status_code
    end

    alias code status
    alias status_code status

    # Sets HTTP status code of response.  Integer.
    # Reason phrase is updated, too.
    def status=(status)
      @http_header.status_code = status
    end

    # Returns  HTTP status reason phrase in response.  String.
    def reason
      @http_header.reason_phrase
    end

    # Sets  HTTP status reason phrase of response.  String.
    def reason=(reason)
      @http_header.reason_phrase = reason
    end

    # Returns 'Content-Type' header value.
    def content_type
      @http_header.content_type
    end

    # Sets 'Content-Type' header value.  Overrides if already exists.
    def content_type=(content_type)
      @http_header.content_type = content_type
    end
    alias contenttype content_type
    alias contenttype= content_type=

    # Returns content encoding
    def body_encoding
      @http_header.body_encoding
    end

    # Returns a content of message body.  A String or an IO.
    def content
      @http_body.content
    end

    alias header http_header
    alias body content

    # Returns Hash of header. key and value are both String. Each key has a
    # single value so you can't extract exact value when a message has multiple
    # headers like 'Set-Cookie'. Use header['Set-Cookie'] for that purpose.
    # (It returns an Array always)
    def headers
      Hash[*http_header.all.flatten]
    end

    # Extracts cookies from 'Set-Cookie' header.
    # Supports 'Set-Cookie' in response header only.
    # Do we need 'Cookie' support in request header?
    def cookies
      set_cookies = http_header['set-cookie']
      unless set_cookies.empty?
        uri = http_header.request_uri
        set_cookies.map { |str|
          WebAgent::Cookie.parse(str, uri)
        }.flatten
      end
    end

    # Convenience method to return boolean of whether we had a successful request
    def ok?
      HTTP::Status.successful?(status)
    end

    def redirect?
      HTTP::Status.redirect?(status)
    end

    # SEE_OTHER is a redirect, but it should sent as GET
    def see_other?
      status == HTTP::Status::SEE_OTHER
    end
  end

end
