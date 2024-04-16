# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Easy::Http::Custom do
  let(:easy) { Ethon::Easy.new }
  let(:url) { "http://localhost:3001/" }
  let(:params) { nil }
  let(:form) { nil }
  let(:custom) { described_class.new("PURGE", url, {:params => params, :body => form}) }

  describe "#setup" do
    context "when nothing" do
      it "sets url" do
        custom.setup(easy)
        expect(easy.url).to eq(url)
      end

      it "makes a custom request" do
        custom.setup(easy)
        easy.perform
        expect(easy.response_body).to include('"REQUEST_METHOD":"PURGE"')
      end
    end

    context "when params" do
      let(:params) { {:a => "1&"} }

      it "attaches escaped to url" do
        custom.setup(easy)
        expect(easy.url).to eq("#{url}?a=1%26")
      end

      context "when requesting" do
        before do
          easy.headers = { 'Expect' => '' }
          custom.setup(easy)
          easy.perform
        end

        it "is a custom verb" do
          expect(easy.response_body).to include('"REQUEST_METHOD":"PURGE"')
        end

        it "does not use application/x-www-form-urlencoded content type" do
          expect(easy.response_body).to_not include('"CONTENT_TYPE":"application/x-www-form-urlencoded"')
        end

        it "requests parameterized url" do
          expect(easy.response_body).to include('"REQUEST_URI":"http://localhost:3001/?a=1%26"')
        end
      end
    end

    context "when body" do
      context "when multipart" do
        let(:form) { {:a => File.open(__FILE__, 'r')} }

        it "sets httppost" do
          expect(easy).to receive(:httppost=)
          custom.setup(easy)
        end

        context "when requesting" do
          before do
            easy.headers = { 'Expect' => '' }
            custom.setup(easy)
            easy.perform
          end

          it "returns ok" do
            expect(easy.return_code).to eq(:ok)
          end

          it "is a custom verb" do
            expect(easy.response_body).to include('"REQUEST_METHOD":"PURGE"')
          end

          it "uses multipart/form-data content type" do
            expect(easy.response_body).to include('"CONTENT_TYPE":"multipart/form-data')
          end

          it "submits a body" do
            expect(easy.response_body).to match('"body":".+"')
          end

          it "submits the data" do
            expect(easy.response_body).to include('"filename":"custom_spec.rb"')
          end
        end
      end

      context "when not multipart" do
        let(:form) { {:a => "1&b=2"} }
        let(:encoded) { "a=1%26b%3D2" }

        it "sets escaped copypostfields" do
          expect(easy).to receive(:copypostfields=).with(encoded)
          custom.setup(easy)
        end

        it "sets postfieldsize" do
          expect(easy).to receive(:postfieldsize=).with(encoded.bytesize)
          custom.setup(easy)
        end

        context "when requesting" do
          before do
            easy.headers = { 'Expect' => '' }
            custom.setup(easy)
            easy.perform
          end

          it "returns ok" do
            expect(easy.return_code).to eq(:ok)
          end

          it "is a custom verb" do
            expect(easy.response_body).to include('"REQUEST_METHOD":"PURGE"')
          end

          it "uses multipart/form-data content type" do
            expect(easy.response_body).to include('"CONTENT_TYPE":"application/x-www-form-urlencoded')
          end

          it "submits a body" do
            expect(easy.response_body).to match('"body":"a=1%26b%3D2"')
          end

          it "submits the data" do
            expect(easy.response_body).to include('"rack.request.form_hash":{"a":"1&b=2"}')
          end
        end
      end

      context "when string" do
        let(:form) { "{a: 1}" }

        context "when requesting" do
          before do
            easy.headers = { 'Expect' => '' }
            custom.setup(easy)
            easy.perform
          end

          it "returns ok" do
            expect(easy.return_code).to eq(:ok)
          end

          it "sends string" do
            expect(easy.response_body).to include('"body":"{a: 1}"')
          end
        end
      end
    end

    context "when params and body" do
      let(:form) { {:a => "1"} }
      let(:params) { {:b => "2"} }

      context "when requesting" do
        before do
          easy.headers = { 'Expect' => '' }
          custom.setup(easy)
          easy.perform
        end

        it "url contains params" do
          expect(easy.response_body).to include('"REQUEST_URI":"http://localhost:3001/?b=2"')
        end

        it "body contains form" do
          expect(easy.response_body).to include('"body":"a=1"')
        end
      end
    end
  end
end
