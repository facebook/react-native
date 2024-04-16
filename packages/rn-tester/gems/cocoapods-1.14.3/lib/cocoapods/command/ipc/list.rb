module Pod
  class Command
    class IPC < Command
      class List < IPC
        self.summary = 'Lists the specifications known to CocoaPods'
        self.description = <<-DESC
          Prints to STDOUT a YAML dictionary where the keys are the name of the
          specifications and each corresponding value is a dictionary with
          the following keys:
          - defined_in_file
          - version
          - authors
          - summary
          - description
          - platforms
        DESC

        def run
          require 'yaml'
          sets = config.sources_manager.aggregate.all_sets
          result = {}
          sets.each do |set|
            begin
              spec = set.specification
              result[spec.name] = {
                'authors' => spec.authors.keys,
                'summary' => spec.summary,
                'description' => spec.description,
                'platforms' => spec.available_platforms.map { |p| p.name.to_s },
              }
            rescue DSLError
              next
            end
          end
          output_pipe.puts result.to_yaml
        end
      end
    end
  end
end
