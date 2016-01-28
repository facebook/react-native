using ReactNative.UIManager;
using ReactNative.UIManager.Events;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Media.Imaging;

namespace ReactNative.Views.Image
{
    /// <summary>
    /// The view manager responsible for rendering native <see cref="ImageControl"/>.
    /// TODO. Implememt tincolor property and fadeDuration animation support
    /// </summary>
    public class ReactImageManager : SimpleViewManager<BorderedContentControl>
    {
        private const string ReactClass = "RCTImageView";
        private const string PROP_SOURCE = "source";
        private const string PROP_URI = "uri";

        public override string Name
        {
            get
            {
                return ReactClass;
            }
        }

        public override IReadOnlyDictionary<string, object> ExportedCustomDirectEventTypeConstants
        {
            get
            {
                return new Dictionary<string, object>
                    {
                        { "topLoadEnd", new Dictionary<string, object> { { "registrationName", "onLoadEnd" } } },
                        { "topLoadStart", new Dictionary<string, object> { { "registrationName", "onLoadStart" } } },
                    };
            }
        }

        protected override BorderedContentControl CreateViewInstanceCore(ThemedReactContext reactContext)
        {
            return new BorderedContentControl(new Border());
        }

        /// <summary>
        /// The <see cref="BorderedContentControl"/> event interceptor for image load start events for the native control.
        /// </summary>
        /// <param name="sender">The source sender view.</param>
        /// <param name="event">The received event args</param>
        public void OnInterceptImageLoadingEvent(FrameworkElement sender, object e)
        {
            var senderImage = (BorderedContentControl)sender;

            var borderComponent = senderImage.Content as Border;
            var imageBrush = default(ImageBrush);

            if (borderComponent != null && TryParseBorderImage(borderComponent, out imageBrush))
            {
                var bitmapImage = imageBrush.ImageSource as BitmapImage;
                bitmapImage.DecodePixelHeight = (int)sender.Height;
                bitmapImage.DecodePixelWidth = (int)sender.Width;
                imageBrush.Stretch = Stretch.Fill;
            }

            GetEventDispatcher(senderImage).DispatchEvent(new ReactImageLoadingEvent(senderImage.GetTag()));
        }

        private bool TryParseBorderImage(Border border, out ImageBrush backgroundImage)
        {
            if (border !=null && border.Background != null && border.Background.GetType() == typeof(ImageBrush))
            {
                backgroundImage = border.Background as ImageBrush;

                return true;
            }
            else
            {
                backgroundImage = null;
                return false;
            }
        }

        /// <summary>
        /// The <see cref="BorderedContentControl"/> event interceptor for image load completed events for the native control.
        /// </summary>
        /// <param name="sender">The source sender view.</param>
        /// <param name="event">The received event args</param>
        public void OnInterceptImageLoadedEvent(object sender, RoutedEventArgs e)
        {
            var senderImage = (BorderedContentControl)sender;
            GetEventDispatcher(senderImage).DispatchEvent(new ReactImageLoadedEvent(senderImage.GetTag()));
        }

        private EventDispatcher GetEventDispatcher(BorderedContentControl image)
        {
            return image?.GetReactContext().CatalystInstance.GetNativeModule<UIManagerModule>().EventDispatcher;
        }

        /// <summary>
        /// Installing the textchanged event emitter on the <see cref="TextInput"/> Control.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The <see cref="TextBox"/> view instance.</param>
        protected override void AddEventEmitters(ThemedReactContext reactContext, BorderedContentControl view)
        {
            view.Loading += this.OnInterceptImageLoadingEvent;
            view.Loaded += this.OnInterceptImageLoadedEvent;
        }

        /// <summary>
        /// Sets the <see cref="BrushImage"/> source for the background of a <see cref="BorderedContentControl"/>.
        /// </summary>
        /// <param name="view">The text input box control.</param>
        /// <param name="degrees">The text alignment.</param>
        [ReactProperty(PROP_SOURCE)]
        public void SetSource(BorderedContentControl view, Dictionary<string, string> sourceMap)
        {
            var imageSrcURL = default(Uri);
            var source = default(string);

            if (sourceMap!=null && sourceMap.TryGetValue(PROP_URI, out source))
            {
                if(!Uri.TryCreate(source, UriKind.Absolute, out imageSrcURL))
                {
                    imageSrcURL = new Uri("ms-appx://" + source);
                }

                if (imageSrcURL != null && view.Content.GetType() == typeof(Border))
                {
                    var backgroundImage = new ImageBrush()
                    {
                        ImageSource = new BitmapImage(imageSrcURL)
                    };

                    ((Border)view.Content).Background = backgroundImage;
                }
            }
        }

        /// <summary>
        /// The border radius of the <see cref="ReactRootView"/>.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="radius">The border radius value.</param>
        [ReactProperty("borderRadius")]
        public void SetBorderRadius(BorderedContentControl view, double radius)
        {
            view.SetBorderRadius(radius);
        }

        /// <summary>
        /// Sets the border thickness of the <see cref="ReactPanel"/>.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="index">The property index.</param>
        /// <param name="width">The border width in pixels.</param>
        [ReactPropertyGroup(
            ViewProperties.BorderWidth,
            ViewProperties.BorderLeftWidth,
            ViewProperties.BorderRightWidth,
            ViewProperties.BorderTopWidth,
            ViewProperties.BorderBottomWidth,
            DefaultDouble = double.NaN)]
        public void SetBorderWidth(BorderedContentControl view, int index, double width)
        {
            view.SetBorderWidth(ViewProperties.BorderSpacingTypes[index], width);
        }

        /// <summary>
        /// Set the border color of the <see cref="ReactPanel"/>.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="index">The property index.</param>
        /// <param name="color">The color hex code.</param>
        [ReactPropertyGroup(
            "borderColor",
            "borderLeftColor",
            "borderRightColor",
            "borderTopColor",
            "borderBottomColor",
            CustomType = "Color")]
        public void SetBorderColor(BorderedContentControl view, int index, uint? color)
        {
            // TODO: what if color is null?
            if (color.HasValue)
            {
                view.SetBorderColor(ViewProperties.BorderSpacingTypes[index], color.Value);
            }
        }

        /// <summary>
        /// Called when the <see cref="BorderedContentControl"/> is detached from view hierarchy and allows for 
        /// additional cleanup by the <see cref="ViewManager{BorderedContentControl}"/>
        /// subclass. Unregister all event handlers for the <see cref="BorderedContentControl"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The <see cref="BorderedContentControl"/>.</param>
        protected override void OnDropViewInstance(ThemedReactContext reactContext, BorderedContentControl view)
        {
            view.Loaded -= this.OnInterceptImageLoadedEvent;
            view.Loading -= this.OnInterceptImageLoadingEvent;
        }

    }
}
