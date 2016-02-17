using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Common;
using ReactNative.Tracing;
using System;
using System.Linq;

namespace ReactNative.DevSupport
{
    /// <summary>
    /// Tracks errors connecting to or received from the debug server. The
    /// debug server returns errors as JSON objects. This exeception represents
    /// that error.
    /// </summary>
    public class DebugServerException : Exception
    {
        private DebugServerException(string description, string fileName, int lineNumber, int column)
            : this($"{description}{Environment.NewLine} at {fileName}:{lineNumber}:{column}")
        {
        }

        /// <summary>
        /// Instantiates the <see cref="DebugServerException"/>.
        /// </summary>
        /// <param name="message">The exception message.</param>
        public DebugServerException(string message)
            : base(message)
        {
        }

        /// <summary>
        /// Parse a <see cref="DebugServerException"/> from the server response.
        /// </summary>
        /// <param name="content">
        /// JSON response returned by the debug server.
        /// </param>
        /// <returns>The exception instance.</returns>
        public static DebugServerException Parse(string content)
        {
            if (string.IsNullOrEmpty(content))
            {
                return null;
            }

            try
            {
                var jsonObject = JObject.Parse(content);
                var fileName = jsonObject.Value<string>("filename");
                return new DebugServerException(
                    jsonObject.Value<string>("description"),
                    ShortenFileName(fileName),
                    jsonObject.Value<int>("lineNumber"),
                    jsonObject.Value<int>("column"));
            }
            catch (JsonException)
            {
                // TODO: trace the exception
                return null;
            }
        }

        private static string ShortenFileName(string fileName)
        {
            return fileName.Split('/').Last();
        }
    }
}
