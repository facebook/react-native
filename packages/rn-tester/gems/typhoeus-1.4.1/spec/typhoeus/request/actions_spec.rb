require 'spec_helper'

describe Typhoeus::Request::Actions do
  [:get, :post, :put, :delete, :head, :patch, :options].each do |name|
    describe ".#{name}" do
      let(:response) { Typhoeus::Request.method(name).call("http://localhost:3001") }

      it "returns ok" do
        expect(response.return_code).to eq(:ok)
      end

      unless name == :head
        it "makes #{name.to_s.upcase} Request" do
          expect(response.response_body).to include("\"REQUEST_METHOD\":\"#{name.to_s.upcase}\"")
        end
      end
    end
  end
end
