require 'rack/typhoeus/middleware/params_decoder/helper'

module Rack
  module Typhoeus
    module Middleware

      # This Rack middleware takes care of the proper deserialization of
      # the nested params encoded by Typhoeus.
      #
      # @example Require the railtie when using Rails.
      #   require 'typhoeus/railtie'
      #
      # @example Include the middleware for Rack based applications.
      #   use Rack::Typhoeus::Middleware::ParamsDecoder
      #
      # @example Use the helper directly. Not recommended as b/c the interface might change.
      #   require 'rack/typhoeus/middleware/params_decoder/helper'
      #   include Rack::Typhoeus::Middleware::ParamsDecoder::Helper
      #   decode!(params)
      #
      # @author Dwayne Macgowan
      # @since 0.5.4
      class ParamsDecoder
        include ParamsDecoder::Helper

        def initialize(app)
          @app = app
        end

        def call(env)
          req = Rack::Request.new(env)
          decode(req.params).each_pair { |k, v| update_params req, k, v }
          @app.call(env)
        end

        private

        # Persist params change in environment. Extracted from:
        # https://github.com/rack/rack/blob/master/lib/rack/request.rb#L243
        def update_params(req, k, v)
          found = false
          if req.GET.has_key?(k)
            found = true
            req.GET[k] = v
          end
          if req.POST.has_key?(k)
            found = true
            req.POST[k] = v
          end
          unless found
            req.GET[k] = v
          end
        end
      end
    end
  end
end
