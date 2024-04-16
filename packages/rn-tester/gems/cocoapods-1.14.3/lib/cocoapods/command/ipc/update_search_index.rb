module Pod
  class Command
    class IPC < Command
      class UpdateSearchIndex < IPC
        self.summary = 'Updates the search index'
        self.description = <<-DESC
          Updates the search index and prints its path to standard output.
          The search index is a YAML encoded dictionary where the keys
          are the names of the Pods and the values are a dictionary containing
          the following information:
          - version
          - summary
          - description
          - authors
        DESC

        def run
          config.sources_manager.updated_search_index
          output_pipe.puts(config.sources_manager.search_index_path)
        end
      end
    end
  end
end
