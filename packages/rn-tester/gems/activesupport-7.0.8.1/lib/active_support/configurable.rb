# frozen_string_literal: true

require "active_support/concern"
require "active_support/ordered_options"

module ActiveSupport
  # Configurable provides a <tt>config</tt> method to store and retrieve
  # configuration options as an OrderedOptions.
  module Configurable
    extend ActiveSupport::Concern

    class Configuration < ActiveSupport::InheritableOptions
      def compile_methods!
        self.class.compile_methods!(keys)
      end

      # Compiles reader methods so we don't have to go through method_missing.
      def self.compile_methods!(keys)
        keys.reject { |m| method_defined?(m) }.each do |key|
          class_eval <<-RUBY, __FILE__, __LINE__ + 1
            def #{key}; _get(#{key.inspect}); end
          RUBY
        end
      end
    end

    module ClassMethods
      def config
        @_config ||= if respond_to?(:superclass) && superclass.respond_to?(:config)
          superclass.config.inheritable_copy
        else
          # create a new "anonymous" class that will host the compiled reader methods
          Class.new(Configuration).new
        end
      end

      def configure
        yield config
      end

      # Allows you to add shortcut so that you don't have to refer to attribute
      # through config. Also look at the example for config to contrast.
      #
      # Defines both class and instance config accessors.
      #
      #   class User
      #     include ActiveSupport::Configurable
      #     config_accessor :allowed_access
      #   end
      #
      #   User.allowed_access # => nil
      #   User.allowed_access = false
      #   User.allowed_access # => false
      #
      #   user = User.new
      #   user.allowed_access # => false
      #   user.allowed_access = true
      #   user.allowed_access # => true
      #
      #   User.allowed_access # => false
      #
      # The attribute name must be a valid method name in Ruby.
      #
      #   class User
      #     include ActiveSupport::Configurable
      #     config_accessor :"1_Badname"
      #   end
      #   # => NameError: invalid config attribute name
      #
      # To omit the instance writer method, pass <tt>instance_writer: false</tt>.
      # To omit the instance reader method, pass <tt>instance_reader: false</tt>.
      #
      #   class User
      #     include ActiveSupport::Configurable
      #     config_accessor :allowed_access, instance_reader: false, instance_writer: false
      #   end
      #
      #   User.allowed_access = false
      #   User.allowed_access # => false
      #
      #   User.new.allowed_access = true # => NoMethodError
      #   User.new.allowed_access        # => NoMethodError
      #
      # Or pass <tt>instance_accessor: false</tt>, to omit both instance methods.
      #
      #   class User
      #     include ActiveSupport::Configurable
      #     config_accessor :allowed_access, instance_accessor: false
      #   end
      #
      #   User.allowed_access = false
      #   User.allowed_access # => false
      #
      #   User.new.allowed_access = true # => NoMethodError
      #   User.new.allowed_access        # => NoMethodError
      #
      # Also you can pass <tt>default</tt> or a block to set up the attribute with a default value.
      #
      #   class User
      #     include ActiveSupport::Configurable
      #     config_accessor :allowed_access, default: false
      #     config_accessor :hair_colors do
      #       [:brown, :black, :blonde, :red]
      #     end
      #   end
      #
      #   User.allowed_access # => false
      #   User.hair_colors # => [:brown, :black, :blonde, :red]
      def config_accessor(*names, instance_reader: true, instance_writer: true, instance_accessor: true, default: nil) # :doc:
        names.each do |name|
          raise NameError.new("invalid config attribute name") unless /\A[_A-Za-z]\w*\z/.match?(name)

          reader, reader_line = "def #{name}; config.#{name}; end", __LINE__
          writer, writer_line = "def #{name}=(value); config.#{name} = value; end", __LINE__

          singleton_class.class_eval reader, __FILE__, reader_line
          singleton_class.class_eval writer, __FILE__, writer_line

          if instance_accessor
            class_eval reader, __FILE__, reader_line if instance_reader
            class_eval writer, __FILE__, writer_line if instance_writer
          end

          send("#{name}=", block_given? ? yield : default)
        end
      end
      private :config_accessor
    end

    # Reads and writes attributes from a configuration OrderedOptions.
    #
    #   require "active_support/configurable"
    #
    #   class User
    #     include ActiveSupport::Configurable
    #   end
    #
    #   user = User.new
    #
    #   user.config.allowed_access = true
    #   user.config.level = 1
    #
    #   user.config.allowed_access # => true
    #   user.config.level          # => 1
    def config
      @_config ||= self.class.config.inheritable_copy
    end
  end
end
