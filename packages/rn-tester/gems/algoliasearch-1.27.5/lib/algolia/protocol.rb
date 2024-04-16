require 'cgi'

module Algolia
  # A module which encapsulates the specifics of Algolia's REST API.
  module Protocol

    # Basics

    # The version of the REST API implemented by this module.
    VERSION = 1

    # HTTP Headers
    # ----------------------------------------

    # The HTTP header used for passing your application ID to the Algolia API.
    HEADER_APP_ID            = "X-Algolia-Application-Id"

    # The HTTP header used for passing your API key to the Algolia API.
    HEADER_API_KEY           = "X-Algolia-API-Key"
    HEADER_FORWARDED_IP      = "X-Forwarded-For"
    HEADER_FORWARDED_API_KEY = "X-Forwarded-API-Key"

    # HTTP ERROR CODES
    # ----------------------------------------

    ERROR_BAD_REQUEST = 400
    ERROR_FORBIDDEN = 403
    ERROR_NOT_FOUND = 404

    # URI Helpers
    # ----------------------------------------

    # Construct a uri to list available indexes
    def Protocol.indexes_uri
      "/#{VERSION}/indexes"
    end

    def Protocol.multiple_queries_uri(strategy = 'none')
      "/#{VERSION}/indexes/*/queries?strategy=#{strategy}"
    end

    def Protocol.objects_uri
      "/#{VERSION}/indexes/*/objects"
    end

    # Construct a uri referencing a given Algolia index
    def Protocol.index_uri(index)
      "/#{VERSION}/indexes/#{CGI.escape(index)}"
    end

    def Protocol.batch_uri(index = nil)
      "#{index.nil? ? "/#{VERSION}/indexes/*" : index_uri(index)}/batch"
    end

    def Protocol.index_operation_uri(index)
      "#{index_uri(index)}/operation"
    end

    def Protocol.task_uri(index, task_id)
      "#{index_uri(index)}/task/#{task_id}"
    end

    def Protocol.object_uri(index, object_id, params = {})
      params = params.nil? || params.size == 0 ? '' : "?#{to_query(params)}"
      "#{index_uri(index)}/#{CGI.escape(object_id.to_s)}#{params}"
    end

    def Protocol.search_uri(index, query, params = {})
      params = params.nil? || params.size == 0 ? '' : "&#{to_query(params)}"
      "#{index_uri(index)}?query=#{CGI.escape(query)}&#{params}"
    end

    def Protocol.search_post_uri(index)
      "#{index_uri(index)}/query"
    end

    def Protocol.browse_uri(index, params = {})
      params = params.nil? || params.size == 0 ? '' : "?#{to_query(params)}"
      "#{index_uri(index)}/browse#{params}"
    end

    def Protocol.search_facet_uri(index, facet)
      "#{index_uri(index)}/facets/#{CGI.escape(facet)}/query"
    end

    def Protocol.partial_object_uri(index, object_id, create_if_not_exits = true)
      params = create_if_not_exits ? '' : '?createIfNotExists=false'
      "#{index_uri(index)}/#{CGI.escape(object_id.to_s)}/partial#{params}"
    end

    def Protocol.settings_uri(index, params = {})
      params = params.nil? || params.size == 0 ? '' : "?#{to_query(params)}"
      "#{index_uri(index)}/settings#{params}"
    end

    def Protocol.clear_uri(index)
      "#{index_uri(index)}/clear"
    end

    def Protocol.logs(offset, length, type)
      "/#{VERSION}/logs?offset=#{offset}&length=#{length}&type=#{type}"
    end

    def Protocol.keys_uri
      "/#{VERSION}/keys"
    end

    def Protocol.key_uri(key)
      "/#{VERSION}/keys/#{key}"
    end

    def Protocol.restore_key_uri(key)
      "/#{VERSION}/keys/#{key}/restore"
    end

    def Protocol.index_key_uri(index, key)
      "#{index_uri(index)}/keys/#{key}"
    end

    def Protocol.index_keys_uri(index)
      "#{index_uri(index)}/keys"
    end

    def Protocol.to_query(params)
      params.map do |k, v|
        "#{CGI.escape(k.to_s)}=#{CGI.escape(v.to_s)}"
      end.join('&')
    end

    def Protocol.synonyms_uri(index)
      "#{index_uri(index)}/synonyms"
    end

    def Protocol.synonym_uri(index, object_id)
      "#{synonyms_uri(index)}/#{CGI.escape(object_id.to_s)}"
    end

    def Protocol.search_synonyms_uri(index)
      "#{synonyms_uri(index)}/search"
    end

    def Protocol.clear_synonyms_uri(index)
      "#{synonyms_uri(index)}/clear"
    end

    def Protocol.batch_synonyms_uri(index)
      "#{synonyms_uri(index)}/batch"
    end

    def Protocol.rules_uri(index)
      "#{index_uri(index)}/rules"
    end

    def Protocol.rule_uri(index, object_id)
      "#{rules_uri(index)}/#{CGI.escape(object_id.to_s)}"
    end

    def Protocol.search_rules_uri(index)
      "#{rules_uri(index)}/search"
    end

    def Protocol.clear_rules_uri(index)
      "#{rules_uri(index)}/clear"
    end

    def Protocol.batch_rules_uri(index)
      "#{rules_uri(index)}/batch"
    end

    def Protocol.delete_by_uri(index)
      "#{index_uri(index)}/deleteByQuery"
    end

    def Protocol.personalization_strategy_uri
      "/1/recommendation/personalization/strategy"
    end

    def Protocol.clusters_uri
      "/#{VERSION}/clusters"
    end

    def Protocol.cluster_mapping_uri(user_id = nil)
      user_id = "/#{CGI.escape(user_id)}" if user_id

      "/#{VERSION}/clusters/mapping" + user_id.to_s
    end

    def Protocol.list_ids_uri(page, hits_per_page)
      Protocol.cluster_mapping_uri+"?page=#{CGI.escape(page.to_s)}&hitsPerPage=#{CGI.escape(hits_per_page.to_s)}"
    end

    def Protocol.cluster_top_user_uri
      "/#{VERSION}/clusters/mapping/top"
    end

    def Protocol.search_user_id_uri
      "/#{VERSION}/clusters/mapping/search"
    end

    def Protocol.ab_tests_uri(ab_test = nil)
      ab_test = "/#{ab_test}" if ab_test

      "/2/abtests" + ab_test.to_s
    end

    def Protocol.ab_tests_stop_uri(ab_test)
      "/2/abtests/#{ab_test}/stop"
    end

  end
end
