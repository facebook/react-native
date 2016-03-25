using ReactNative.UIManager;
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
    public class ReactImageManager : SimpleViewManager<Border>
    {
        private readonly Dictionary<Border, ExceptionRoutedEventHandler> _imageFailedHandlers =
            new Dictionary<Border, ExceptionRoutedEventHandler>();

        private readonly Dictionary<Border, RoutedEventHandler> _imageOpenedHandlers =
            new Dictionary<Border, RoutedEventHandler>();

        /// <summary>
        /// The view manager name.
        /// </summary>
        public override string Name
        {
            get
            {
                return "RCTImageView";
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
                    {
                        "topLoadStart",
                        new Dictionary<string, object>
                        {
                            { "registrationName", "onLoadStart" }
                        }
                    },
                    {
                        "topLoad",
                        new Dictionary<string, object>
                        {
                            { "registrationName", "onLoad" }
                        }
                    },
                    {
                        "topLoadEnd",
                        new Dictionary<string, object>
                        {
                            { "registrationName", "onLoadEnd" }
                        }
                    },
                };
            }
        }

        /// <summary>
        /// Set the source URI of the image.
        /// </summary>
        /// <param name="view">The image view instance.</param>
        /// <param name="source">The source URI.</param>
        [ReactProperty("src")]
        public void SetSource(Border view, string source)
        {
            var imageBrush = (ImageBrush)view.Background;
            imageBrush.ImageSource = new BitmapImage(new Uri(source));

            view.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new ReactImageLoadEvent(
                        view.GetTag(),
                        ReactImageLoadEvent.OnLoadStart));
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
            view.BorderBrush = color.HasValue
                ? new SolidColorBrush(ColorHelpers.Parse(color.Value))
                : null;
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
        /// Called when view is detached from view hierarchy and allows for 
        /// additional cleanup.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view.</param>
        public override void OnDropViewInstance(ThemedReactContext reactContext, Border view)
        {
            var imageBrush = (ImageBrush)view.Background;

            var imageFailedHandler = default(ExceptionRoutedEventHandler);
            if (_imageFailedHandlers.TryGetValue(view, out imageFailedHandler))
            {
                _imageFailedHandlers.Remove(view);
                imageBrush.ImageFailed -= imageFailedHandler;
            }

            var imageOpenedHandler = default(RoutedEventHandler);
            if (_imageOpenedHandlers.TryGetValue(view, out imageOpenedHandler))
            {
                _imageOpenedHandlers.Remove(view);
                imageBrush.ImageOpened -= imageOpenedHandler;
            }
        }

        /// <summary>
        /// Creates the image view instance.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The image view instance.</returns>
        protected override Border CreateViewInstance(ThemedReactContext reactContext)
        {
            return new Border
            {
                Background = new ImageBrush(),
            };
        }

        /// <summary>
        /// Install custom event emitters on the given view.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view instance.</param>
        protected override void AddEventEmitters(ThemedReactContext reactContext, Border view)
        {
            var imageBrush = (ImageBrush)view.Background;

            var imageFailedHandler = new ExceptionRoutedEventHandler(
                (sender, args) => OnImageFailed(view, args));

            imageBrush.ImageFailed += imageFailedHandler;

            var imageOpenedHandler = new RoutedEventHandler(
                (sender, args) => OnImageOpened(view, args));

            imageBrush.ImageOpened += imageOpenedHandler;

            _imageFailedHandlers.Add(view, imageFailedHandler);
        }

        private void OnImageFailed(Border view, ExceptionRoutedEventArgs args)
        {
            view.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new ReactImageLoadEvent(
                        view.GetTag(),
                        ReactImageLoadEvent.OnLoadEnd));
        }

        private void OnImageOpened(Border view, RoutedEventArgs args)
        {
            var eventDispatcher = view.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher;

            eventDispatcher.DispatchEvent(
                new ReactImageLoadEvent(
                    view.GetTag(),
                    ReactImageLoadEvent.OnLoad));

            eventDispatcher.DispatchEvent(
                new ReactImageLoadEvent(
                    view.GetTag(),
                    ReactImageLoadEvent.OnLoadEnd));
        }
    }
}
