# frozen_string_literal: true

require "yaml"
require "active_support/encrypted_file"
require "active_support/ordered_options"
require "active_support/core_ext/object/inclusion"
require "active_support/core_ext/module/delegation"

module ActiveSupport
  # Provides convenience methods on top of EncryptedFile to access values stored
  # as encrypted YAML.
  #
  # Values can be accessed via +Hash+ methods, such as +fetch+ and +dig+, or via
  # dynamic accessor methods, similar to OrderedOptions.
  #
  #   my_config = ActiveSupport::EncryptedConfiguration.new(...)
  #   my_config.read # => "some_secret: 123\nsome_namespace:\n  another_secret: 456"
  #
  #   my_config[:some_secret]
  #   # => 123
  #   my_config.some_secret
  #   # => 123
  #   my_config.dig(:some_namespace, :another_secret)
  #   # => 456
  #   my_config.some_namespace.another_secret
  #   # => 456
  #   my_config.fetch(:foo)
  #   # => KeyError
  #   my_config.foo!
  #   # => KeyError
  #
  class EncryptedConfiguration < EncryptedFile
    delegate :[], :fetch, to: :config
    delegate_missing_to :options

    def initialize(config_path:, key_path:, env_key:, raise_if_missing_key:)
      super content_path: config_path, key_path: key_path,
        env_key: env_key, raise_if_missing_key: raise_if_missing_key
    end

    # Reads the file and returns the decrypted content. See EncryptedFile#read.
    def read
      super
    rescue ActiveSupport::EncryptedFile::MissingContentError
      # Allow a config to be started without a file present
      ""
    end

    def write(contents)
      deserialize(contents)

      super
    end

    # Returns the decrypted content as a Hash with symbolized keys.
    #
    #   my_config = ActiveSupport::EncryptedConfiguration.new(...)
    #   my_config.read # => "some_secret: 123\nsome_namespace:\n  another_secret: 456"
    #
    #   my_config.config
    #   # => { some_secret: 123, some_namespace: { another_secret: 789 } }
    #
    def config
      @config ||= deserialize(read).deep_symbolize_keys
    end

    private
      def deep_transform(hash)
        return hash unless hash.is_a?(Hash)

        h = ActiveSupport::InheritableOptions.new
        hash.each do |k, v|
          h[k] = deep_transform(v)
        end
        h
      end

      def options
        @options ||= deep_transform(config)
      end

      def deserialize(config)
        doc = YAML.respond_to?(:unsafe_load) ? YAML.unsafe_load(config) : YAML.load(config)
        doc.presence || {}
      end
  end
end
