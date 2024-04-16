require "typhoeus"

module Rails
  module Typhoeus
    class Railtie < Rails::Railtie
      # Need to include the Typhoeus middleware.
      initializer "include the identity map" do |app|
        app.config.middleware.use "Rack::Typhoeus::Middleware::ParamsDecoder"
      end
    end
  end
end
