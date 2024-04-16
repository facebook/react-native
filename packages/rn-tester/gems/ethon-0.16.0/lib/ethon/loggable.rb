# encoding: utf-8
# frozen_string_literal: true
module Ethon

  # Contains logging behaviour.
  module Loggable

    # Get the logger.
    #
    # @note Will try to grab Rails' logger first before creating a new logger
    #   with stdout.
    #
    # @example Get the logger.
    #   Loggable.logger
    #
    # @return [ Logger ] The logger.
    def logger
      return @logger if defined?(@logger)
      @logger = rails_logger || default_logger
    end

    # Set the logger.
    #
    # @example Set the logger.
    #   Loggable.logger = Logger.new($stdout)
    #
    # @param [ Logger ] logger The logger to set.
    #
    # @return [ Logger ] The new logger.
    def logger=(logger)
      @logger = logger
    end

    private

    # Gets the default Ethon logger - stdout.
    #
    # @example Get the default logger.
    #   Loggable.default_logger
    #
    # @return [ Logger ] The default logger.
    def default_logger
      logger = Logger.new($stdout)
      logger.level = Logger::INFO
      logger
    end

    # Get the Rails logger if it's defined.
    #
    # @example Get Rails' logger.
    #   Loggable.rails_logger
    #
    # @return [ Logger ] The Rails logger.
    def rails_logger
      defined?(::Rails) && ::Rails.respond_to?(:logger) && ::Rails.logger
    end
  end
  extend Loggable
end
