using System.IO;
using System.Threading.Tasks;
using Windows.Data.Xml.Dom;
using Windows.UI.Notifications;

namespace ReactNative.Modules.Toast
{
    class ToastHelper
    {
        internal static void SendToast(string message, string duration = "short")
        {
            var doc = MakeDoc(message).Result;
            var notification = new ToastNotification(doc);

            // Get the toast notification manager for the current app.
            ToastNotificationManager.CreateToastNotifier().Show(notification);
        }

        static async Task<XmlDocument> MakeDoc(string content, Durations duration = Durations.@short)
        {
            /// TODO: alt templates: https://msdn.microsoft.com/en-us/library/windows/apps/hh761494.aspx
            using (var stream = new MemoryStream())
            using (var reader = new StreamReader(stream))
            {
                await BuildNotificationXml(stream, content, duration);
                stream.Position = 0;
                var xml = await reader.ReadToEndAsync();
                var doc = new XmlDocument();
                doc.LoadXml(xml);
                return doc;
            }
        }

        static async Task BuildNotificationXml(Stream stream, string content, Durations duration = Durations.@short)
        {
            System.Xml.XmlWriterSettings settings = new System.Xml.XmlWriterSettings();
            settings.OmitXmlDeclaration = true;
            settings.Async = true;

            using (System.Xml.XmlWriter writer = System.Xml.XmlWriter.Create(stream, settings))
            {
                await writer.WriteStartElementAsync(null, "toast", null);
                await writer.WriteAttributeStringAsync(null, "activationType", null, "foreground");
                await writer.WriteAttributeStringAsync(null, "duration", null, duration.ToString());

                await writer.WriteStartElementAsync(null, "visual", null);
                await writer.WriteStartElementAsync(null, "binding", null);
                await writer.WriteAttributeStringAsync(null, "template", null, "ToastText01");

                await writer.WriteStartElementAsync(null, "text", null);
                await writer.WriteAttributeStringAsync(null, "id", null, "1");
                await writer.WriteStringAsync(content);
                await writer.WriteEndElementAsync();

                await writer.WriteEndElementAsync();
                await writer.FlushAsync();
            }
        }
    }
}
