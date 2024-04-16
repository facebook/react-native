module Pod
  class Command
    class Cache < Command
      class List < Cache
        self.summary = 'List the paths of pod caches for each known pod'

        self.description = <<-DESC
          Shows the content of the pods cache as a YAML tree output, organized by pod.
          If `NAME` is given, only the caches for that pod will be included in the output.
        DESC

        self.arguments = [
          CLAide::Argument.new('NAME', false),
        ]

        def self.options
          [[
            '--short', 'Only print the path relative to the cache root'
          ]].concat(super)
        end

        def initialize(argv)
          @pod_name = argv.shift_argument
          @short_output = argv.flag?('short')
          super
        end

        def run
          UI.puts("$CACHE_ROOT: #{@cache.root}") if @short_output
          if @pod_name.nil? # Print all
            @cache.cache_descriptors_per_pod.each do |pod_name, cache_descriptors|
              print_pod_cache_infos(pod_name, cache_descriptors)
            end
          else # Print only for the requested pod
            cache_descriptors = @cache.cache_descriptors_per_pod[@pod_name]
            if cache_descriptors.nil?
              UI.notice("No cache for pod named #{@pod_name} found")
            else
              print_pod_cache_infos(@pod_name, cache_descriptors)
            end
          end
        end

        private

        # Prints the list of specs & pod cache dirs for a single pod name.
        #
        # This output is valid YAML so it can be parsed with 3rd party tools
        #
        # @param [Array<Hash>] cache_descriptors
        #        The various infos about a pod cache. Keys are
        #        :spec_file, :version, :release and :slug
        #
        def print_pod_cache_infos(pod_name, cache_descriptors)
          UI.puts "#{pod_name}:"
          cache_descriptors.each do |desc|
            if @short_output
              [:spec_file, :slug].each { |k| desc[k] = desc[k].relative_path_from(@cache.root) }
            end
            UI.puts("  - Version: #{desc[:version]}")
            UI.puts("    Type:    #{pod_type(desc)}")
            UI.puts("    Spec:    #{desc[:spec_file]}")
            UI.puts("    Pod:     #{desc[:slug]}")
          end
        end
      end
    end
  end
end
