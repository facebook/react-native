require 'algolia/error'

module Algolia
  #
  # A class which encapsulates the HTTPS communication with the Algolia
  # API server for cross-app operations.
  #
  class AccountClient
    class << self
      #
      # Copies settings, synonyms, rules and objects from the source index to the
      # destination index. The replicas of the source index should not be copied.
      #
      # Throw an exception if the destination index already exists
      # Throw an exception if the indices are on the same application
      #
      # @param source_index the source index object
      # @param destination_index the destination index object
      # @param request_options contains extra parameters to send with your query
      #
      def copy_index(source_index, destination_index, request_options = {})
        raise AlgoliaError.new('The indexes are in the same application. Use Algolia::Client.copy_index instead.') if source_index.client.application_id == destination_index.client.application_id

        begin
          settings = destination_index.get_settings()
        rescue AlgoliaError
          # Destination index does not exists. We can proceed.
        else
          raise AlgoliaError.new("Destination index already exists. Please delete it before copying index across applications.")
        end

        responses = []

        settings = source_index.get_settings()
        responses << destination_index.set_settings(settings, {}, request_options)

        synonyms = []
        source_index.export_synonyms(100, request_options) do |synonym|
          synonym.delete('_highlightResult')
          synonyms << synonym
        end

        responses << destination_index.batch_synonyms(synonyms, false, false, request_options)

        rules = []
        source_index.export_rules(100, request_options) do |rule|
          rule.delete('_highlightResult')
          rules << rule
        end
        responses << destination_index.batch_rules(rules, false, false, request_options)

        # Copy objects
        responses = []
        batch = []
        batch_size = 1000
        count = 0

        source_index.browse do |obj|
          batch << obj
          count += 1

          if count == batch_size
            responses << destination_index.save_objects(batch, request_options)
            batch = []
            count = 0
          end
        end

        if batch.any?
          responses << destination_index.save_objects(batch, request_options)
        end

        responses
      end

      #
      # The method copy settings, synonyms, rules and objects from the source index
      # to the destination index and wait end of indexing. The replicas of the
      # source index should not be copied
      #
      # Throw an exception if the destination index already exists
      # Throw an exception if the indices are on the same application
      #
      # @param source_index the source index object
      # @param destination_index the destination index object
      # @param request_options contains extra parameters to send with your query
      #
      def copy_index!(source_index, destination_index, request_options = {})
        responses = self.copy_index(source_index, destination_index, request_options)

        responses.each do |res|
          destination_index.wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
        end

        responses
      end
    end
  end
end
