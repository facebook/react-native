module Algolia

  class Analytics
    attr_reader :ssl, :ssl_version, :headers
    API_URL='https://analytics.algolia.com'

    def initialize(client, params)
      @client   = client
      @headers  = params[:headers]
    end

    def get_ab_tests(params = {})
      params = {
        :offset => 0,
        :limit => 10,
      }.merge(params)

      perform_request(:GET, Protocol.ab_tests_uri, params)
    end

    def get_ab_test(ab_test_id)
      raise ArgumentError.new('ab_test_id cannot be empty') if ab_test_id.nil? || ab_test_id == ''

      perform_request(:GET, Protocol.ab_tests_uri(ab_test_id))
    end

    def add_ab_test(ab_test)
      perform_request(:POST, Protocol.ab_tests_uri, {}, ab_test.to_json)
    end

    def stop_ab_test(ab_test_id)
      raise ArgumentError.new('ab_test_id cannot be empty') if ab_test_id.nil? || ab_test_id == ''

      perform_request(:POST, Protocol.ab_tests_stop_uri(ab_test_id))
    end

    def delete_ab_test(ab_test_id)
      raise ArgumentError.new('ab_test_id cannot be empty') if ab_test_id.nil? || ab_test_id == ''

      perform_request(:DELETE, Protocol.ab_tests_uri(ab_test_id))
    end

    def wait_task(index_name, taskID, time_before_retry = WAIT_TASK_DEFAULT_TIME_BEFORE_RETRY, request_options = {})
      @client.wait_task(index_name, taskID, time_before_retry, request_options)
    end

    private

    def perform_request(method, url, params = {}, data = {})
      http = HTTPClient.new

      url = API_URL + url

      encoded_params = Hash[params.map { |k, v| [k.to_s, v.is_a?(Array) ? v.to_json : v] }]
      url << "?" + Protocol.to_query(encoded_params)

      response = case method
                 when :GET
                   http.get(url, { :header => @headers })
                 when :POST
                   http.post(url, { :body => data, :header => @headers })
                 when :DELETE
                   http.delete(url, { :header => @headers })
                 end

      if response.code / 100 != 2
        raise AlgoliaProtocolError.new(response.code, "Cannot #{method} to #{url}: #{response.content}")
      end

      JSON.parse(response.content)
    end

  end

end
