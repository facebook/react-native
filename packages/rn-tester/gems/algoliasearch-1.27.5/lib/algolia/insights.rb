module Algolia

  class Insights
    MIN_RUBY_VERSION = '1.9.0'

    def initialize(app_id, api_key, region = 'us', params = {})
      headers = params[:headers] || {}
      @app_id   = app_id
      @api_key  = api_key
      @url = "https://insights.#{region}.algolia.io"
      @headers  = headers.merge({
        Protocol::HEADER_APP_ID  => app_id,
        Protocol::HEADER_API_KEY => api_key,
        'Content-Type'           => 'application/json; charset=utf-8',
        'User-Agent'             => ["Algolia for Ruby (#{::Algolia::VERSION})", "Ruby (#{RUBY_VERSION})"].join('; ')
                                })
    end

    def user(user_token)
      UserInsights.new(self, user_token)
    end

    def send_event(event)
      send_events([event])
    end

    def send_events(events)
      perform_request(:POST, '/1/events', {}, { 'events' => events }.to_json)
    end

    private

    def perform_request(method, path, params = {}, data = {})
      http = HTTPClient.new

      url = @url + path

      encoded_params = Hash[params.map { |k, v| [k.to_s, v.is_a?(Array) ? v.to_json : v] }]
      url << "?" + Protocol.to_query(encoded_params)

      response = case method
                 when :POST
                   http.post(url, { :body => data, :header => @headers })
                 end

      if response.code / 100 != 2
        raise AlgoliaProtocolError.new(response.code, "Cannot #{method} to #{url}: #{response.content}")
      end

      JSON.parse(response.content)
    end
  end

  class UserInsights
    def initialize(insights, user_token)
      @insights = insights
      @user_token = user_token
    end

    def clicked_object_ids(event_name, index_name, object_ids, request_options = {})
      clicked({ 'objectIDs' => object_ids }, event_name, index_name, request_options)
    end

    def clicked_object_ids_after_search(event_name, index_name, object_ids, positions, query_id, request_options = {})
      clicked({
                  'objectIDs' => object_ids,
                  'positions' => positions,
                  'queryID' => query_id,
              }, event_name, index_name, request_options)
    end

    def clicked_filters(event_name, index_name, filters, request_options = {})
      clicked({ 'filters' => filters }, event_name, index_name, request_options)
    end

    def converted_object_ids(event_name, index_name, object_ids, request_options = {})
      converted({ 'objectIDs' => object_ids }, event_name, index_name, request_options)
    end

    def converted_object_ids_after_search(event_name, index_name, object_ids, query_id, request_options = {})
      converted({
                  'objectIDs' => object_ids,
                  'queryID' => query_id,
              }, event_name, index_name, request_options)
    end

    def converted_filters(event_name, index_name, filters, request_options = {})
      converted({ 'filters' => filters }, event_name, index_name, request_options)
    end

    def viewed_object_ids(event_name, index_name, object_ids, request_options = {})
      viewed({ 'objectIDs' => object_ids }, event_name, index_name, request_options)
    end

    def viewed_filters(event_name, index_name, filters, request_options = {})
      viewed({ 'filters' => filters }, event_name, index_name, request_options)
    end

    private

    def clicked(event, event_name, index_name, request_options = {})
      send_event(event.merge({
                                'eventType' => 'click',
                                'eventName' => event_name,
                                'index' => index_name,
                            }))
    end

    def converted(event, event_name, index_name, request_options = {})
      send_event(event.merge({
                                'eventType' => 'conversion',
                                'eventName' => event_name,
                                'index' => index_name,
                            }))
    end

    def viewed(event, event_name, index_name, request_options = {})
      send_event(event.merge({
                                'eventType' => 'view',
                                'eventName' => event_name,
                                'index' => index_name,
                            }))
    end

    def send_event(event)
      @insights.send_event(event.merge({ 'userToken' => @user_token}))
    end

  end

end
