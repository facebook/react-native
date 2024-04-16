require 'set'

module Typhoeus

  # This is a Factory for easies to be used in the hydra.
  # Before an easy is ready to be added to a multi the
  # on_complete callback to be set.
  # This is done by this class.
  #
  # @api private
  class EasyFactory

    RENAMED_OPTIONS =  {
          :auth_method => :httpauth,
          :connect_timeout => :connecttimeout,
          :encoding => :accept_encoding,
          :follow_location => :followlocation,
          :max_redirects => :maxredirs,
          :proxy_type => :proxytype,
          :ssl_cacert => :cainfo,
          :ssl_capath => :capath,
          :ssl_cert => :sslcert,
          :ssl_cert_type => :sslcerttype,
          :ssl_key => :sslkey,
          :ssl_key_password => :keypasswd,
          :ssl_key_type => :sslkeytype,
          :ssl_version => :sslversion,
      }

    CHANGED_OPTIONS =  {
          :disable_ssl_host_verification => :ssl_verifyhost,
          :disable_ssl_peer_verification => :ssl_verifypeer,
          :proxy_auth_method => :proxyauth,
      }

    REMOVED_OPTIONS =  Set.new([:cache_key_basis, :cache_timeout, :user_agent])

    SANITIZE_IGNORE  = Set.new([:method, :cache_ttl, :cache])
    SANITIZE_TIMEOUT = Set.new([:timeout_ms, :connecttimeout_ms])

    # Returns the request provided.
    #
    # @return [ Typhoeus::Request ]
    attr_reader :request

    # Returns the hydra provided.
    #
    # @return [ Typhoeus::Hydra ]
    attr_reader :hydra

    # Create an easy factory.
    #
    # @example Create easy factory.
    #   Typhoeus::Hydra::EasyFactory.new(request, hydra)
    #
    # @param [ Request ] request The request to build an easy for.
    # @param [ Hydra ] hydra The hydra to build an easy for.
    def initialize(request, hydra = nil)
      @request = request
      @hydra = hydra
    end

    # Return the easy in question.
    #
    # @example Return easy.
    #   easy_factory.easy
    #
    # @return [ Ethon::Easy ] The easy.
    def easy
      @easy ||= Typhoeus::Pool.get
    end

    # Fabricated easy.
    #
    # @example Prepared easy.
    #   easy_factory.get
    #
    # @return [ Ethon::Easy ] The easy.
    def get
      begin
        read_callback_body = request.options.delete(:set_read_callback)

        easy.http_request(
          request.base_url.to_s,
          request.options.fetch(:method, :get),
          sanitize(request.options)
        )

        # this needs to happen after http_request because
        # ethon will set infilesize to zero if form.empty?
        set_read_callback(read_callback_body) if !read_callback_body.nil?
      rescue Ethon::Errors::InvalidOption => e
        help = provide_help(e.message.match(/:\s(\w+)/)[1])
        raise $!, "#{$!}#{help}", $!.backtrace
      end
      set_callback
      easy
    end

    private

    def sanitize(options)
      # set nosignal to true by default
      # this improves thread safety and timeout behavior
      sanitized = {:nosignal => true}
      options.each do |k,v|
        s = k.to_sym
        next if SANITIZE_IGNORE.include?(s)
        if new_option = RENAMED_OPTIONS[k.to_sym]
          warn("Deprecated option #{k}. Please use #{new_option} instead.")
          sanitized[new_option] = v
        # sanitize timeouts
        elsif SANITIZE_TIMEOUT.include?(s)
          if !v.integer?
            warn("Value '#{v}' for option '#{k}' must be integer.")
          end
          sanitized[k] = v.ceil
        else
          sanitized[k] = v
        end
      end

      sanitize_timeout!(sanitized, :timeout)
      sanitize_timeout!(sanitized, :connecttimeout)

      sanitized
    end

    def sanitize_timeout!(options, timeout)
      timeout_ms = :"#{timeout}_ms"
      if options[timeout] && options[timeout].round != options[timeout]
        if !options[timeout_ms]
          options[timeout_ms] = (options[timeout]*1000).ceil
        end
        options[timeout] = options[timeout].ceil
      end
      options
    end

    # Sets on_complete callback on easy in order to be able to
    # track progress.
    #
    # @example Set callback.
    #   easy_factory.set_callback
    #
    # @return [ Ethon::Easy ] The easy.
    def set_callback
      if request.streaming?
        response = nil
        easy.on_headers do |easy|
          response = Response.new(Ethon::Easy::Mirror.from_easy(easy).options)
          request.execute_headers_callbacks(response)
        end
        request.on_body.each do |callback|
          easy.on_body do |chunk, easy|
            callback.call(chunk, response)
          end
        end
      else
        easy.on_headers do |easy|
          request.execute_headers_callbacks(Response.new(Ethon::Easy::Mirror.from_easy(easy).options))
        end
      end
      request.on_progress.each do |callback|
        easy.on_progress do |dltotal, dlnow, ultotal, ulnow, easy|
          callback.call(dltotal, dlnow, ultotal, ulnow, response)
        end
      end
      easy.on_complete do |easy|
        request.finish(Response.new(easy.mirror.options))
        Typhoeus::Pool.release(easy)
        if hydra && !hydra.queued_requests.empty?
          hydra.dequeue_many
        end
      end
    end

    # Sets up an easy upload with CURLOPT_READFUNCTION
    # along with CURLOPT_INFILESIZE_LARGE and CURLOPT_UPLOAD
    #
    # @param [ String/File ] body The body read by the readfunction.
    #
    # @return [ Ethon::Easy ] The easy.
    def set_read_callback(body)
      easy.infilesize_large =
        if body.respond_to?(:bytesize)
          body.bytesize
        elsif body.respond_to?(:size)
          body.size
        end

      easy.upload = true
      easy.set_read_callback(body)

      easy
    end

    def provide_help(option)
      if new_option = CHANGED_OPTIONS[option.to_sym]
        "\nPlease try #{new_option} instead of #{option}." if new_option
      elsif REMOVED_OPTIONS.include?(option.to_sym)
        "\nThe option #{option} was removed."
      end
    end
  end
end
