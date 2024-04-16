# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Easy::Http do
  let(:easy) { Ethon::Easy.new }

  describe "#http_request" do
    let(:url) { "http://localhost:3001/" }
    let(:action_name) { :get }
    let(:options) { {} }

    let(:get) { double(:setup) }
    let(:get_class) { Ethon::Easy::Http::Get }

    it "instanciates action" do
      expect(get).to receive(:setup)
      expect(get_class).to receive(:new).and_return(get)
      easy.http_request(url, action_name, options)
    end

    context "when requesting" do
      [ :get, :post, :put, :delete, :head, :patch, :options ].map do |action|
        it "returns ok" do
          easy.http_request(url, action, options)
          easy.perform
          expect(easy.return_code).to be(:ok)
        end

        unless action == :head
          it "makes a #{action.to_s.upcase} request" do
            easy.http_request(url, action, options)
            easy.perform
            expect(easy.response_body).to include("\"REQUEST_METHOD\":\"#{action.to_s.upcase}\"")
          end

          it "streams the response body from the #{action.to_s.upcase} request" do
            bytes_read = 0
            easy.on_body { |chunk, response| bytes_read += chunk.bytesize }
            easy.http_request(url, action, options)
            easy.perform
            content_length = ((easy.response_headers =~ /Content-Length: (\d+)/) && $1.to_i)
            expect(bytes_read).to eq(content_length)
            expect(easy.response_body).to eq("")
          end

          it "notifies when headers are ready" do
            headers = []
            easy.on_headers { |r| headers << r.response_headers }
            easy.http_request(url, action, options)
            easy.perform
            expect(headers).to eq([easy.response_headers])
            expect(headers.first).to match(/Content-Length: (\d+)/)
          end
        end
      end

      it "makes requests with custom HTTP verbs" do
        easy.http_request(url, :purge, options)
        easy.perform
        expect(easy.response_body).to include(%{"REQUEST_METHOD":"PURGE"})
      end
    end
  end
end
