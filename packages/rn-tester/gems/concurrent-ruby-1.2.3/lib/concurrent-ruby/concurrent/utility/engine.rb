module Concurrent
  # @!visibility private
  module Utility

    # @!visibility private
    module EngineDetector
      def on_cruby?
        RUBY_ENGINE == 'ruby'
      end

      def on_jruby?
        RUBY_ENGINE == 'jruby'
      end

      def on_truffleruby?
        RUBY_ENGINE == 'truffleruby'
      end

      def on_windows?
        !(RbConfig::CONFIG['host_os'] =~ /mswin|mingw|cygwin/).nil?
      end

      def on_osx?
        !(RbConfig::CONFIG['host_os'] =~ /darwin|mac os/).nil?
      end

      def on_linux?
        !(RbConfig::CONFIG['host_os'] =~ /linux/).nil?
      end

      def ruby_version(version = RUBY_VERSION, comparison, major, minor, patch)
        result      = (version.split('.').map(&:to_i) <=> [major, minor, patch])
        comparisons = { :== => [0],
                        :>= => [1, 0],
                        :<= => [-1, 0],
                        :>  => [1],
                        :<  => [-1] }
        comparisons.fetch(comparison).include? result
      end
    end
  end

  # @!visibility private
  extend Utility::EngineDetector
end
