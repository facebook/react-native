require 'spec_helper'

describe Typhoeus::Response::Header do
  let(:raw) { nil }
  let(:header) { Typhoeus::Response::Header.new(raw) }

  describe ".new" do
    context "when string" do
      let(:raw) { 'Date: Fri, 29 Jun 2012 10:09:23 GMT' }

      it "sets Date" do
        expect(header['Date']).to eq('Fri, 29 Jun 2012 10:09:23 GMT')
      end

      it "provides case insensitive access" do
        expect(header['DaTe']).to eq('Fri, 29 Jun 2012 10:09:23 GMT')
      end

      it "provides symbol access" do
        expect(header[:date]).to eq('Fri, 29 Jun 2012 10:09:23 GMT')
      end
    end

    context "when hash" do
      let(:raw) { { 'Date' => 'Fri, 29 Jun 2012 10:09:23 GMT' } }

      it "sets Date" do
        expect(header['Date']).to eq(raw['Date'])
      end

      it "provides case insensitive access" do
        expect(header['DaTe']).to eq(raw['Date'])
      end
    end
  end

  describe "#parse" do
    context "when no header" do
      it "returns nil" do
        expect(header).to be_empty
      end
    end

    context "when header" do
      let(:raw) do
        'HTTP/1.1 200 OK
        Set-Cookie: NID=61=LblqYgUOu; expires=Sat, 29-Dec-2012 10:09:23 GMT; path=/; domain=.google.de; HttpOnly
        Date: Fri, 29 Jun 2012 10:09:23 GMT
        Expires: -1
        Cache-Control: private, max-age=0
        Content-Type: text/html; charset=ISO-8859-1
        Set-Cookie: PREF=ID=77e93yv0hPtejLou; expires=Sun, 29-Jun-2014 10:09:23 GMT; path=/; domain=.google.de
        Set-Cookie: NID=61=LblqYgh5Ou; expires=Sat, 29-Dec-2012 10:09:23 GMT; path=/; domain=.google.de; HttpOnly
        P3P: CP="This is not a P3P policy! See http://www.google.com/support/accounts/bin/answer.py?hl=en&answer=151657 for more info."
        Server: gws
        X-XSS-Protection: 1; mode=block
        X-Frame-Options: SAMEORIGIN
        Transfer-Encoding: chunked'.gsub(/^\s{8}/, '')
      end

      it "sets raw" do
        expect(header.send(:raw)).to eq(raw)
      end

      it "sets Set-Cookie" do
        expect(header['set-cookie'].size).to eq(3)
      end

      it "provides case insensitive access" do
        expect(header['Set-CooKie'].size).to eq(3)
      end

      [
        'NID=61=LblqYgUOu; expires=Sat, 29-Dec-2012 10:09:23 GMT; path=/; domain=.google.de; HttpOnly',
        'PREF=ID=77e93yv0hPtejLou; expires=Sun, 29-Jun-2014 10:09:23 GMT; path=/; domain=.google.de',
        'NID=61=LblqYgh5Ou; expires=Sat, 29-Dec-2012 10:09:23 GMT; path=/; domain=.google.de; HttpOnly'
      ].each_with_index do |cookie, i|
        it "sets Cookie##{i}" do
          expect(header['set-cookie']).to include(cookie)
        end
      end

      {
        'Date' => 'Fri, 29 Jun 2012 10:09:23 GMT', 'Expires' => '-1',
        'Cache-Control' => 'private, max-age=0',
        'Content-Type' => 'text/html; charset=ISO-8859-1',
        'P3P' => 'CP="This is not a P3P policy! See http://www.google.com/support/accounts/bin/answer.py?hl=en&answer=151657 for more info."',
        'Server' => 'gws', 'X-XSS-Protection' => '1; mode=block',
        'X-Frame-Options' => 'SAMEORIGIN', 'Transfer-Encoding' => 'chunked'
      }.each do |name, value|
        it "sets #{name}" do
          expect(header[name.downcase]).to eq(value)
        end
      end

      context 'includes a multi-line header' do
        let(:raw) do
          'HTTP/1.1 200 OK
          Date: Fri, 29 Jun 2012 10:09:23 GMT
          Content-Security-Policy: default-src "self";
            img-src * data: "self";
            upgrade-insecure-requests;'.gsub(/^\s{10}/, '')
        end

        it "joins header parts" do
          expect(header).to eq({
            'Date' => 'Fri, 29 Jun 2012 10:09:23 GMT',
            'Content-Security-Policy' => 'default-src "self"; img-src * data: "self"; upgrade-insecure-requests;'
          })
        end
      end

      context 'includes line with only whitespace' do
        let(:raw) do
          'HTTP/1.1 200 OK
          Date: Fri, 29 Jun 2012 10:09:23 GMT
            
          '.gsub(/^\s{10}/, '')
        end

        it 'ignores it' do
          expect(header).to eq({ 'Date' => 'Fri, 29 Jun 2012 10:09:23 GMT' })
        end
      end

      context 'with broken headers' do
        let(:raw) do
          'HTTP/1.1 200 OK
          Date:
          Content-Type
          '.gsub(/^\s{10}/, '')
        end

        it 'returns empty string for invalid headers' do
          expect(header.to_hash).to include({ 'Date' => '', 'Content-Type' => '' })
        end
      end
    end
  end

  it "can be Marshal'd" do
    header = Typhoeus::Response::Header.new("Foo: Bar")
    expect {
      Marshal.dump(header)
    }.not_to raise_error
  end
end
