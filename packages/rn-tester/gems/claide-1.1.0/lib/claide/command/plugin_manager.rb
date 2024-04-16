# encoding: utf-8

module CLAide
  class Command
    # Handles plugin related logic logic for the `Command` class.
    #
    # Plugins are loaded the first time a command run and are identified by the
    # prefix specified in the command class. Plugins must adopt the following
    # conventions:
    #
    # - Support being loaded by a file located under the
    # `lib/#{plugin_prefix}_plugin` relative path.
    # - Be stored in a folder named after the plugin.
    #
    class PluginManager
      # @return [Hash<String,Gem::Specification>] The loaded plugins,
      #         grouped by plugin prefix.
      #
      def self.loaded_plugins
        @loaded_plugins ||= {}
      end

      # @return [Array<Gem::Specification>] Loads plugins via RubyGems looking
      #         for files named after the `PLUGIN_PREFIX_plugin` and returns the
      #         specifications of the gems loaded successfully.
      #         Plugins are required safely.
      #
      def self.load_plugins(plugin_prefix)
        loaded_plugins[plugin_prefix] ||=
          plugin_gems_for_prefix(plugin_prefix).map do |spec, paths|
            spec if safe_require(paths)
          end.compact
      end

      # @return [Array<Specification>] The RubyGems specifications for the
      #         loaded plugins.
      #
      def self.specifications
        loaded_plugins.values.flatten.uniq
      end

      # @return [Array<Specification>] The RubyGems specifications for the
      #         installed plugins that match the given `plugin_prefix`.
      #
      def self.installed_specifications_for_prefix(plugin_prefix)
        loaded_plugins[plugin_prefix] ||
          plugin_gems_for_prefix(plugin_prefix).map(&:first)
      end

      # @return [Array<String>] The list of the plugins whose root path appears
      #         in the backtrace of an exception.
      #
      # @param  [Exception] exception
      #         The exception to analyze.
      #
      def self.plugins_involved_in_exception(exception)
        specifications.select do |gemspec|
          exception.backtrace.any? do |line|
            full_require_paths_for(gemspec).any? do |plugin_path|
              line.include?(plugin_path)
            end
          end
        end.map(&:name)
      end

      # @group Helper Methods

      # @return [Array<[Gem::Specification, Array<String>]>]
      #         Returns an array of tuples containing the specifications and
      #         plugin files to require for a given plugin prefix.
      #
      def self.plugin_gems_for_prefix(prefix)
        glob = "#{prefix}_plugin#{Gem.suffix_pattern}"
        Gem::Specification.latest_specs(true).map do |spec|
          matches = spec.matches_for_glob(glob)
          [spec, matches] unless matches.empty?
        end.compact
      end

      # Requires the given paths.
      # If any exception occurs it is caught and an
      # informative message is printed.
      #
      # @param  [String] paths
      #         The paths to require.
      #
      # @return [Bool] Whether requiring succeeded.
      #
      def self.safe_require(paths)
        paths.each do |path|
          begin
            require(path)
          rescue Exception => exception # rubocop:disable RescueException
            message = "\n---------------------------------------------"
            message << "\nError loading plugin file `#{path}`.\n"
            message << "\n#{exception.class} - #{exception.message}"
            message << "\n#{exception.backtrace.join("\n")}"
            message << "\n---------------------------------------------\n"
            warn message.ansi.yellow
            return false
          end
        end

        true
      end

      def self.full_require_paths_for(gemspec)
        if gemspec.respond_to?(:full_require_paths)
          return gemspec.full_require_paths
        end

        # RubyGems < 2.2
        gemspec.require_paths.map do |require_path|
          if require_path.include?(gemspec.full_gem_path)
            require_path
          else
            File.join(gemspec.full_gem_path, require_path)
          end
        end
      end
      private_class_method :full_require_paths_for
    end
  end
end
