require 'pod/command/gem_helper'

module Pod
  class Command
    # This class is used by Command::GemsHelper to download the Gem
    # Specification index from rubygems.org and provide info about
    # the index.
    #
    class GemIndexCache
      # A memoized hash of all the rubygem specs. If it is nil, the specs will
      # be downloaded, which will take a few seconds to download.
      #
      # @return [Hash] The hash of all rubygems
      #
      def specs
        @specs ||= download_specs
      end

      # Alias to make the initial caching process more readable.
      #
      alias_method :download_and_cache_specs, :specs

      # Get an Array of Gem::NameTuple objects that match a given
      # spec name.
      #
      # @param [String] name
      #        The name of the gem to match on (e.g. 'cocoapods-try')
      #
      # @return [Array] Array of Gem::NameTuple that match the name
      #
      def specs_with_name(name)
        matching_specs = @specs.select do |spec|
          spec[0].name == name
        end

        name_tuples = []
        matching_specs.each do |(name_tuple, _)|
          name_tuples << name_tuple
        end

        name_tuples
      end

      #----------------#

      private

      # Force the rubygem spec index file
      #
      # @return [Hash] The hash of all rubygems
      #
      def download_specs
        UI.puts 'Downloading Rubygem specification index...'
        fetcher = Gem::SpecFetcher.fetcher
        results, errors = fetcher.available_specs(:released)

        unless errors.empty?
          UI.puts 'Error downloading Rubygem specification index: ' +
            errors.first.error.to_s
          return []
        end

        flatten_fetcher_results(results)
      end

      # Flatten the dictionary returned from Gem::SpecFetcher
      # to a simple array.
      #
      # @param [Hash] results
      #        the hash returned from the call to
      #        Gem::SpecFetcher.available_specs()
      #
      # @return [Array] Array of all spec results
      #
      def flatten_fetcher_results(results)
        specs = []
        results.each do |source, source_specs|
          source_specs.each do |tuple|
            specs << [tuple, source]
          end
        end

        specs
      end
    end
  end
end
