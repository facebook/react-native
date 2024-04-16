module Pod
  class Command
    class Cache < Command
      class Clean < Cache
        self.summary = 'Remove the cache for pods'

        self.description = <<-DESC
          Remove the cache for a given pod, or clear the cache completely.

          If there is multiple cache for various versions of the requested pod,
          you will be asked which one to clean. Use `--all` to clean them all.

          If you do not give a pod `NAME`, you need to specify the `--all`
          flag (this is to avoid cleaning all the cache by mistake).
        DESC

        self.arguments = [
          CLAide::Argument.new('NAME', false),
        ]

        def self.options
          [[
            '--all', 'Remove all the cached pods without asking'
          ]].concat(super)
        end

        def initialize(argv)
          @pod_name = argv.shift_argument
          @wipe_all = argv.flag?('all')
          super
        end

        def run
          if @pod_name.nil?
            # Note: at that point, @wipe_all is always true (thanks to `validate!`)
            # Remove all
            clear_cache
          else
            # Remove only cache for this pod
            cache_descriptors = @cache.cache_descriptors_per_pod[@pod_name]
            if cache_descriptors.nil?
              UI.notice("No cache for pod named #{@pod_name} found")
            elsif cache_descriptors.count > 1 && !@wipe_all
              # Ask which to remove
              choices = cache_descriptors.map { |c| "#{@pod_name} v#{c[:version]} (#{pod_type(c)})" }
              index = UI.choose_from_array(choices, 'Which pod cache do you want to remove?')
              remove_caches([cache_descriptors[index]])
            else
              # Remove all found cache of this pod
              remove_caches(cache_descriptors)
            end
          end
        end

        def validate!
          super
          if @pod_name.nil? && !@wipe_all
            # Security measure, to avoid removing the pod cache too agressively by mistake
            help! 'You should either specify a pod name or use the --all flag'
          end
        end

        private

        # Removes the specified cache
        #
        # @param [Array<Hash>] cache_descriptors
        #        An array of caches to remove, each specified with the same
        #        hash as cache_descriptors_per_pod especially :spec_file and :slug
        #
        def remove_caches(cache_descriptors)
          cache_descriptors.each do |desc|
            UI.message("Removing spec #{desc[:spec_file]} (v#{desc[:version]})") do
              FileUtils.rm(desc[:spec_file])
            end
            UI.message("Removing cache #{desc[:slug]}") do
              FileUtils.rm_rf(desc[:slug])
            end
          end
        end

        def clear_cache
          UI.message("Removing the whole cache dir #{@cache.root}") do
            FileUtils.rm_rf(@cache.root)
          end
        end
      end
    end
  end
end
