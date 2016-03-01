using ReactNative.UIManager;
using ReactNative.UIManager.Events;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Media.Imaging;

namespace ReactNative.Views.Image
{
    /// <summary>
    /// The view manager responsible for rendering native images.
    /// </summary>
    /// <remarks>
    /// TODO: fadeDuration animation support?
    /// </remarks>
    public class ReactImageManager : SimpleViewManager<Border>
    {
        private const string ReactClass = "RCTImageView";
        private const string PROP_SOURCE = "source";
        private const string PROP_URI = "uri";

        private Uri _imageSource;
        private uint? _tintColor;

        /// <summary>
        /// The view manager name.
        /// </summary>
        public override string Name
        {
            get
            {
                return ReactClass;
            }
        }

        /// <summary>
        /// The view manager event constants.
        /// </summary>
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

        /// <summary>
        /// Sets the <see cref="ImageBrush"/> source for the background of a <see cref="Border"/>.
        /// </summary>
        /// <param name="view">The image view instance.</param>
        /// <param name="sourceMap">The source map.</param>
        [ReactProperty(PROP_SOURCE)]
        public void SetSource(Border view, Dictionary<string, string> sourceMap)
        {
            var source = default(string);

            if (sourceMap != null && sourceMap.TryGetValue(PROP_URI, out source))
            {
                if (!Uri.TryCreate(source, UriKind.Absolute, out _imageSource))
                {
                    _imageSource = new Uri("ms-appx://" + source);
                }
            }
        }

        /// <summary>
        /// The border radius of the <see cref="ReactRootView"/>.
        /// </summary>
        /// <param name="view">The image view instance.</param>
        /// <param name="radius">The border radius value.</param>
        [ReactProperty("borderRadius")]
        public void SetBorderRadius(Border view, double radius)
        {
            view.CornerRadius = new CornerRadius(radius);
        }

        /// <summary>
        /// Set the border color of the image view.
        /// </summary>
        /// <param name="view">The image view instance.</param>
        /// <param name="color">The masked color value.</param>
        [ReactProperty("borderColor", CustomType = "Color")]
        public void SetBorderColor(Border view, uint? color)
        {
            // TODO: what if color is null?
            if (color.HasValue)
            {
                var brush = new SolidColorBrush(ColorHelpers.Parse(color.Value));
                view.BorderBrush = brush;
            }
        }

        /// <summary>
        /// Set the alpha tint color of the <see cref="Border"/> background.
        /// </summary>
        /// <param name="view">The image view instance.</param>
        /// <param name="color">The masked color value.</param>
        [ReactProperty("tintColor", CustomType = "Color")]
        public void SetTintColor(Border view, uint? color)
        {
            if (color.HasValue)
            {
                _tintColor = color.Value;
            }
        }

        /// <summary>
        /// Sets the background image effect of the border depending on any tinting requirements.
        /// </summary>
        /// <param name="view">The image view instance.</param>
        protected override void OnAfterUpdateTransaction(Border view)
        {
            var element = view.Background as ImageBrush;
            if (_tintColor.HasValue && _imageSource != null)
            {
                view.CreateColorBlendedImageSource(_imageSource, ColorHelpers.Parse(_tintColor.Value));
            }
            else if(_imageSource != null)
            {
                view.CreateBackgroundBitmapImage(_imageSource);
            }
        }

        /// <summary>
        /// Sets the border thickness of the image view.
        /// </summary>
        /// <param name="view">The image view instance.</param>
        /// <param name="index">The property index.</param>
        /// <param name="width">The border width in pixels.</param>
        [ReactPropertyGroup(
            ViewProperties.BorderWidth,
            ViewProperties.BorderLeftWidth,
            ViewProperties.BorderRightWidth,
            ViewProperties.BorderTopWidth,
            ViewProperties.BorderBottomWidth,
            DefaultDouble = double.NaN)]
        public void SetBorderWidth(Border view, int index, double width)
        {
            view.SetBorderWidth(ViewProperties.BorderSpacingTypes[index], width);
        }

        /// <summary>
        /// Called when the image view. is detached from view hierarchy and allows for 
        /// additional cleanup by the <see cref="ReactImageManager"/>.
        /// subclass.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The image view instance.</param>
        public override void OnDropViewInstance(ThemedReactContext reactContext, Border view)
        {
            view.Loaded -= OnInterceptImageLoadedEvent;
            view.Loading -= OnInterceptImageLoadingEvent;
        }

        /// <summary>
        /// Creates the image view instance.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The image view instance.</returns>
        protected override Border CreateViewInstance(ThemedReactContext reactContext)
        {
            return new Border();
        }

        /// <summary>
        /// Installing the textchanged event emitter on the <see cref="TextInput"/> Control.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The image view instance.</param>
        protected override void AddEventEmitters(ThemedReactContext reactContext, Border view)
        {
            view.Loading += OnInterceptImageLoadingEvent;
            view.Loaded += OnInterceptImageLoadedEvent;
        }

        /// <summary>
        /// The <see cref="Border"/> event interceptor for image load start events for the native control.
        /// </summary>
        /// <param name="sender">The source sender view.</param>
        /// <param name="e">The received event arguments.</param>
        protected void OnInterceptImageLoadingEvent(FrameworkElement sender, object e)
        {
            var border = (Border)sender;
            var imageBrush = GetImageBrush(border);
            var bitmapImage = imageBrush?.ImageSource as BitmapImage;
            if (imageBrush != null && bitmapImage != null)
            {
                bitmapImage.DecodePixelHeight = (int)sender.Height;
                bitmapImage.DecodePixelWidth = (int)sender.Width;
                imageBrush.Stretch = Stretch.Fill;
            }

            GetEventDispatcher(border).DispatchEvent(
                new ReactImageLoadEvent(border.GetTag(), ReactImageLoadEvent.OnLoadStart));
        }

        /// <summary>
        /// The <see cref="Border"/> event interceptor for image load completed events for the native control.
        /// </summary>
        /// <param name="sender">The source sender view.</param>
        /// <param name="e">The received event arguments.</param>
        protected void OnInterceptImageLoadedEvent(object sender, RoutedEventArgs e)
        {
            var senderImage = (Border)sender;
            GetEventDispatcher(senderImage).DispatchEvent(
                new ReactImageLoadEvent(senderImage.GetTag(), ReactImageLoadEvent.OnLoadEnd));
        }

        private ImageBrush GetImageBrush(Border border)
        {
            return border.Background as ImageBrush;
        }

        private static EventDispatcher GetEventDispatcher(FrameworkElement image)
        {
            return image.GetReactContext().ReactInstance.GetNativeModule<UIManagerModule>().EventDispatcher;
        }
    }
}
