require 'pod/command/gem_index_cache'

module Pod
  class Command
    # This module is used by Command::PluginsHelper to download the Gem
    # Specification data, check if a Gem is installed, and provide info
    # on all versions of a Gem.
    #
    module GemHelper
      # A GemIndexCache to manage downloading/caching the spec index.
      #
      @cache = nil

      # Getter for GemIndexCache
      #
      # @return [GemIndexCache] a new or memoized GemIndexCache
      #
      def self.cache
        @cache ||= GemIndexCache.new
      end

      # Instantiate a cache and download the spec index if it has
      # not already been done.
      #
      def self.download_and_cache_specs
        cache.download_and_cache_specs
      end

      # Tells if a gem is installed
      #
      # @param [String] gem_name
      #        The name of the plugin gem to test
      #
      # @param [String] version_string
      #        An optional version string, used to check if a specific
      #        version of a gem is installed
      #
      # @return [Bool] true if the gem is installed, false otherwise.
      #
      def self.gem_installed?(gem_name, version_string = nil)
        version = Gem::Version.new(version_string) if version_string

        if Gem::Specification.respond_to?(:find_all_by_name)
          gems = Gem::Specification.find_all_by_name(gem_name)
          return !gems.empty? unless version
          gems.each { |gem| return true if gem.version == version }
          false
        else
          dep = Gem::Dependency.new(gem_name, version_string)
          !Gem.source_index.search(dep).empty?
        end
      end

      # Get the version of a gem that is installed locally. If more than
      # one version is installed, this returns the first version found,
      # which MAY not be the highest/newest version.
      #
      # @return [String] The version of the gem that is installed,
      #                  or nil if it is not installed.
      #
      def self.installed_version(gem_name)
        if Gem::Specification.respond_to?(:find_all_by_name)
          gem = Gem::Specification.find_all_by_name(gem_name).first
        else
          dep = Gem::Dependency.new(gem_name)
          gem = Gem.source_index.search(dep).first
        end
        gem ? gem.version.to_s : nil
      end

      # Create a string containing all versions of a plugin,
      # colored to indicate if a specific version is installed
      # locally.
      #
      # @param [String] plugin_name
      #        The name of the plugin gem
      #
      # @param [GemIndexCache] index_cache
      #        Optional index cache can be passed in, otherwise
      #        the module instance is used.
      #
      # @return [String] a string containing a comma separated
      #                  concatenation of all versions of a plugin
      #                  that were found on rubygems.org
      #
      def self.versions_string(plugin_name, index_cache = @cache)
        name_tuples = index_cache.specs_with_name(plugin_name)
        sorted_versions = name_tuples.sort_by(&:version)
        version_strings = colorize_versions(sorted_versions)
        version_strings.join ', '
      end

      #----------------#

      private

      # Colorize an Array of version strings so versions that are installed
      # are green and uninstalled versions are yellow.
      #
      # @param [Array] versions
      #        sorted array of Gem::NameTuples representing all versions of
      #        a plugin gem.
      #
      # @return [Array] An array of strings, each one being the version
      #                 string of the same plugin
      #
      def self.colorize_versions(versions)
        colored_strings = []
        versions.reverse_each do |name_tuple|
          if gem_installed?(name_tuple.name, name_tuple.version.to_s)
            colored_strings << name_tuple.version.to_s.green
          else
            colored_strings << name_tuple.version.to_s.yellow
          end
        end
        colored_strings
      end
    end
  end
end
