using System;
using System.IO;
using System.IO.Compression;
using Windows.Web.Http;
using Windows.Web.Http.Headers;

namespace ReactNative.Modules.Network
{
    static class HttpContentHelpers
    {
        public static IHttpContent CreateFromBody(HttpContentHeaderData headerData, string body)
        {
            if (headerData.ContentEncoding == "gzip")
            {
                var content = CreateGzip(body);
                content.Headers.ContentType = new HttpMediaTypeHeaderValue(headerData.ContentType);
                content.Headers.ContentEncoding.ParseAdd(headerData.ContentEncoding);
                return content;
            }
            else
            {
                var content = CreateString(body);
                content.Headers.ContentType = new HttpMediaTypeHeaderValue(headerData.ContentType);
                return content;
            }
        }

        public static HttpContentHeaderData ExtractHeaders(string[][] headers)
        {
            var result = new HttpContentHeaderData();

            foreach (var header in headers)
            {
                var key = header[0];
                switch (key.ToLowerInvariant())
                {
                    case "content-type":
                        result.ContentType = header[1];
                        break;
                    case "content-encoding":
                        result.ContentEncoding = header[1];
                        break;
                    default:
                        break;
                }
            }

            return result;
        }

        private static IHttpContent CreateGzip(string body)
        {
            var stream = new MemoryStream();

            var gzipStream = new GZipStream(stream, CompressionMode.Compress, true);

            try
            {
                using (var streamWriter = new StreamWriter(gzipStream))
                {
                    gzipStream = null;
                    streamWriter.Write(body);
                }
            }
            finally
            {
                if (gzipStream != null)
                {
                    gzipStream.Dispose();
                }
            }

            stream.Position = 0;
            return new HttpStreamContent(stream.AsInputStream());
        }

        private static IHttpContent CreateString(string body)
        {
            return new HttpStringContent(body);
        }
    }
}
