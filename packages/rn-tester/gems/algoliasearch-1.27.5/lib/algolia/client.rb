require 'algolia/protocol'
require 'algolia/error'
require 'algolia/version'
require 'json'
require 'zlib'
require 'openssl'
require 'base64'

module Algolia
  WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY = 100

  #
  # A class which encapsulates the HTTPS communication with the Algolia
  # API server. Uses the HTTPClient library for low-level HTTP communication.
  #
  class Client
    attr_reader :ssl, :ssl_version, :hosts, :search_hosts, :application_id, :api_key, :headers, :connect_timeout, :send_timeout, :receive_timeout, :search_timeout, :batch_timeout

    DEFAULT_CONNECT_TIMEOUT = 2
    DEFAULT_RECEIVE_TIMEOUT = 30
    DEFAULT_SEND_TIMEOUT    = 30
    DEFAULT_BATCH_TIMEOUT   = 120
    DEFAULT_SEARCH_TIMEOUT  = 5
    DEFAULT_USER_AGENT      = ["Algolia for Ruby (#{::Algolia::VERSION})", "Ruby (#{RUBY_VERSION})"]

    def initialize(data = {})
      raise ArgumentError.new('No APPLICATION_ID provided, please set :application_id') if data[:application_id].nil?

      @ssl             = data[:ssl].nil? ? true : data[:ssl]
      @ssl_version     = data[:ssl_version].nil? ? nil : data[:ssl_version]
      @gzip            = data[:gzip].nil? ? true : data[:gzip]
      @application_id  = data[:application_id]
      @api_key         = data[:api_key]
      @hosts           = data[:hosts] || (["#{@application_id}.algolia.net"] + 1.upto(3).map { |i| "#{@application_id}-#{i}.algolianet.com" }.shuffle)
      @search_hosts    = data[:search_hosts] || data[:hosts] || (["#{@application_id}-dsn.algolia.net"] + 1.upto(3).map { |i| "#{@application_id}-#{i}.algolianet.com" }.shuffle)
      @connect_timeout = data[:connect_timeout] || DEFAULT_CONNECT_TIMEOUT
      @send_timeout    = data[:send_timeout] || DEFAULT_SEND_TIMEOUT
      @batch_timeout   = data[:batch_timeout] || DEFAULT_BATCH_TIMEOUT
      @receive_timeout = data[:receive_timeout] || DEFAULT_RECEIVE_TIMEOUT
      @search_timeout  = data[:search_timeout] || DEFAULT_SEARCH_TIMEOUT
      @headers = {
        Protocol::HEADER_API_KEY => api_key,
        Protocol::HEADER_APP_ID  => application_id,
        'Content-Type'           => 'application/json; charset=utf-8',
        'User-Agent'             => DEFAULT_USER_AGENT.push(data[:user_agent]).compact.join('; ')
      }
    end

    def destroy
      Thread.current["algolia_search_hosts_#{application_id}"] = nil
      Thread.current["algolia_hosts_#{application_id}"] = nil
      Thread.current["algolia_host_index_#{application_id}"] = nil
      Thread.current["algolia_search_host_index_#{application_id}"] = nil
    end

    #
    # Initialize a new index
    #
    def init_index(name)
      Index.new(name, self)
    end

    #
    # Initialize analytics helper
    #
    def init_analytics()
      Analytics.new(self, { :headers => @headers })
    end

    #
    # Allow to set custom headers
    #
    def set_extra_header(key, value)
      headers[key] = value
    end

    #
    # Allow to use IP rate limit when you have a proxy between end-user and Algolia.
    # This option will set the X-Forwarded-For HTTP header with the client IP and the X-Forwarded-API-Key with the API Key having rate limits.
    #
    # @param admin_api_key the admin API Key you can find in your dashboard
    # @param end_user_ip the end user IP (you can use both IPV4 or IPV6 syntax)
    # @param rate_limit_api_key the API key on which you have a rate limit
    #
    def enable_rate_limit_forward(admin_api_key, end_user_ip, rate_limit_api_key)
      headers[Protocol::HEADER_API_KEY] = admin_api_key
      headers[Protocol::HEADER_FORWARDED_IP] = end_user_ip
      headers[Protocol::HEADER_FORWARDED_API_KEY] = rate_limit_api_key
    end

    #
    # Disable IP rate limit enabled with enableRateLimitForward() function
    #
    def disable_rate_limit_forward
      headers[Protocol::HEADER_API_KEY] = api_key
      headers.delete(Protocol::HEADER_FORWARDED_IP)
      headers.delete(Protocol::HEADER_FORWARDED_API_KEY)
    end

    #
    # Convenience method thats wraps enable_rate_limit_forward/disable_rate_limit_forward
    #
    def with_rate_limits(end_user_ip, rate_limit_api_key, &block)
      enable_rate_limit_forward(api_key, end_user_ip, rate_limit_api_key)
      begin
        yield
      ensure
        disable_rate_limit_forward
      end
    end

    #
    # This method allows to query multiple indexes with one API call
    #
    # @param queries the array of hash representing the query and associated index name
    # @param options - accepts those keys:
    #   - index_name_key the name of the key used to fetch the index_name (:index_name by default)
    #   - strategy define the strategy applied on the sequential searches (none by default)
    #   - request_options contains extra parameters to send with your query
    #
    def multiple_queries(queries, options = nil, strategy = nil)
      if options.is_a?(Hash)
        index_name_key = options.delete(:index_name_key) || options.delete('index_name_key')
        strategy = options.delete(:strategy) || options.delete('strategy')
        request_options = options.delete(:request_options) || options.delete('request_options')
      else
        # Deprecated def multiple_queries(queries, index_name_key, strategy)
        index_name_key = options
      end
      index_name_key ||= :index_name
      strategy ||= 'none'
      request_options ||= {}

      requests = {
        :requests => queries.map do |query|
          query = query.dup
          index_name = query.delete(index_name_key) || query.delete(index_name_key.to_s)
          raise ArgumentError.new("Missing '#{index_name_key}' option") if index_name.nil?
          encoded_params = Hash[query.map { |k, v| [k.to_s, v.is_a?(Array) ? v.to_json : v] }]
          { :indexName => index_name, :params => Protocol.to_query(encoded_params) }
        end
      }
      post(Protocol.multiple_queries_uri(strategy), requests.to_json, :search, request_options)
    end

    #
    # Get objects by objectID across multiple indexes
    #
    # @param requests [
    #         { "indexName" => index_name_1, "objectID" => "obj1" },
    #         { "indexName" => index_name_2, "objectID" => "obj2" }
    #     ]
    #
    def multiple_get_objects(requests, request_options = {})
      post(Protocol.objects_uri, {:requests => requests}.to_json, :search, request_options)
    end

    #
    # List all existing indexes
    # return an Answer object with answer in the form
    #     {"items": [{ "name": "contacts", "createdAt": "2013-01-18T15:33:13.556Z"},
    #                {"name": "notes", "createdAt": "2013-01-18T15:33:13.556Z"}]}
    #
    # @param request_options contains extra parameters to send with your query
    #
    def list_indexes(request_options = {})
      get(Protocol.indexes_uri, :read, request_options)
    end

    #
    # Move an existing index.
    #
    # @param src_index the name of index to copy.
    # @param dst_index the new index name that will contains a copy of srcIndexName (destination will be overriten if it already exist).
    # @param request_options contains extra parameters to send with your query
    #
    def move_index(src_index, dst_index, request_options = {})
      request = { 'operation' => 'move', 'destination' => dst_index }
      post(Protocol.index_operation_uri(src_index), request.to_json, :write, request_options)
    end

    #
    # Move an existing index and wait until the move has been processed
    #
    # @param src_index the name of index to copy.
    # @param dst_index the new index name that will contains a copy of srcIndexName (destination will be overriten if it already exist).
    # @param request_options contains extra parameters to send with your query
    #
    def move_index!(src_index, dst_index, request_options = {})
      res = move_index(src_index, dst_index, request_options)
      wait_task(dst_index, res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Copy an existing index.
    #
    # @param src_index the name of index to copy.
    # @param dst_index the new index name that will contains a copy of srcIndexName (destination will be overriten if it already exist).
    # @param scope the optional list of scopes to copy (all if not specified).
    # @param request_options contains extra parameters to send with your query
    #
    def copy_index(src_index, dst_index, scope = nil, request_options = {})
      request = { 'operation' => 'copy', 'destination' => dst_index }
      request['scope'] = scope unless scope.nil?
      post(Protocol.index_operation_uri(src_index), request.to_json, :write, request_options)
    end

    #
    # Copy an existing index and wait until the copy has been processed.
    #
    # @param src_index the name of index to copy.
    # @param dst_index the new index name that will contains a copy of srcIndexName (destination will be overriten if it already exist).
    # @param scope the optional list of scopes to copy (all if not specified).
    # @param request_options contains extra parameters to send with your query
    #
    def copy_index!(src_index, dst_index, scope = nil, request_options = {})
      res = copy_index(src_index, dst_index, scope, request_options)
      wait_task(dst_index, res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Copy an existing index settings.
    #
    # @param src_index the name of index to copy.
    # @param dst_index the new index name that will contains a copy of srcIndexName's settings (destination's settings will be overriten if it already exist).
    # @param request_options contains extra parameters to send with your query
    #
    def copy_settings(src_index, dst_index, request_options = {})
      copy_index(src_index, dst_index, ['settings'], request_options)
    end

    #
    # Copy an existing index settings and wait until the copy has been processed.
    #
    # @param src_index the name of index to copy.
    # @param dst_index the new index name that will contains a copy of srcIndexName settings (destination settings will be overriten if it already exist).
    # @param request_options contains extra parameters to send with your query
    #
    def copy_settings!(src_index, dst_index, request_options = {})
      res = copy_settings(src_index, dst_index, request_options)
      wait_task(dst_index, res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Copy an existing index synonyms.
    #
    # @param src_index the name of index to copy.
    # @param dst_index the new index name that will contains a copy of srcIndexName's synonyms (destination's synonyms will be overriten if it already exist).
    # @param request_options contains extra parameters to send with your query
    #
    def copy_synonyms(src_index, dst_index, request_options = {})
      copy_index(src_index, dst_index, ['synonyms'], request_options)
    end

    #
    # Copy an existing index synonyms and wait until the copy has been processed.
    #
    # @param src_index the name of index to copy.
    # @param dst_index the new index name that will contains a copy of srcIndexName synonyms (destination synonyms will be overriten if it already exist).
    # @param request_options contains extra parameters to send with your query
    #
    def copy_synonyms!(src_index, dst_index, request_options = {})
      res = copy_synonyms(src_index, dst_index, request_options)
      wait_task(dst_index, res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Copy an existing index rules.
    #
    # @param src_index the name of index to copy.
    # @param dst_index the new index name that will contains a copy of srcIndexName's rules (destination's rules will be overriten if it already exist).
    # @param request_options contains extra parameters to send with your query
    #
    def copy_rules(src_index, dst_index, request_options = {})
      copy_index(src_index, dst_index, ['rules'], request_options)
    end

    #
    # Copy an existing index rules and wait until the copy has been processed.
    #
    # @param src_index the name of index to copy.
    # @param dst_index the new index name that will contains a copy of srcIndexName rules (destination rules will be overriten if it already exist).
    # @param request_options contains extra parameters to send with your query
    #
    def copy_rules!(src_index, dst_index, request_options = {})
      res = copy_rules(src_index, dst_index, request_options)
      wait_task(dst_index, res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Delete an index
    # @param name the name of the index to delete
    # @param request_options contains extra parameters to send with your query
    #
    def delete_index(name, request_options = {})
      init_index(name).delete(request_options)
    end

    #
    # Delete an index and wait until the deletion has been processed.
    # @param name the name of the index to delete
    # @param request_options contains extra parameters to send with your query
    #
    def delete_index!(name, request_options = {})
      init_index(name).delete!(request_options)
    end

    #
    # Return last logs entries.
    #
    # @param options - accepts those keys:
    #   - offset Specify the first entry to retrieve (0-based, 0 is the most recent log entry) - Default = 0
    #   - length Specify the maximum number of entries to retrieve starting at offset. Maximum allowed value: 1000 - Default = 10
    #   - type Type of log entries to retrieve ("all", "query", "build" or "error") - Default = 'all'
    #   - request_options contains extra parameters to send with your query
    #
    def get_logs(options = nil, length = nil, type = nil)
      if options.is_a?(Hash)
        offset = options.delete('offset') || options.delete(:offset)
        length = options.delete('length') || options.delete(:length)
        type = options.delete('type') || options.delete(:type)
        request_options = options.delete('request_options') || options.delete(:request_options)
      else
        # Deprecated def get_logs(offset, length, type)
        offset = options
      end
      length ||= 10
      type = 'all' if type.nil?
      type = type ? 'error' : 'all' if type.is_a?(true.class)
      request_options ||= {}

      get(Protocol.logs(offset, length, type), :write, request_options)
    end

    #
    # List all existing user keys with their associated ACLs
    #
    # @param request_options contains extra parameters to send with your query
    #
    def list_api_keys(request_options = {})
      get(Protocol.keys_uri, :read, request_options)
    end

    #
    # Get ACL of a user key
    #
    # @param request_options contains extra parameters to send with your query
    #
    def get_api_key(key, request_options = {})
      get(Protocol.key_uri(key), :read, request_options)
    end

    #
    #  Create a new user key
    #
    #  Deprecated call was add_api_key(acl, validity, maxQueriesPerIPPerHour, maxHitsPerQuery, indexes)
    #
    #  ACL can contain an array with those strings:
    #    - search: allow to search (https and http)
    #    - addObject: allows to add/update an object in the index (https only)
    #    - deleteObject : allows to delete an existing object (https only)
    #    - deleteIndex : allows to delete index content (https only)
    #    - settings : allows to get index settings (https only)
    #    - editSettings : allows to change index settings (https only)
    #
    #  @param object The list of parameters for this key.
    #         Defined by a Hash that can contain the following values:
    #          - acl: array of string
    #          - indexes: array of string
    #          - validity: int
    #          - referers: array of string
    #          - description: string
    #          - maxHitsPerQuery: integer
    #          - queryParameters: string
    #          - maxQueriesPerIPPerHour: integer
    #  @param request_options contains extra parameters to send with your query - Default = {}
    #
    def add_api_key(object, request_options = {}, max_queries_per_IP_per_hour = 0, max_hits_per_query = 0, indexes = nil)
      if object.instance_of?(Array)
        params = { :acl => object }
      else
        params = object
      end

      validity = 0
      unless request_options.is_a?(Hash)
        validity = request_options
        request_options = {}
      end

      params[:indexes] = indexes if indexes
      params['validity'] = validity.to_i if validity != 0
      params['maxHitsPerQuery'] = max_hits_per_query.to_i if max_hits_per_query != 0
      params['maxQueriesPerIPPerHour'] = max_queries_per_IP_per_hour.to_i if max_queries_per_IP_per_hour != 0

      post(Protocol.keys_uri, params.to_json, :write, request_options)
    end

    #
    #  Update a user key
    #
    #  Deprecated call was update_api_key(key, acl, validity, max_queries_per_IP_per_hour, max_hits_per_query, indexes)
    #
    #  ACL can contain an array with those strings:
    #    - search: allow to search (https and http)
    #    - addObject: allows to add/update an object in the index (https only)
    #    - deleteObject : allows to delete an existing object (https only)
    #    - deleteIndex : allows to delete index content (https only)
    #    - settings : allows to get index settings (https only)
    #    - editSettings : allows to change index settings (https only)
    #
    #  @param key API Key to update
    #  @param object The list of parameters for this key.
    #         Defined by a Hash that can contain the following values:
    #          - acl: array of string
    #          - indexes: array of string
    #          - validity: int
    #          - referers: array of string
    #          - description: string
    #          - maxHitsPerQuery: integer
    #          - queryParameters: string
    #          - maxQueriesPerIPPerHour: integer
    #  @param request_options contains extra parameters to send with your query - Default = {}
    #
    def update_api_key(key, object, request_options = {}, max_queries_per_IP_per_hour = 0, max_hits_per_query = 0, indexes = nil)
      if object.instance_of?(Array)
        params = { :acl => object }
      else
        params = object
      end

      validity = 0
      unless request_options.is_a?(Hash)
        validity = request_options
        request_options = {}
      end

      params[:indexes] = indexes if indexes
      params['validity'] = validity.to_i if validity != 0
      params['maxQueriesPerIPPerHour'] = max_queries_per_IP_per_hour.to_i if max_queries_per_IP_per_hour != 0
      params['maxHitsPerQuery'] = max_hits_per_query.to_i if max_hits_per_query != 0

      put(Protocol.key_uri(key), params.to_json, :write, request_options)
    end

    #
    # Delete an existing user key
    #
    def delete_api_key(key, request_options = {})
      delete(Protocol.key_uri(key), :write, request_options)
    end

    #
    # Restore a deleted api key
    #
    def restore_api_key(key, request_options = {})
      post(Protocol.restore_key_uri(key), :write, request_options)
    end

    #
    # Send a batch request targeting multiple indices
    #
    def batch(operations, request_options = {})
      post(Protocol.batch_uri, { 'requests' => operations }.to_json, :batch, request_options)
    end

    #
    # Send a batch request targeting multiple indices and wait the end of the indexing
    #
    def batch!(operations, request_options = {})
      res = batch(operations, request_options)
      res['taskID'].each do |index, taskID|
        wait_task(index, taskID, WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      end
    end

    #
    # Check the status of a task on the server.
    # All server task are asynchronous and you can check the status of a task with this method.
    #
    # @param index_name the index name owning the taskID
    # @param taskID the id of the task returned by server
    # @param request_options contains extra parameters to send with your query
    #
    def get_task_status(index_name, taskID, request_options = {})
      get(Protocol.task_uri(index_name, taskID), :read, request_options)['status']
    end

    #
    # Wait the publication of a task on the server.
    # All server task are asynchronous and you can check with this method that the task is published.
    #
    # @param index_name the index name owning the taskID
    # @param taskID the id of the task returned by server
    # @param time_before_retry the time in milliseconds before retry (default = 100ms)
    # @param request_options contains extra parameters to send with your query
    #
    def wait_task(index_name, taskID, time_before_retry = WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options = {})
      loop do
        status = get_task_status(index_name, taskID, request_options)
        if status == 'published'
          return
        end
        sleep(time_before_retry.to_f / 1000)
      end
    end

    def get_personalization_strategy(request_options = {})
      get(Protocol.personalization_strategy_uri, :read, request_options)
    end

    def set_personalization_strategy(strategy, request_options = {})
      post(Protocol.personalization_strategy_uri, strategy.to_json, :write, request_options)
    end

    #
    # Multicluster management
    #
    def list_clusters(request_options = {})
      get(Protocol.clusters_uri, :read, request_options)
    end

    def list_user_ids(page = 0, hits_per_page = 20, request_options = {})
      get(Protocol.list_ids_uri(page, hits_per_page), :read, request_options)
    end

    def get_top_user_ids(request_options = {})
      get(Protocol.cluster_top_user_uri, :read, request_options)
    end

    def assign_user_id(user_id, cluster_name, request_options = {})
      request_options = add_header_to_request_options(request_options, { :'X-Algolia-User-ID' => user_id})

      body = { :cluster => cluster_name }
      post(Protocol.cluster_mapping_uri, body.to_json, :write, request_options)
    end

    def get_user_id(user_id, request_options = {})
      get(Protocol.cluster_mapping_uri(user_id), :read, request_options)
    end

    def remove_user_id(user_id, request_options = {})
      request_options = add_header_to_request_options(request_options, { :'X-Algolia-User-ID' => user_id})

      delete(Protocol.cluster_mapping_uri, :write, request_options)
    end

    def search_user_id(query, cluster_name = nil, page = nil, hits_per_page = nil, request_options = {})
      body = { :query => query }
      body[:cluster] = cluster_name unless cluster_name.nil?
      body[:page] = page unless page.nil?
      body[:hitsPerPage] = hits_per_page unless hits_per_page.nil?
      post(Protocol.search_user_id_uri, body.to_json, :read, request_options)
    end

    # Perform an HTTP request for the given uri and method
    # with common basic response handling. Will raise a
    # AlgoliaProtocolError if the response has an error status code,
    # and will return the parsed JSON body on success, if there is one.
    #
    def request(uri, method, data = nil, type = :write, request_options = {})
      exceptions = []

      connect_timeout = @connect_timeout
      send_timeout = if type == :search
        @search_timeout
      elsif type == :batch
        type = :write
        @batch_timeout
      else
        @send_timeout
      end
      receive_timeout = type == :search ? @search_timeout : @receive_timeout

      thread_local_hosts(type != :write).each_with_index do |host, i|
        connect_timeout += 2 if i == 2
        send_timeout += 10 if i == 2
        receive_timeout += 10 if i == 2

        thread_index_key = type != :write ? "algolia_search_host_index_#{application_id}" : "algolia_host_index_#{application_id}"
        Thread.current[thread_index_key] = host[:index]
        host[:last_call] = Time.now.to_i

        host[:session].connect_timeout = connect_timeout
        host[:session].send_timeout = send_timeout
        host[:session].receive_timeout = receive_timeout
        begin
          return perform_request(host[:session], host[:base_url] + uri, method, data, request_options)
        rescue AlgoliaProtocolError => e
          raise if e.code / 100 == 4
          exceptions << e
        rescue => e
          exceptions << e
        end
        host[:session].reset_all
      end
      raise AlgoliaProtocolError.new(0, "Cannot reach any host: #{exceptions.map { |e| e.to_s }.join(', ')}")
    end

    def get(uri, type = :write, request_options = {})
      request(uri, :GET, nil, type, request_options)
    end

    def post(uri, body = {}, type = :write, request_options = {})
      request(uri, :POST, body, type, request_options)
    end

    def put(uri, body = {}, type = :write, request_options = {})
      request(uri, :PUT, body, type, request_options)
    end

    def delete(uri, type = :write, request_options = {})
      request(uri, :DELETE, nil, type, request_options)
    end

    private

    #
    # This method returns a thread-local array of sessions
    #
    def thread_local_hosts(read)
      thread_hosts_key = read ? "algolia_search_hosts_#{application_id}" : "algolia_hosts_#{application_id}"
      Thread.current[thread_hosts_key] ||= (read ? search_hosts : hosts).each_with_index.map do |host, i|
        client = HTTPClient.new
        client.ssl_config.ssl_version = @ssl_version if @ssl && @ssl_version
        client.transparent_gzip_decompression = @gzip
        client.ssl_config.add_trust_ca File.expand_path(File.join(File.dirname(__FILE__), '..', '..', 'resources', 'ca-bundle.crt'))
        {
          :index => i,
          :base_url => "http#{@ssl ? 's' : ''}://#{host}",
          :session => client,
          :last_call => nil
        }
      end
      hosts = Thread.current[thread_hosts_key]
      thread_index_key = read ? "algolia_search_host_index_#{application_id}" : "algolia_host_index_#{application_id}"
      current_host = Thread.current[thread_index_key].to_i # `to_i` to ensure first call is 0
      # we want to always target host 0 first
      # if the current host is not 0, then we want to use it first only if (we never used it OR we're using it since less than 1 minute)
      if current_host != 0 && (hosts[current_host][:last_call].nil? || hosts[current_host][:last_call] > Time.now.to_i - 60)
        # first host will be `current_host`
        first = hosts[current_host]
        [first] + hosts.reject { |h| h[:index] == 0 || h == first } + hosts.select { |h| h[:index] == 0 }
      else
        # first host will be `0`
        hosts
      end
    end

    def perform_request(session, url, method, data, request_options)
      hs = {}
      extra_headers = request_options[:headers] || request_options['headers'] || {}
      @headers.each { |key, val| hs[key.to_s] = val }
      extra_headers.each { |key, val| hs[key.to_s] = val }
      response = case method
      when :GET
        session.get(url, { :header => hs })
      when :POST
        session.post(url, { :body => data, :header => hs })
      when :PUT
        session.put(url, { :body => data, :header => hs })
      when :DELETE
        session.delete(url, { :header => hs })
      end
      if response.code / 100 != 2
        raise AlgoliaProtocolError.new(response.code, "Cannot #{method} to #{url}: #{response.content} (#{response.code})")
      end
      return JSON.parse(response.content)
    end

    def add_header_to_request_options(request_options, headers_to_add)
      if !request_options['headers'].is_a?(Hash)
        if request_options[:headers].is_a?(Hash)
          request_options['headers'] = request_options[:headers]
          request_options.delete(:headers)
        else
          request_options['headers'] = {}
        end
      end

      request_options['headers'].merge!(headers_to_add)
      request_options
    end

    # Deprecated
    alias_method :list_user_keys, :list_api_keys
    alias_method :get_user_key, :get_api_key
    alias_method :add_user_key, :add_api_key
    alias_method :update_user_key, :update_api_key
    alias_method :delete_user_key, :delete_api_key
  end

  # Module methods
  # ------------------------------------------------------------

  # A singleton client
  # Always use Algolia.client to retrieve the client object.
  @@client = nil

  #
  # Initialize the singleton instance of Client which is used by all API methods
  #
  def Algolia.init(options = {})
    application_id = ENV['ALGOLIA_APP_ID'] || ENV['ALGOLIA_API_ID'] || ENV['ALGOLIA_APPLICATION_ID']
    api_key = ENV['ALGOLIA_REST_API_KEY'] || ENV['ALGOLIA_API_KEY']

    defaulted = { :application_id => application_id, :api_key => api_key }
    defaulted.merge!(options)

    @@client = Client.new(defaulted)
  end

  #
  # Allow to set custom headers
  #
  def Algolia.set_extra_header(key, value)
    Algolia.client.set_extra_header(key, value)
  end

  #
  # Allow to use IP rate limit when you have a proxy between end-user and Algolia.
  # This option will set the X-Forwarded-For HTTP header with the client IP and the
  # X-Forwarded-API-Key with the API Key having rate limits.
  #
  # @param admin_api_key the admin API Key you can find in your dashboard
  # @param end_user_ip the end user IP (you can use both IPV4 or IPV6 syntax)
  # @param rate_limit_api_key the API key on which you have a rate limit
  #
  def Algolia.enable_rate_limit_forward(admin_api_key, end_user_ip, rate_limit_api_key)
    Algolia.client.enable_rate_limit_forward(admin_api_key, end_user_ip, rate_limit_api_key)
  end

  #
  # Disable IP rate limit enabled with enableRateLimitForward() function
  #
  def Algolia.disable_rate_limit_forward
    Algolia.client.disable_rate_limit_forward
  end

  #
  # Convenience method thats wraps enable_rate_limit_forward/disable_rate_limit_forward
  #
  def Algolia.with_rate_limits(end_user_ip, rate_limit_api_key, &block)
    Algolia.client.with_rate_limits(end_user_ip, rate_limit_api_key, &block)
  end

  #
  # Generate a secured and public API Key from a list of tagFilters and an
  # optional user token identifying the current user
  #
  # @param private_api_key your private API Key
  # @param tag_filters the list of tags applied to the query (used as security)
  # @param user_token an optional token identifying the current user
  #
  def Algolia.generate_secured_api_key(private_api_key, tag_filters_or_params, user_token = nil)
    if tag_filters_or_params.is_a?(Hash) && user_token.nil?
      encoded_params = Hash[tag_filters_or_params.map { |k, v| [k.to_s, v.is_a?(Array) ? v.to_json : v] }]
      query_str = Protocol.to_query(encoded_params)
      hmac = OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha256'), private_api_key, query_str)
      Base64.encode64("#{hmac}#{query_str}").gsub("\n", '')
    else
      tag_filters = if tag_filters_or_params.is_a?(Array)
        tag_filters = tag_filters_or_params.map { |t| t.is_a?(Array) ? "(#{t.join(',')})" : t }.join(',')
      else
        tag_filters_or_params
      end
      raise ArgumentError.new('Attribute "tag_filters" must be a list of tags') if !tag_filters.is_a?(String)
      OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha256'), private_api_key, "#{tag_filters}#{user_token.to_s}")
    end
  end

  #
  # Returns the remaining validity time for the given API key in seconds
  #
  # @param [String] secured_api_key the secured API key to check
  #
  # @return [Integer] remaining validity in seconds
  #
  def Algolia.get_secured_api_key_remaining_validity(secured_api_key)
    now = Time.now.to_i
    decoded_key = Base64.decode64(secured_api_key)
    regex = 'validUntil=(\d+)'
    matches = decoded_key.match(regex)

    if matches === nil
      raise ValidUntilNotFoundError.new('The SecuredAPIKey doesn\'t have a validUntil parameter.')
    end

    valid_until = matches[1].to_i

    valid_until - now
  end

  #
  # This method allows to query multiple indexes with one API call
  #
  def Algolia.multiple_queries(queries, options = nil, strategy = nil)
    Algolia.client.multiple_queries(queries, options, strategy)
  end

  #
  # This method allows to get objects (records) via objectID across
  # multiple indexes with one API call
  #
  def Algolia.multiple_get_objects(requests, request_options = {})
    Algolia.client.multiple_get_objects(requests, request_options)
  end

  #
  # List all existing indexes
  # return an Answer object with answer in the form
  #     {"items": [{ "name": "contacts", "createdAt": "2013-01-18T15:33:13.556Z"},
  #                {"name": "notes", "createdAt": "2013-01-18T15:33:13.556Z"}]}
  #
  # @param request_options contains extra parameters to send with your query
  #
  def Algolia.list_indexes(request_options = {})
    Algolia.client.list_indexes(request_options)
  end

  #
  # Move an existing index.
  #
  # @param src_index the name of index to copy.
  # @param dst_index the new index name that will contains a copy of src_index_name (destination will be overriten if it already exist).
  # @param request_options contains extra parameters to send with your query
  #
  def Algolia.move_index(src_index, dst_index, request_options = {})
    Algolia.client.move_index(src_index, dst_index, request_options)
  end

  #
  # Move an existing index and wait until the move has been processed
  #
  # @param src_index the name of index to copy.
  # @param dst_index the new index name that will contains a copy of src_index_name (destination will be overriten if it already exist).
  # @param request_options contains extra parameters to send with your query
  #
  def Algolia.move_index!(src_index, dst_index, request_options = {})
    Algolia.client.move_index!(src_index, dst_index, request_options)
  end

  #
  # Copy an existing index.
  #
  # @param src_index the name of index to copy.
  # @param dst_index the new index name that will contains a copy of src_index_name (destination will be overriten if it already exist).
  # @param scope the optional list of scopes to copy (all if not specified).
  # @param request_options contains extra parameters to send with your query
  #
  def Algolia.copy_index(src_index, dst_index, scope = nil, request_options = {})
    Algolia.client.copy_index(src_index, dst_index, scope, request_options)
  end

  #
  # Copy an existing index and wait until the copy has been processed.
  #
  # @param src_index the name of index to copy.
  # @param dst_index the new index name that will contains a copy of src_index_name (destination will be overriten if it already exist).
  # @param scope the optional list of scopes to copy (all if not specified).
  # @param request_options contains extra parameters to send with your query
  #
  def Algolia.copy_index!(src_index, dst_index, scope = nil, request_options = {})
    Algolia.client.copy_index!(src_index, dst_index, scope, request_options)
  end

  #
  # Copy an existing index settings.
  #
  # @param src_index the name of index to copy.
  # @param dst_index the new index name that will contains a copy of src_index_name settings (destination settings will be overriten if it already exist).
  # @param request_options contains extra parameters to send with your query
  #
  def Algolia.copy_settings(src_index, dst_index, request_options = {})
    Algolia.client.copy_settings(src_index, dst_index, request_options)
  end

  #
  # Copy an existing index settings and wait until the copy has been processed.
  #
  # @param src_index the name of index to copy.
  # @param dst_index the new index name that will contains a copy of src_index_name settings (destination settings will be overriten if it already exist).
  # @param request_options contains extra parameters to send with your query
  #
  def Algolia.copy_settings!(src_index, dst_index, request_options = {})
    Algolia.client.copy_settings!(src_index, dst_index, request_options)
  end

  #
  # Copy an existing index synonyms.
  #
  # @param src_index the name of index to copy.
  # @param dst_index the new index name that will contains a copy of src_index_name synonyms (destination synonyms will be overriten if it already exist).
  # @param request_options contains extra parameters to send with your query
  #
  def Algolia.copy_synonyms(src_index, dst_index, request_options = {})
    Algolia.client.copy_synonyms(src_index, dst_index, request_options)
  end

  #
  # Copy an existing index synonyms and wait until the copy has been processed.
  #
  # @param src_index the name of index to copy.
  # @param dst_index the new index name that will contains a copy of src_index_name synonyms (destination synonyms will be overriten if it already exist).
  # @param request_options contains extra parameters to send with your query
  #
  def Algolia.copy_synonyms!(src_index, dst_index, request_options = {})
    Algolia.client.copy_synonyms!(src_index, dst_index, request_options)
  end

  #
  # Copy an existing index rules.
  #
  # @param src_index the name of index to copy.
  # @param dst_index the new index name that will contains a copy of src_index_name rules (destination rules will be overriten if it already exist).
  # @param request_options contains extra parameters to send with your query
  #
  def Algolia.copy_rules(src_index, dst_index, request_options = {})
    Algolia.client.copy_rules(src_index, dst_index, request_options)
  end

  #
  # Copy an existing index rules and wait until the copy has been processed.
  #
  # @param src_index the name of index to copy.
  # @param dst_index the new index name that will contains a copy of src_index_name rules (destination rules will be overriten if it already exist).
  # @param request_options contains extra parameters to send with your query
  #
  def Algolia.copy_rules!(src_index, dst_index, request_options = {})
    Algolia.client.copy_rules!(src_index, dst_index, request_options)
  end

  #
  # Delete an index
  #
  def Algolia.delete_index(name, request_options = {})
    Algolia.client.delete_index(name, request_options)
  end

  #
  # Delete an index and wait until the deletion has been processed.
  #
  def Algolia.delete_index!(name, request_options = {})
    Algolia.client.delete_index!(name, request_options)
  end

  #
  # Return last logs entries.
  #
  # @param offset Specify the first entry to retrieve (0-based, 0 is the most recent log entry).
  # @param length Specify the maximum number of entries to retrieve starting at offset. Maximum allowed value: 1000.
  # @param type Specify the type of entries you want to retrieve - default: "all"
  # @param request_options contains extra parameters to send with your query
  #
  def Algolia.get_logs(options = nil, length = nil, type = nil)
    Algolia.client.get_logs(options, length, type)
  end

  #
  # List all existing user keys with their associated ACLs
  #
  # @param request_options contains extra parameters to send with your query
  #
  def Algolia.list_api_keys(request_options = {})
    Algolia.client.list_api_keys(request_options)
  end

  #
  # Deprecated
  #
  def Algolia.list_user_keys(request_options = {})
    Algolia.client.list_api_keys(request_options)
  end

  #
  # Get ACL of a user key
  #
  # @param request_options contains extra parameters to send with your query
  #
  def Algolia.get_api_key(key, request_options = {})
    Algolia.client.get_api_key(key, request_options)
  end

  #
  # Deprecated
  #
  def Algolia.get_user_key(key, request_options = {})
    Algolia.client.get_user_key(key, request_options)
  end

  #
  #  Create a new user key
  #
  #  Deprecated call was add_api_key(acl, validity, max_queries_per_IP_per_hour, max_hits_per_query, indexes)
  #
  #  ACL can contain an array with those strings:
  #    - search: allow to search (https and http)
  #    - addObject: allows to add/update an object in the index (https only)
  #    - deleteObject : allows to delete an existing object (https only)
  #    - deleteIndex : allows to delete index content (https only)
  #    - settings : allows to get index settings (https only)
  #    - editSettings : allows to change index settings (https only)
  #
  #  @param object can be two different parameters:
  #        The list of parameters for this key. Defined by a NSDictionary that
  #        can contains the following values:
  #          - acl: array of string
  #          - indexes: array of string
  #          - validity: int
  #          - referers: array of string
  #          - description: string
  #          - max_hits_per_query: integer
  #          - queryParameters: string
  #          - max_queries_per_IP_per_hour: integer
  #  @param request_options contains extra parameters to send with your query - Default = {}
  #
  def Algolia.add_api_key(object, request_options = {}, max_queries_per_IP_per_hour = 0, max_hits_per_query = 0, indexes = nil)
    Algolia.client.add_api_key(object, request_options, max_queries_per_IP_per_hour, max_hits_per_query, indexes)
  end

  #
  # Deprecated
  #
  def Algolia.add_user_key(object, request_options = {}, max_queries_per_IP_per_hour = 0, max_hits_per_query = 0, indexes = nil)
    Algolia.client.add_api_key(object, request_options, max_queries_per_IP_per_hour, max_hits_per_query, indexes)
  end

  #
  #  Update a user key
  #
  #  Deprecated call was update_api_key(key, acl, validity, maxQueriesPerIPPerHour, max_hits_per_query, indexes)
  #
  #  ACL can contain an array with those strings:
  #    - search: allow to search (https and http)
  #    - addObject: allows to add/update an object in the index (https only)
  #    - deleteObject : allows to delete an existing object (https only)
  #    - deleteIndex : allows to delete index content (https only)
  #    - settings : allows to get index settings (https only)
  #    - editSettings : allows to change index settings (https only)
  #
  #  @param key API Key to update
  #  @param object The list of parameters for this key.
  #         Defined by a Hash that can contain the following values:
  #          - acl: array of string
  #          - indexes: array of string
  #          - validity: int
  #          - referers: array of string
  #          - description: string
  #          - max_hits_per_query: integer
  #          - queryParameters: string
  #          - max_queries_per_IP_per_hour: integer
  #  @param request_options contains extra parameters to send with your query - Default = {}
  #
  def Algolia.update_api_key(key, object, request_options = {}, max_queries_per_IP_per_hour = 0, max_hits_per_query = 0, indexes = nil)
    Algolia.client.update_api_key(key, object, request_options, max_queries_per_IP_per_hour, max_hits_per_query, indexes)
  end

  #
  # Deprecated
  #
  def Algolia.update_user_key(key, object, request_options = {}, max_queries_per_IP_per_hour = 0, max_hits_per_query = 0, indexes = nil)
    Algolia.client.update_api_key(key, object, request_options, max_queries_per_IP_per_hour, max_hits_per_query, indexes)
  end

  #
  # Delete an existing user key
  #
  def Algolia.delete_api_key(key, request_options = {})
    Algolia.client.delete_api_key(key, request_options)
  end

  #
  # Restore an existing api key
  #
  def Algolia.restore_api_key(key, request_options = {})
    Algolia.client.restore_api_key(key, request_options)
  end

  #
  # Deprecated
  #
  def Algolia.delete_user_key(key, request_options = {})
    Algolia.client.delete_api_key(key, request_options)
  end

  #
  # Send a batch request targeting multiple indices
  #
  def Algolia.batch(requests, request_options = {})
    Algolia.client.batch(requests, request_options)
  end

  #
  # Send a batch request targeting multiple indices and wait the end of the indexing
  #
  def Algolia.batch!(requests, request_options = {})
    Algolia.client.batch!(requests, request_options)
  end

  #
  # Wait until task is completed by the engine
  #
  def Algolia.wait_task(index_name, taskID, time_before_retry = WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options = {})
    Algolia.client.wait_task(index_name, taskID, time_before_retry, request_options)
  end

  def Algolia.get_task_status(index_name, taskID, request_options = {})
    Algolia.client.get_task_status(index_name, taskID, request_options = {})
  end
  #
  # Used mostly for testing. Lets you delete the api key global vars.
  #
  def Algolia.destroy
    @@client.destroy unless @@client.nil?
    @@client = nil
    self
  end

  def Algolia.client
    if !@@client
      raise AlgoliaError, 'API not initialized'
    end
    @@client
  end

end
