require 'algolia/client'
require 'algolia/error'

module Algolia

  class Index
    attr_accessor :name, :client

    def initialize(name, client = nil)
      self.name = name
      self.client = client || Algolia.client
    end

    #
    # Delete an index
    #
    # @param request_options contains extra parameters to send with your query
    #
    # return an hash of the form { "deletedAt" => "2013-01-18T15:33:13.556Z", "taskID" => "42" }
    #
    def delete(request_options = {})
      client.delete(Protocol.index_uri(name), :write, request_options)
    end
    alias_method :delete_index, :delete

    #
    # Delete an index and wait until the deletion has been processed
    #
    # @param request_options contains extra parameters to send with your query
    #
    # return an hash of the form { "deletedAt" => "2013-01-18T15:33:13.556Z", "taskID" => "42" }
    #
    def delete!(request_options = {})
      res = delete(request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end
    alias_method :delete_index!, :delete!

    #
    # Add an object in this index
    #
    # @param object the object to add to the index.
    #  The object is represented by an associative array
    # @param objectID (optional) an objectID you want to attribute to this object
    #  (if the attribute already exist the old object will be overridden)
    # @param request_options contains extra parameters to send with your query
    #
    def add_object(object, objectID = nil, request_options = {})
      check_object(object)
      if objectID.nil? || objectID.to_s.empty?
        client.post(Protocol.index_uri(name), object.to_json, :write, request_options)
      else
        client.put(Protocol.object_uri(name, objectID), object.to_json, :write, request_options)
      end
    end

    #
    # Add an object in this index and wait end of indexing
    #
    # @param object the object to add to the index.
    #  The object is represented by an associative array
    # @param objectID (optional) an objectID you want to attribute to this object
    #  (if the attribute already exist the old object will be overridden)
    # @param Request options object. Contains extra URL parameters or headers
    #
    def add_object!(object, objectID = nil, request_options = {})
      res = add_object(object, objectID, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Add several objects in this index
    #
    # @param objects the array of objects to add inside the index.
    #  Each object is represented by an associative array
    # @param request_options contains extra parameters to send with your query
    #
    def add_objects(objects, request_options = {})
      batch(build_batch('addObject', objects, false), request_options)
    end

    #
    # Add several objects in this index and wait end of indexing
    #
    # @param objects the array of objects to add inside the index.
    #  Each object is represented by an associative array
    # @param request_options contains extra parameters to send with your query
    #
    def add_objects!(objects, request_options = {})
      res = add_objects(objects, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Search inside the index
    #
    # @param query the full text query
    # @param args (optional) if set, contains an associative array with query parameters:
    # - page: (integer) Pagination parameter used to select the page to retrieve.
    #                   Page is zero-based and defaults to 0. Thus, to retrieve the 10th page you need to set page=9
    # - hitsPerPage: (integer) Pagination parameter used to select the number of hits per page. Defaults to 20.
    # - attributesToRetrieve: a string that contains the list of object attributes you want to retrieve (let you minimize the answer size).
    #   Attributes are separated with a comma (for example "name,address").
    #   You can also use a string array encoding (for example ["name","address"]).
    #   By default, all attributes are retrieved. You can also use '*' to retrieve all values when an attributesToRetrieve setting is specified for your index.
    # - attributesToHighlight: a string that contains the list of attributes you want to highlight according to the query.
    #   Attributes are separated by a comma. You can also use a string array encoding (for example ["name","address"]).
    #   If an attribute has no match for the query, the raw value is returned. By default all indexed text attributes are highlighted.
    #   You can use `*` if you want to highlight all textual attributes. Numerical attributes are not highlighted.
    #   A matchLevel is returned for each highlighted attribute and can contain:
    #      - full: if all the query terms were found in the attribute,
    #      - partial: if only some of the query terms were found,
    #      - none: if none of the query terms were found.
    # - attributesToSnippet: a string that contains the list of attributes to snippet alongside the number of words to return (syntax is `attributeName:nbWords`).
    #    Attributes are separated by a comma (Example: attributesToSnippet=name:10,content:10).
    #    You can also use a string array encoding (Example: attributesToSnippet: ["name:10","content:10"]). By default no snippet is computed.
    # - minWordSizefor1Typo: the minimum number of characters in a query word to accept one typo in this word. Defaults to 3.
    # - minWordSizefor2Typos: the minimum number of characters in a query word to accept two typos in this word. Defaults to 7.
    # - getRankingInfo: if set to 1, the result hits will contain ranking information in _rankingInfo attribute.
    # - aroundLatLng: search for entries around a given latitude/longitude (specified as two floats separated by a comma).
    #   For example aroundLatLng=47.316669,5.016670).
    #   You can specify the maximum distance in meters with the aroundRadius parameter (in meters) and the precision for ranking with aroundPrecision
    #   (for example if you set aroundPrecision=100, two objects that are distant of less than 100m will be considered as identical for "geo" ranking parameter).
    #   At indexing, you should specify geoloc of an object with the _geoloc attribute (in the form {"_geoloc":{"lat":48.853409, "lng":2.348800}})
    # - insideBoundingBox: search entries inside a given area defined by the two extreme points of a rectangle (defined by 4 floats: p1Lat,p1Lng,p2Lat,p2Lng).
    #   For example insideBoundingBox=47.3165,4.9665,47.3424,5.0201).
    #   At indexing, you should specify geoloc of an object with the _geoloc attribute (in the form {"_geoloc":{"lat":48.853409, "lng":2.348800}})
    # - numericFilters: a string that contains the list of numeric filters you want to apply separated by a comma.
    #   The syntax of one filter is `attributeName` followed by `operand` followed by `value`. Supported operands are `<`, `<=`, `=`, `>` and `>=`.
    #   You can have multiple conditions on one attribute like for example numericFilters=price>100,price<1000.
    #   You can also use a string array encoding (for example numericFilters: ["price>100","price<1000"]).
    # - tagFilters: filter the query by a set of tags. You can AND tags by separating them by commas.
    #   To OR tags, you must add parentheses. For example, tags=tag1,(tag2,tag3) means tag1 AND (tag2 OR tag3).
    #   You can also use a string array encoding, for example tagFilters: ["tag1",["tag2","tag3"]] means tag1 AND (tag2 OR tag3).
    #   At indexing, tags should be added in the _tags** attribute of objects (for example {"_tags":["tag1","tag2"]}).
    # - facetFilters: filter the query by a list of facets.
    #   Facets are separated by commas and each facet is encoded as `attributeName:value`.
    #   For example: `facetFilters=category:Book,author:John%20Doe`.
    #   You can also use a string array encoding (for example `["category:Book","author:John%20Doe"]`).
    # - facets: List of object attributes that you want to use for faceting.
    #   Attributes are separated with a comma (for example `"category,author"` ).
    #   You can also use a JSON string array encoding (for example ["category","author"]).
    #   Only attributes that have been added in **attributesForFaceting** index setting can be used in this parameter.
    #   You can also use `*` to perform faceting on all attributes specified in **attributesForFaceting**.
    # - queryType: select how the query words are interpreted, it can be one of the following value:
    #    - prefixAll: all query words are interpreted as prefixes,
    #    - prefixLast: only the last word is interpreted as a prefix (default behavior),
    #    - prefixNone: no query word is interpreted as a prefix. This option is not recommended.
    # - optionalWords: a string that contains the list of words that should be considered as optional when found in the query.
    #   The list of words is comma separated.
    # - distinct: If set to 1, enable the distinct feature (disabled by default) if the attributeForDistinct index setting is set.
    #   This feature is similar to the SQL "distinct" keyword: when enabled in a query with the distinct=1 parameter,
    #   all hits containing a duplicate value for the attributeForDistinct attribute are removed from results.
    #   For example, if the chosen attribute is show_name and several hits have the same value for show_name, then only the best
    #   one is kept and others are removed.
    # @param request_options contains extra parameters to send with your query
    #
    def search(query, params = {}, request_options = {})
      encoded_params = Hash[params.map { |k, v| [k.to_s, v.is_a?(Array) ? v.to_json : v] }]
      encoded_params[:query] = query
      client.post(Protocol.search_post_uri(name), { :params => Protocol.to_query(encoded_params) }.to_json, :search, request_options)
    end

    class IndexBrowser
      def initialize(client, name, params)
        @client = client
        @name = name
        @params = params
        @cursor = params[:cursor] || params['cursor'] || nil
      end

      def browse(request_options = {}, &block)
        loop do
          answer = @client.get(Protocol.browse_uri(@name, @params.merge({ :cursor => @cursor })), :read, request_options)
          answer['hits'].each do |hit|
            if block.arity == 2
              yield hit, @cursor
            else
              yield hit
            end
          end
          @cursor = answer['cursor']
          break if @cursor.nil?
        end
      end
    end

    #
    # Browse all index content
    #
    # @param queryParameters The hash of query parameters to use to browse
    #                        To browse from a specific cursor, just add a ":cursor" parameters
    # @param queryParameters An optional second parameters hash here for backward-compatibility (which will be merged with the first)
    # @param request_options contains extra parameters to send with your query
    #
    # @DEPRECATED:
    # @param page Pagination parameter used to select the page to retrieve.
    # @param hits_per_page Pagination parameter used to select the number of hits per page. Defaults to 1000.
    #
    def browse(page_or_query_parameters = nil, hits_per_page = nil, request_options = {}, &block)
      params = {}
      if page_or_query_parameters.is_a?(Hash)
        params.merge!(page_or_query_parameters)
      else
        params[:page] = page_or_query_parameters unless page_or_query_parameters.nil?
      end
      if hits_per_page.is_a?(Hash)
        params.merge!(hits_per_page)
      else
        params[:hitsPerPage] = hits_per_page unless hits_per_page.nil?
      end

      if block_given?
        IndexBrowser.new(client, name, params).browse(request_options, &block)
      else
        params[:page] ||= 0
        params[:hitsPerPage] ||= 1000
        client.get(Protocol.browse_uri(name, params), :read, request_options)
      end
    end

    #
    # Browse a single page from a specific cursor
    #
    # @param request_options contains extra parameters to send with your query
    #
    def browse_from(cursor, hits_per_page = 1000, request_options = {})
      client.post(Protocol.browse_uri(name), { :cursor => cursor, :hitsPerPage => hits_per_page }.to_json, :read, request_options)
    end

    #
    # Get an object from this index
    #
    # @param objectID the unique identifier of the object to retrieve
    # @param attributes_to_retrieve (optional) if set, contains the list of attributes to retrieve as an array of strings of a string separated by ","
    # @param request_options contains extra parameters to send with your query
    #
    def get_object(objectID, attributes_to_retrieve = nil, request_options = {})
      attributes_to_retrieve = attributes_to_retrieve.join(',') if attributes_to_retrieve.is_a?(Array)
      if attributes_to_retrieve.nil?
        client.get(Protocol.object_uri(name, objectID, nil), :read, request_options)
      else
        client.get(Protocol.object_uri(name, objectID, { :attributes => attributes_to_retrieve }), :read, request_options)
      end
    end

    #
    # Get a list of objects from this index
    #
    # @param objectIDs the array of unique identifier of the objects to retrieve
    # @param attributes_to_retrieve (optional) if set, contains the list of attributes to retrieve as an array of strings of a string separated by ","
    # @param request_options contains extra parameters to send with your query
    #
    def get_objects(objectIDs, attributes_to_retrieve = nil, request_options = {})
      attributes_to_retrieve = attributes_to_retrieve.join(',') if attributes_to_retrieve.is_a?(Array)
      requests = objectIDs.map do |objectID|
        req = { :indexName => name, :objectID => objectID.to_s }
        req[:attributesToRetrieve] = attributes_to_retrieve unless attributes_to_retrieve.nil?
        req
      end
      client.post(Protocol.objects_uri, { :requests => requests }.to_json, :read, request_options)['results']
    end

    #
    # Find object by the given condition.
    #
    # Options can be passed in request_options body:
    #  - query (string): pass a query
    #  - paginate (bool): choose if you want to iterate through all the
    # documents (true) or only the first page (false). Default is true.
    # The function takes a block to filter the results from search query
    # Usage example:
    #  index.find_object({'query' => '', 'paginate' => true}) {|obj| obj.key?('company') and obj['company'] == 'Apple'}
    #
    # @param request_options contains extra parameters to send with your query
    #
    # @return [Hash] the matching object and its position in the result set
    #
    def find_object(request_options = {})
      paginate = true
      page = 0

      query = request_options[:query] || request_options['query'] || ''
      request_options.delete(:query)
      request_options.delete('query')

      if request_options.has_key? :paginate
        paginate = request_options[:paginate]
      end

      if request_options.has_key? 'paginate'
        paginate = request_options['paginate']
      end

      request_options.delete(:paginate)
      request_options.delete('paginate')

      while true
        request_options['page'] = page
        res = search(query, request_options)

        res['hits'].each_with_index do |hit, i|
          if yield(hit)
            return {
                'object' => hit,
                'position' => i,
                'page' => page,
            }
          end
        end if block_given?

        has_next_page = page + 1 < res['nbPages']
        if !paginate || !has_next_page
          raise AlgoliaObjectNotFoundError.new('Object not found')
        end

        page += 1
      end
    end

    #
    # Retrieve the given object position in a set of results.
    #
    # @param [Array] objects the result set to browse
    # @param [String] object_id the object to look for
    #
    # @return [Integer] position of the object, or -1 if it's not in the array
    #
    def self.get_object_position(objects, object_id)
      objects['hits'].find_index { |hit| hit['objectID'] == object_id } || -1
    end

    #
    # Check the status of a task on the server.
    # All server task are asynchronous and you can check the status of a task with this method.
    #
    # @param taskID the id of the task returned by server
    # @param request_options contains extra parameters to send with your query
    #
    def get_task_status(taskID, request_options = {})
      client.get_task_status(name, taskID, request_options)
    end

    #
    # Wait the publication of a task on the server.
    # All server task are asynchronous and you can check with this method that the task is published.
    #
    # @param taskID the id of the task returned by server
    # @param time_before_retry the time in milliseconds before retry (default = 100ms)
    # @param request_options contains extra parameters to send with your query
    #
    def wait_task(taskID, time_before_retry = WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options = {})
      client.wait_task(name, taskID, time_before_retry, request_options)
    end

    #
    # Override the content of an object
    #
    # @param object the object to save
    # @param objectID the associated objectID, if nil 'object' must contain an 'objectID' key
    # @param request_options contains extra parameters to send with your query
    #
    def save_object(object, objectID = nil, request_options = {})
      client.put(Protocol.object_uri(name, get_objectID(object, objectID)), object.to_json, :write, request_options)
    end

    #
    # Override the content of object and wait end of indexing
    #
    # @param object the object to save
    # @param objectID the associated objectID, if nil 'object' must contain an 'objectID' key
    # @param request_options contains extra parameters to send with your query
    #
    def save_object!(object, objectID = nil, request_options = {})
      res = save_object(object, objectID, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Override the content of several objects
    #
    # @param objects the array of objects to save, each object must contain an 'objectID' key
    # @param request_options contains extra parameters to send with your query
    #
    def save_objects(objects, request_options = {})
      batch(build_batch('updateObject', objects, true), request_options)
    end

    #
    # Override the content of several objects and wait end of indexing
    #
    # @param objects the array of objects to save, each object must contain an objectID attribute
    # @param request_options contains extra parameters to send with your query
    #
    def save_objects!(objects, request_options = {})
      res = save_objects(objects, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Override the current objects by the given array of objects and wait end of indexing. Settings,
    # synonyms and query rules are untouched. The objects are replaced without any downtime.
    #
    # @param objects the array of objects to save
    # @param request_options contains extra parameters to send with your query
    #
    def replace_all_objects(objects, request_options = {})
      safe = request_options[:safe] || request_options['safe'] || false
      request_options.delete(:safe)
      request_options.delete('safe')

      tmp_index = @client.init_index(@name + '_tmp_' + rand(10000000).to_s)

      responses = []

      scope = ['settings', 'synonyms', 'rules']
      res = @client.copy_index(@name, tmp_index.name, scope, request_options)
      responses << res

      if safe
        wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      end

      batch = []
      batch_size = 1000
      count = 0

      objects.each do |object|
        batch << object
        count += 1
        if count == batch_size
          res = tmp_index.add_objects(batch, request_options)
          responses << res
          batch = []
          count = 0
        end
      end

      if batch.any?
        res = tmp_index.add_objects(batch, request_options)
        responses << res
      end

      if safe
        responses.each do |res|
          tmp_index.wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
        end
      end

      res = @client.move_index(tmp_index.name, @name, request_options)
      responses << res

      if safe
        wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      end

      responses
    end

    #
    # Override the current objects by the given array of objects and wait end of indexing
    #
    # @param objects the array of objects to save
    # @param request_options contains extra parameters to send with your query
    #
    def replace_all_objects!(objects, request_options = {})
      replace_all_objects(objects, request_options.merge(:safe => true))
    end

    #
    # Update partially an object (only update attributes passed in argument)
    #
    # @param object the object attributes to override
    # @param objectID the associated objectID, if nil 'object' must contain an 'objectID' key
    # @param create_if_not_exits a boolean, if true creates the object if this one doesn't exist
    # @param request_options contains extra parameters to send with your query
    #
    def partial_update_object(object, objectID = nil, create_if_not_exits = true, request_options = {})
      client.post(Protocol.partial_object_uri(name, get_objectID(object, objectID), create_if_not_exits), object.to_json, :write, request_options)
    end

    #
    # Partially override the content of several objects
    #
    # @param objects an array of objects to update (each object must contains a objectID attribute)
    # @param create_if_not_exits a boolean, if true create the objects if they don't exist
    # @param request_options contains extra parameters to send with your query
    #
    def partial_update_objects(objects, create_if_not_exits = true, request_options = {})
      if create_if_not_exits
        batch(build_batch('partialUpdateObject', objects, true), request_options)
      else
        batch(build_batch('partialUpdateObjectNoCreate', objects, true), request_options)
      end
    end

    #
    # Partially override the content of several objects and wait end of indexing
    #
    # @param objects an array of objects to update (each object must contains a objectID attribute)
    # @param create_if_not_exits a boolean, if true create the objects if they don't exist
    # @param request_options contains extra parameters to send with your query
    #
    def partial_update_objects!(objects, create_if_not_exits = true, request_options = {})
      res = partial_update_objects(objects, create_if_not_exits, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Update partially an object (only update attributes passed in argument) and wait indexing
    #
    # @param object the attributes to override
    # @param objectID the associated objectID, if nil 'object' must contain an 'objectID' key
    # @param create_if_not_exits a boolean, if true creates the object if this one doesn't exist
    # @param request_options contains extra parameters to send with your query
    #
    def partial_update_object!(object, objectID = nil, create_if_not_exits = true, request_options = {})
      res = partial_update_object(object, objectID, create_if_not_exits, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Delete an object from the index
    #
    # @param objectID the unique identifier of object to delete
    # @param request_options contains extra parameters to send with your query
    #
    def delete_object(objectID, request_options = {})
      raise ArgumentError.new('objectID must not be blank') if objectID.nil? || objectID == ''
      client.delete(Protocol.object_uri(name, objectID), :write, request_options)
    end

    #
    # Delete an object from the index and wait end of indexing
    #
    # @param objectID the unique identifier of object to delete
    # @param request_options contains extra parameters to send with your query
    #
    def delete_object!(objectID, request_options = {})
      res = delete_object(objectID, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Delete several objects
    #
    # @param objects an array of objectIDs
    # @param request_options contains extra parameters to send with your query
    #
    def delete_objects(objects, request_options = {})
      check_array(objects)
      batch(build_batch('deleteObject', objects.map { |objectID| { :objectID => objectID } }, false), request_options)
    end

    #
    # Delete several objects and wait end of indexing
    #
    # @param objects an array of objectIDs
    # @param request_options contains extra parameters to send with your query
    #
    def delete_objects!(objects, request_options = {})
      res = delete_objects(objects, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Delete all objects matching a query
    # This method retrieves all objects synchronously but deletes in batch
    # asynchronously
    #
    # @param query the query string
    # @param params the optional query parameters
    # @param request_options contains extra parameters to send with your query
    #
    def delete_by_query(query, params = nil, request_options = {})
      raise ArgumentError.new('query cannot be nil, use the `clear` method to wipe the entire index') if query.nil? && params.nil?
      params = sanitized_delete_by_query_params(params)

      params[:query] = query
      params[:hitsPerPage] = 1000
      params[:distinct] = false
      params[:attributesToRetrieve] = ['objectID']
      params[:cursor] = ''
      ids = []

      while params[:cursor] != nil
        result = browse(params, nil, request_options)

        params[:cursor] = result['cursor']

        hits = result['hits']
        break if hits.empty?

        ids += hits.map { |hit| hit['objectID'] }
      end

      delete_objects(ids, request_options)
    end

    #
    # Delete all objects matching a query and wait end of indexing
    #
    # @param query the query string
    # @param params the optional query parameters
    # @param request_options contains extra parameters to send with your query
    #
    def delete_by_query!(query, params = nil, request_options = {})
      res = delete_by_query(query, params, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options) if res
      res
    end

    #
    # Delete all objects matching a query (doesn't work with actual text queries)
    # This method deletes every record matching the filters provided
    #
    # @param params query parameters
    # @param request_options contains extra parameters to send with your query
    #
    def delete_by(params, request_options = {})
      raise ArgumentError.new('params cannot be nil, use the `clear` method to wipe the entire index') if params.nil?
      params = sanitized_delete_by_query_params(params)
      client.post(Protocol.delete_by_uri(name), params.to_json, :write, request_options)
    end

    #
    # Delete all objects matching a query (doesn't work with actual text queries)
    # This method deletes every record matching the filters provided and waits for the end of indexing
    # @param params query parameters
    # @param request_options contains extra parameters to send with your query
    #
    def delete_by!(params, request_options = {})
      res = delete_by(params, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options) if res
      res
    end

    #
    # Delete the index content
    #
    # @param request_options contains extra parameters to send with your query
    #
    def clear(request_options = {})
      client.post(Protocol.clear_uri(name), {}, :write, request_options)
    end
    alias_method :clear_index, :clear

    #
    # Delete the index content and wait end of indexing
    #
    def clear!(request_options = {})
      res = clear(request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end
    alias_method :clear_index!, :clear!

    #
    # Set settings for this index
    #
    def set_settings(new_settings, options = {}, request_options = {})
      client.put(Protocol.settings_uri(name, options), new_settings.to_json, :write, request_options)
    end

    #
    # Set settings for this index and wait end of indexing
    #
    def set_settings!(new_settings, options = {}, request_options = {})
      res = set_settings(new_settings, options, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Get settings of this index
    #
    def get_settings(options = {}, request_options = {})
      options['getVersion'] = 2 if !options[:getVersion] && !options['getVersion']
      client.get(Protocol.settings_uri(name, options).to_s, :read, request_options)
    end

    #
    # List all existing user keys with their associated ACLs
    #
    # Deprecated: Please us `client.list_api_keys` instead.
    def list_api_keys(request_options = {})
      client.get(Protocol.index_keys_uri(name), :read, request_options)
    end

    #
    # Get ACL of a user key
    #
    # Deprecated: Please us `client.get_api_key` instead.
    def get_api_key(key, request_options = {})
      client.get(Protocol.index_key_uri(name, key), :read, request_options)
    end

    #
    #  Create a new user key
    #
    #  @param object can be two different parameters:
    #        The list of parameters for this key. Defined by a Hash that can
    #        contains the following values:
    #          - acl: array of string
    #          - validity: int
    #          - referers: array of string
    #          - description: string
    #          - maxHitsPerQuery: integer
    #          - queryParameters: string
    #          - maxQueriesPerIPPerHour: integer
    #        Or the list of ACL for this key. Defined by an array of String that
    #        can contains the following values:
    #          - search: allow to search (https and http)
    #          - addObject: allows to add/update an object in the index (https only)
    #          - deleteObject : allows to delete an existing object (https only)
    #          - deleteIndex : allows to delete index content (https only)
    #          - settings : allows to get index settings (https only)
    #          - editSettings : allows to change index settings (https only)
    #  @param validity the number of seconds after which the key will be automatically removed (0 means no time limit for this key)
    #  @param max_queries_per_IP_per_hour the maximum number of API calls allowed from an IP address per hour (0 means unlimited)
    #  @param max_hits_per_query the maximum number of hits this API key can retrieve in one call (0 means unlimited)
    #  @param request_options contains extra parameters to send with your query
    # 	# Deprecated: Please use `client.add_api_key` instead
    def add_api_key(object, validity = 0, max_queries_per_IP_per_hour = 0, max_hits_per_query = 0, request_options = {})
      if object.instance_of?(Array)
        params = { :acl => object }
      else
        params = object
      end

      params['validity'] = validity.to_i if validity != 0
      params['maxHitsPerQuery'] = max_hits_per_query.to_i if max_hits_per_query != 0
      params['maxQueriesPerIPPerHour'] = max_queries_per_IP_per_hour.to_i if max_queries_per_IP_per_hour != 0

      client.post(Protocol.index_keys_uri(name), params.to_json, :write, request_options)
    end

    #
    #  Update a user key
    #
    #  @param object can be two different parameters:
    #        The list of parameters for this key. Defined by a Hash that
    #        can contains the following values:
    #          - acl: array of string
    #          - validity: int
    #          - referers: array of string
    #          - description: string
    #          - maxHitsPerQuery: integer
    #          - queryParameters: string
    #          - maxQueriesPerIPPerHour: integer
    #        Or the list of ACL for this key. Defined by an array of String that
    #        can contains the following values:
    #          - search: allow to search (https and http)
    #          - addObject: allows to add/update an object in the index (https only)
    #          - deleteObject : allows to delete an existing object (https only)
    #          - deleteIndex : allows to delete index content (https only)
    #          - settings : allows to get index settings (https only)
    #          - editSettings : allows to change index settings (https only)
    #  @param validity the number of seconds after which the key will be automatically removed (0 means no time limit for this key)
    #  @param max_queries_per_IP_per_hour the maximum number of API calls allowed from an IP address per hour (0 means unlimited)
    #  @param max_hits_per_query  the maximum number of hits this API key can retrieve in one call (0 means unlimited)
    #  @param request_options contains extra parameters to send with your query
    #
	# Deprecated: Please use `client.update_api_key` instead
    def update_api_key(key, object, validity = 0, max_queries_per_IP_per_hour = 0, max_hits_per_query = 0, request_options = {})
      if object.instance_of?(Array)
        params = { :acl => object }
      else
        params = object
      end

      params['validity'] = validity.to_i if validity != 0
      params['maxHitsPerQuery'] = max_hits_per_query.to_i if max_hits_per_query != 0
      params['maxQueriesPerIPPerHour'] = max_queries_per_IP_per_hour.to_i if max_queries_per_IP_per_hour != 0

      client.put(Protocol.index_key_uri(name, key), params.to_json, :write, request_options)
    end

    #
    # Delete an existing user key
    #
    # Deprecated: Please use `client.delete_api_key` instead
    def delete_api_key(key, request_options = {})
      client.delete(Protocol.index_key_uri(name, key), :write, request_options)
    end

    #
    # Send a batch request
    #
    def batch(request, request_options = {})
      client.post(Protocol.batch_uri(name), request.to_json, :batch, request_options)
    end

    #
    # Send a batch request and wait the end of the indexing
    #
    def batch!(request, request_options = {})
      res = batch(request, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Search for facet values
    #
    # @param facet_name Name of the facet to search. It must have been declared in the
    #       index's`attributesForFaceting` setting with the `searchable()` modifier.
    # @param facet_query Text to search for in the facet's values
    # @param search_parameters An optional query to take extra search parameters into account.
    #       These parameters apply to index objects like in a regular search query.
    #       Only facet values contained in the matched objects will be returned.
    # @param request_options contains extra parameters to send with your query
    #
    def search_for_facet_values(facet_name, facet_query, search_parameters = {}, request_options = {})
      params = search_parameters.clone
      params['facetQuery'] = facet_query
      client.post(Protocol.search_facet_uri(name, facet_name), params.to_json, :read, request_options)
    end

    # deprecated
    alias_method :search_facet, :search_for_facet_values

    #
    # Perform a search with disjunctive facets generating as many queries as number of disjunctive facets
    #
    # @param query the query
    # @param disjunctive_facets the array of disjunctive facets
    # @param params a hash representing the regular query parameters
    # @param refinements a hash ("string" -> ["array", "of", "refined", "values"]) representing the current refinements
    #                    ex: { "my_facet1" => ["my_value1", ["my_value2"], "my_disjunctive_facet1" => ["my_value1", "my_value2"] }
    # @param request_options contains extra parameters to send with your query
    #
    def search_disjunctive_faceting(query, disjunctive_facets, params = {}, refinements = {}, request_options = {})
      raise ArgumentError.new('Argument "disjunctive_facets" must be a String or an Array') unless disjunctive_facets.is_a?(String) || disjunctive_facets.is_a?(Array)
      raise ArgumentError.new('Argument "refinements" must be a Hash of Arrays') if !refinements.is_a?(Hash) || !refinements.select { |k, v| !v.is_a?(Array) }.empty?

      # extract disjunctive facets & associated refinements
      disjunctive_facets = disjunctive_facets.split(',') if disjunctive_facets.is_a?(String)
      disjunctive_refinements = {}
      refinements.each do |k, v|
        disjunctive_refinements[k] = v if disjunctive_facets.include?(k) || disjunctive_facets.include?(k.to_s)
      end

      # build queries
      queries = []
      ## hits + regular facets query
      filters = []
      refinements.to_a.each do |k, values|
        r = values.map { |v| "#{k}:#{v}" }
        if disjunctive_refinements[k.to_s] || disjunctive_refinements[k.to_sym]
          # disjunctive refinements are ORed
          filters << r
        else
          # regular refinements are ANDed
          filters += r
        end
      end
      queries << params.merge({ :index_name => self.name, :query => query, :facetFilters => filters })
      ## one query per disjunctive facet (use all refinements but the current one + hitsPerPage=1 + single facet)
      disjunctive_facets.each do |disjunctive_facet|
        filters = []
        refinements.each do |k, values|
          if k.to_s != disjunctive_facet.to_s
            r = values.map { |v| "#{k}:#{v}" }
            if disjunctive_refinements[k.to_s] || disjunctive_refinements[k.to_sym]
              # disjunctive refinements are ORed
              filters << r
            else
              # regular refinements are ANDed
              filters += r
            end
          end
        end
        queries << params.merge({
          :index_name => self.name,
          :query => query,
          :page => 0,
          :hitsPerPage => 1,
          :attributesToRetrieve => [],
          :attributesToHighlight => [],
          :attributesToSnippet => [],
          :facets => disjunctive_facet,
          :facetFilters => filters,
          :analytics => false
        })
      end
      answers = client.multiple_queries(queries, { :request_options => request_options })

      # aggregate answers
      ## first answer stores the hits + regular facets
      aggregated_answer = answers['results'][0]
      ## others store the disjunctive facets
      aggregated_answer['disjunctiveFacets'] = {}
      answers['results'].each_with_index do |a, i|
        next if i == 0
        a['facets'].each do |facet, values|
          ## add the facet to the disjunctive facet hash
          aggregated_answer['disjunctiveFacets'][facet] = values
          ## concatenate missing refinements
          (disjunctive_refinements[facet.to_s] || disjunctive_refinements[facet.to_sym] || []).each do |r|
            if aggregated_answer['disjunctiveFacets'][facet][r].nil?
              aggregated_answer['disjunctiveFacets'][facet][r] = 0
            end
          end
        end
      end

      aggregated_answer
    end

    #
    # Alias of Algolia.list_indexes
    #
    # @param request_options contains extra parameters to send with your query
    #
    def Index.all(request_options = {})
      Algolia.list_indexes(request_options)
    end

    #
    # Search synonyms
    #
    # @param query the query
    # @param params an optional hash of :type, :page, :hitsPerPage
    # @param request_options contains extra parameters to send with your query
    #
    def search_synonyms(query, params = {}, request_options = {})
      type = params[:type] || params['type']
      type = type.join(',') if type.is_a?(Array)
      page = params[:page] || params['page'] || 0
      hits_per_page = params[:hitsPerPage] || params['hitsPerPage'] || 20
      params = {
        :query => query,
        :type => type.to_s,
        :page => page,
        :hitsPerPage => hits_per_page
      }
      client.post(Protocol.search_synonyms_uri(name), params.to_json, :read, request_options)
    end

    #
    # Get a synonym
    #
    # @param objectID the synonym objectID
    # @param request_options contains extra parameters to send with your query
    def get_synonym(objectID, request_options = {})
      client.get(Protocol.synonym_uri(name, objectID), :read, request_options)
    end

    #
    # Delete a synonym
    #
    # @param objectID the synonym objectID
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param request_options contains extra parameters to send with your query
    #
    def delete_synonym(objectID, forward_to_replicas = false, request_options = {})
      client.delete("#{Protocol.synonym_uri(name, objectID)}?forwardToReplicas=#{forward_to_replicas}", :write, request_options)
    end

    #
    # Delete a synonym and wait the end of indexing
    #
    # @param objectID the synonym objectID
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param request_options contains extra parameters to send with your query
    #
    def delete_synonym!(objectID, forward_to_replicas = false, request_options = {})
      res = delete_synonym(objectID, forward_to_replicas, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Save a synonym
    #
    # @param objectID the synonym objectID
    # @param synonym the synonym
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param request_options contains extra parameters to send with your query
    #
    def save_synonym(objectID, synonym, forward_to_replicas = false, request_options = {})
      client.put("#{Protocol.synonym_uri(name, objectID)}?forwardToReplicas=#{forward_to_replicas}", synonym.to_json, :write, request_options)
    end

    #
    # Save a synonym and wait the end of indexing
    #
    # @param objectID the synonym objectID
    # @param synonym the synonym
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param request_options contains extra parameters to send with your query
    #
    def save_synonym!(objectID, synonym, forward_to_replicas = false, request_options = {})
      res = save_synonym(objectID, synonym, forward_to_replicas, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Clear all synonyms
    #
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param request_options contains extra parameters to send with your query
    #
    def clear_synonyms(forward_to_replicas = false, request_options = {})
      client.post("#{Protocol.clear_synonyms_uri(name)}?forwardToReplicas=#{forward_to_replicas}", {}, :write, request_options)
    end

    #
    # Clear all synonyms and wait the end of indexing
    #
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param request_options contains extra parameters to send with your query
    #
    def clear_synonyms!(forward_to_replicas = false, request_options = {})
      res = clear_synonyms(forward_to_replicas, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Add/Update an array of synonyms
    #
    # @param synonyms the array of synonyms to add/update
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param replace_existing_synonyms should we replace the existing synonyms before adding the new ones
    # @param request_options contains extra parameters to send with your query
    #
    def batch_synonyms(synonyms, forward_to_replicas = false, replace_existing_synonyms = false, request_options = {})
      client.post("#{Protocol.batch_synonyms_uri(name)}?forwardToReplicas=#{forward_to_replicas}&replaceExistingSynonyms=#{replace_existing_synonyms}", synonyms.to_json, :batch, request_options)
    end

    #
    # Add/Update an array of synonyms and wait the end of indexing
    #
    # @param synonyms the array of synonyms to add/update
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param replace_existing_synonyms should we replace the existing synonyms before adding the new ones
    # @param request_options contains extra parameters to send with your query
    #
    def batch_synonyms!(synonyms, forward_to_replicas = false, replace_existing_synonyms = false, request_options = {})
      res = batch_synonyms(synonyms, forward_to_replicas, replace_existing_synonyms, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Replace synonyms in the index by the given array of synonyms
    #
    # @param synonyms the array of synonyms to add
    # @param request_options contains extra parameters to send with your query
    #
    def replace_all_synonyms(synonyms, request_options = {})
      forward_to_replicas = request_options[:forwardToReplicas] || request_options['forwardToReplicas'] || false
      batch_synonyms(synonyms, forward_to_replicas, true, request_options)
    end

    #
    # Replace synonyms in the index by the given array of synonyms and wait the end of indexing
    #
    # @param synonyms the array of synonyms to add
    # @param request_options contains extra parameters to send with your query
    #
    def replace_all_synonyms!(synonyms, request_options = {})
      res = replace_all_synonyms(synonyms, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Export the full list of synonyms
    # Accepts an optional block to which it will pass each synonym
    # Also returns an array with all the synonyms
    #
    # @param hits_per_page Amount of synonyms to retrieve on each internal request - Optional - Default: 100
    # @param request_options contains extra parameters to send with your query - Optional
    #
    def export_synonyms(hits_per_page = 100, request_options = {}, &_block)
      res = []
      page = 0
      loop do
        curr = search_synonyms('', { :hitsPerPage => hits_per_page, :page => page }, request_options)['hits']
        curr.each do |synonym|
          res << synonym
          yield synonym if block_given?
        end
        break if curr.size < hits_per_page
        page += 1
      end
      res
    end

    #
    # Search rules
    #
    # @param query the query
    # @param params an optional hash of :anchoring, :context, :page, :hitsPerPage
    # @param request_options contains extra parameters to send with your query
    #
    def search_rules(query, params = {}, request_options = {})
      anchoring = params[:anchoring]
      context = params[:context]
      page = params[:page] || params['page'] || 0
      hits_per_page = params[:hitsPerPage] || params['hitsPerPage'] || 20
      params = {
        :query => query,
        :page => page,
        :hitsPerPage => hits_per_page
      }
      params[:anchoring] = anchoring unless anchoring.nil?
      params[:context] = context unless context.nil?
      client.post(Protocol.search_rules_uri(name), params.to_json, :read, request_options)
    end

    #
    # Get a rule
    #
    # @param objectID the rule objectID
    # @param request_options contains extra parameters to send with your query
    #
    def get_rule(objectID, request_options = {})
      client.get(Protocol.rule_uri(name, objectID), :read, request_options)
    end

    #
    # Delete a rule
    #
    # @param objectID the rule objectID
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param request_options contains extra parameters to send with your query
    #
    def delete_rule(objectID, forward_to_replicas = false, request_options = {})
      client.delete("#{Protocol.rule_uri(name, objectID)}?forwardToReplicas=#{forward_to_replicas}", :write, request_options)
    end

    #
    # Delete a rule and wait the end of indexing
    #
    # @param objectID the rule objectID
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param request_options contains extra parameters to send with your query
    #
    def delete_rule!(objectID, forward_to_replicas = false, request_options = {})
      res = delete_rule(objectID, forward_to_replicas, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      return res
    end

    #
    # Save a rule
    #
    # @param objectID the rule objectID
    # @param rule the rule
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param request_options contains extra parameters to send with your query
    #
    def save_rule(objectID, rule, forward_to_replicas = false, request_options = {})
      raise ArgumentError.new('objectID must not be blank') if objectID.nil? || objectID == ''
      client.put("#{Protocol.rule_uri(name, objectID)}?forwardToReplicas=#{forward_to_replicas}", rule.to_json, :write, request_options)
    end

    #
    # Save a rule and wait the end of indexing
    #
    # @param objectID the rule objectID
    # @param rule the rule
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param request_options contains extra parameters to send with your query
    #
    def save_rule!(objectID, rule, forward_to_replicas = false, request_options = {})
      res = save_rule(objectID, rule, forward_to_replicas, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      return res
    end

    #
    # Clear all rules
    #
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param request_options contains extra parameters to send with your query
    #
    def clear_rules(forward_to_replicas = false, request_options = {})
      client.post("#{Protocol.clear_rules_uri(name)}?forwardToReplicas=#{forward_to_replicas}", {}, :write, request_options)
    end

    #
    # Clear all rules and wait the end of indexing
    #
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param request_options contains extra parameters to send with your query
    #
    def clear_rules!(forward_to_replicas = false, request_options = {})
      res = clear_rules(forward_to_replicas, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      return res
    end

    #
    # Add/Update an array of rules
    #
    # @param rules the array of rules to add/update
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param clear_existing_rules should we clear the existing rules before adding the new ones
    # @param request_options contains extra parameters to send with your query
    #
    def batch_rules(rules, forward_to_replicas = false, clear_existing_rules = false, request_options = {})
      client.post("#{Protocol.batch_rules_uri(name)}?forwardToReplicas=#{forward_to_replicas}&clearExistingRules=#{clear_existing_rules}", rules.to_json, :batch, request_options)
    end

    #
    # Add/Update an array of rules and wait the end of indexing
    #
    # @param rules the array of rules to add/update
    # @param forward_to_replicas should we forward the delete to replica indices
    # @param clear_existing_rules should we clear the existing rules before adding the new ones
    # @param request_options contains extra parameters to send with your query
    #
    def batch_rules!(rules, forward_to_replicas = false, clear_existing_rules = false, request_options = {})
      res = batch_rules(rules, forward_to_replicas, clear_existing_rules, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      return res
    end

    #
    # Replace rules in the index by the given array of rules
    #
    # @param rules the array of rules to add
    # @param request_options contains extra parameters to send with your query
    #
    def replace_all_rules(rules, request_options = {})
      forward_to_replicas = request_options[:forwardToReplicas] || request_options['forwardToReplicas'] || false
      batch_rules(rules, forward_to_replicas, true, request_options)
    end

    #
    # Replace rules in the index by the given array of rules and wait the end of indexing
    #
    # @param rules the array of rules to add
    # @param request_options contains extra parameters to send with your query
    #
    def replace_all_rules!(rules, request_options = {})
      res = replace_all_rules(rules, request_options)
      wait_task(res['taskID'], WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options)
      res
    end

    #
    # Export the full list of rules
    # Accepts an optional block to which it will pass each rule
    # Also returns an array with all the rules
    #
    # @param hits_per_page Amount of rules to retrieve on each internal request - Optional - Default: 100
    # @param request_options contains extra parameters to send with your query - Optional
    #
    def export_rules(hits_per_page = 100, request_options = {}, &_block)
      res = []
      page = 0
      loop do
        curr = search_rules('', { :hitsPerPage => hits_per_page, :page => page }, request_options)['hits']
        curr.each do |rule|
          res << rule
          yield rule if block_given?
        end
        break if curr.size < hits_per_page
        page += 1
      end
      res
    end

    #
    # Check whether an index exists or not
    #
    # @return [Boolean]
    #
    def exists
      begin
        get_settings
      rescue AlgoliaProtocolError => e
        if e.code === 404
          return false
        end

        raise e
      end
      return true
    end

    #
    # Aliases the exists method
    #
    alias :exists? :exists

    # Deprecated
    alias_method :get_user_key, :get_api_key
    alias_method :list_user_keys, :list_api_keys
    alias_method :add_user_key, :add_api_key
    alias_method :update_user_key, :update_api_key
    alias_method :delete_user_key, :delete_api_key

    private

    def check_array(object)
      raise ArgumentError.new('argument must be an array of objects') if !object.is_a?(Array)
    end

    def check_object(object, in_array = false)
      case object
      when Array
        raise ArgumentError.new(in_array ? 'argument must be an array of objects' : 'argument must not be an array')
      when String, Integer, Float, TrueClass, FalseClass, NilClass
        raise ArgumentError.new("argument must be an #{'array of' if in_array} object, got: #{object.inspect}")
      else
        # ok
      end
    end

    def get_objectID(object, objectID = nil)
      check_object(object)
      objectID ||= object[:objectID] || object['objectID']
      raise ArgumentError.new("Missing 'objectID'") if objectID.nil?
      return objectID
    end

    def build_batch(action, objects, with_object_id = false)
      check_array(objects)
      {
        :requests => objects.map { |object|
          check_object(object, true)
          h = { :action => action, :body => object }
          h[:objectID] = get_objectID(object).to_s if with_object_id
          h
        }
      }
    end

    def sanitized_delete_by_query_params(params)
      params ||= {}
      params.delete(:hitsPerPage)
      params.delete('hitsPerPage')
      params.delete(:attributesToRetrieve)
      params.delete('attributesToRetrieve')
      params
    end
  end
end
