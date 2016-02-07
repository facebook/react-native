using ReactNative.UIManager;
using ReactNative.UIManager.Events;
using ReactNative.UIManager.LayoutAnimation;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Media.Animation;
using Windows.UI.Xaml.Media.Imaging;
using Microsoft.Graphics.Canvas;
using Microsoft.Graphics.Canvas.Effects;
using Microsoft.Graphics.Canvas.UI.Xaml;
using Windows.UI;

namespace ReactNative.Views.Image
{
    /// <summary>
    /// The view manager responsible for rendering native <see cref="ImageControl"/>.
    /// TODO: Implememt tintColor property and fadeDuration animation support.
    /// </summary>
    public class ReactImageManager : SimpleViewManager<Border>
    {
        private const string ReactClass = "RCTImageView";
        private const string PROP_SOURCE = "source";
        private const string PROP_URI = "uri";
        //Defaulting to 1000 MS for testing purpose until Image.windows.js is modified.
        private int _FadeDurationMS = 3000;
        private Uri _ImageSource;
        private uint? _TintColor;

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
        /// <param name="view">The text input box control.</param>
        /// <param name="degrees">The text alignment.</param>
        [ReactProperty(PROP_SOURCE)]
        public void SetSource(Border view, Dictionary<string, string> sourceMap)
        {
            var source = default(string);

            if (sourceMap != null && sourceMap.TryGetValue(PROP_URI, out source))
            {
                if (!Uri.TryCreate(source, UriKind.Absolute, out _ImageSource))
                {
                    _ImageSource = new Uri("ms-appx://" + source);
                }
            }
        }

        /// <summary>
        /// The border radius of the <see cref="ReactRootView"/>.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="radius">The border radius value.</param>
        [ReactProperty("borderRadius")]
        public void SetBorderRadius(Border view, double radius)
        {
            view.CornerRadius = new CornerRadius(radius);
        }

        /// <summary>
        /// Set the border color of the <see cref="ReactPanel"/>.
        /// </summary>
        /// <param name="view">The border panel.</param>
        /// <param name="color">The color hex code.</param>
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
        /// <param name="view">The border panel.</param>
        /// <param name="color">The color hex code.</param>
        [ReactProperty("tintColor", CustomType = "Color")]
        public void SetTintColor(Border view, uint? color) {
            var backgroundType = view.Background?.GetType();

            if (color.HasValue)
            {
                _TintColor = color.Value;
            }
        }

        /// <summary>
        /// Sets the background image effect of the border depending on any tinting requirements.
        /// </summary>
        /// <param name="view">The native <see cref="Border"/> that requires any background effects.</param>
        protected override void OnAfterUpdateTransaction(Border view)
        {
            var element = view.Background as ImageBrush;
            if (_TintColor.HasValue && _ImageSource != null)
            {
                view.CreateColorBlendedImageSource(_ImageSource, ColorHelpers.Parse(_TintColor.Value));
            }
            else if(_ImageSource != null)
            {
                view.CreateBackgroundBitmapImage(_ImageSource);
            }
        }
        
        /// <summary>
        /// Set the fade in animation effect duration of the <see cref="Border"/>.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="index">The property index.</param>
        /// <param name="color">The color hex code.</param>
            //Fadeduration is only supported on android, and commenting out until we can modify the Image Def in Libraries/Image/Image.windows.js 
            //[ReactProperty("fadeDuration")]
        public void SetFadeDurationMS(Border view, int? fadeDurationMS)
        {
            if (fadeDurationMS.HasValue)
            {
                _FadeDurationMS = fadeDurationMS.Value;
            }
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
        public void SetBorderWidth(Border view, int index, double width)
        {
            view.SetBorderWidth(ViewProperties.BorderSpacingTypes[index], width);
        }

        /// <summary>
        /// Creates the image view instance.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The image view instance.</returns>
        protected override Border CreateViewInstanceCore(ThemedReactContext reactContext)
        {
            return new Border();
        }

        /// <summary>
        /// Installing the textchanged event emitter on the <see cref="TextInput"/> Control.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The <see cref="TextBox"/> view instance.</param>
        protected override void AddEventEmitters(ThemedReactContext reactContext, Border view)
        {
            view.Loading += OnInterceptImageLoadingEvent;
            view.Loaded += OnInterceptImageLoadedEvent;
        }

        /// <summary>
        /// Called when the <see cref="Border"/> is detached from view hierarchy and allows for 
        /// additional cleanup by the <see cref="ViewManager{Border}"/>
        /// subclass. Unregister all event handlers for the <see cref="Border"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The <see cref="Border"/>.</param>
        protected override void OnDropViewInstance(ThemedReactContext reactContext, Border view)
        {
            view.Loaded -= OnInterceptImageLoadedEvent;
            view.Loading -= OnInterceptImageLoadingEvent;
        }

        /// <summary>
        /// The <see cref="Border"/> event interceptor for image load start events for the native control.
        /// </summary>
        /// <param name="sender">The source sender view.</param>
        /// <param name="event">The received event arguments.</param>
        protected void OnInterceptImageLoadingEvent(FrameworkElement sender, object e)
        {
            var border = (Border)sender;
            var imageBrush = GetImageBrush(border);
            if (imageBrush != null)
            {
                var bitmapImage = imageBrush.ImageSource as BitmapImage;
                bitmapImage.DecodePixelHeight = (int)sender.Height;
                bitmapImage.DecodePixelWidth = (int)sender.Width;
                imageBrush.Stretch = Stretch.Fill;
            }

            GetEventDispatcher(border).DispatchEvent(new ReactImageLoadEvent(border.GetTag(), ReactImageLoadEvent.OnLoadStart));
        }

        /// <summary>
        /// The <see cref="Border"/> event interceptor for image load completed events for the native control.
        /// </summary>
        /// <param name="sender">The source sender view.</param>
        /// <param name="event">The received event arguments.</param>
        protected void OnInterceptImageLoadedEvent(object sender, RoutedEventArgs e)
        {
            var senderImage = (Border)sender;
            if (_FadeDurationMS > 0)
            {
                var fadeStoryBoard = new Storyboard() { };
                var easingFunction = new BackEase() { EasingMode = EasingMode.EaseIn, Amplitude = .5 };
                fadeStoryBoard.SetOpacityTimeline(easingFunction, senderImage, 0, 1, _FadeDurationMS);
                fadeStoryBoard.Begin();
            }

            GetEventDispatcher(senderImage).DispatchEvent(new ReactImageLoadEvent(senderImage.GetTag(), ReactImageLoadEvent.OnLoadEnd));
        }

        private ImageBrush GetImageBrush(Border border)
        {
            return border.Background as ImageBrush;
        }

        private static EventDispatcher GetEventDispatcher(FrameworkElement image)
        {
            return image.GetReactContext().CatalystInstance.GetNativeModule<UIManagerModule>().EventDispatcher;
        }
    }
}
