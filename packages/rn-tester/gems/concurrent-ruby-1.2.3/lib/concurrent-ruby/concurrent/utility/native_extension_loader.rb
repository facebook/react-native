require 'concurrent/utility/engine'
# Synchronization::AbstractObject must be defined before loading the extension
require 'concurrent/synchronization/abstract_object'

module Concurrent
  # @!visibility private
  module Utility
    # @!visibility private
    module NativeExtensionLoader

      def allow_c_extensions?
        Concurrent.on_cruby?
      end

      def c_extensions_loaded?
        defined?(@c_extensions_loaded) && @c_extensions_loaded
      end

      def load_native_extensions
        if Concurrent.on_cruby? && !c_extensions_loaded?
          ['concurrent/concurrent_ruby_ext',
           "concurrent/#{RUBY_VERSION[0..2]}/concurrent_ruby_ext"
          ].each { |p| try_load_c_extension p }
        end

        if Concurrent.on_jruby? && !java_extensions_loaded?
          begin
            require 'concurrent/concurrent_ruby.jar'
            set_java_extensions_loaded
          rescue LoadError => e
            raise e, "Java extensions are required for JRuby.\n" + e.message, e.backtrace
          end
        end
      end

      private

      def load_error_path(error)
        if error.respond_to? :path
          error.path
        else
          error.message.split(' -- ').last
        end
      end

      def set_c_extensions_loaded
        @c_extensions_loaded = true
      end

      def java_extensions_loaded?
        defined?(@java_extensions_loaded) && @java_extensions_loaded
      end

      def set_java_extensions_loaded
        @java_extensions_loaded = true
      end

      def try_load_c_extension(path)
        require path
        set_c_extensions_loaded
      rescue LoadError => e
        if load_error_path(e) == path
          # move on with pure-Ruby implementations
          # TODO (pitr-ch 12-Jul-2018): warning on verbose?
        else
          raise e
        end
      end

    end
  end

  # @!visibility private
  extend Utility::NativeExtensionLoader
end

Concurrent.load_native_extensions
