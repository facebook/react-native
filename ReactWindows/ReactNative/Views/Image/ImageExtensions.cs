using Microsoft.Graphics.Canvas;
using Microsoft.Graphics.Canvas.Effects;
using Microsoft.Graphics.Canvas.UI.Xaml;
using System;
using Windows.UI;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Media.Imaging;

namespace ReactNative.Views.Image
{
    static class ImageExtensions
    {
        /// <summary>
        /// Creates a bitmap background image for a <see cref="Border"/> component.
        /// </summary>
        /// <param name="border">The <see cref="Border"/> component to extend.</param>
        /// <param name="image">The image <see cref="Uri"/> to reference as the background.</param>
        public static void CreateBackgroundBitmapImage(this Border border, Uri image)
        {
            if (image != null)
            {
                var backgroundImage = new ImageBrush()
                {
                    ImageSource = new BitmapImage(image),
                };
                
                border.Background = backgroundImage;
            }
        }

        /// <summary>
        /// Creates a blended color effect on a <see cref="Border"/> background image.
        /// </summary>
        /// <param name="border">The <see cref="Border"/> component to extend.</param>
        /// <param name="image">The image <see cref="Uri"/> to reference as the background.</param>
        /// <param name="blendColor">The color blend to add as a image tint.</param>
        public static async void CreateColorBlendedImageSource(this Border border, Uri imagePath, Color blendColor)
        {
            using (var device = CanvasDevice.GetSharedDevice())
            {                
                var image = await CanvasBitmap.LoadAsync(device, imagePath);
                var imageSource = new CanvasImageSource(device, image.SizeInPixels.Width, image.SizeInPixels.Height, image.Dpi);

                using (var effect = new BlendEffect()
                {
                    Background = image,
                    Foreground = new ColorSourceEffect() { Color = blendColor },
                    Mode = BlendEffectMode.Multiply
                })
                {
                    using (var ds = imageSource.CreateDrawingSession(Colors.Transparent))
                    {
                        ds.DrawImage(effect);
                        border.Background = new ImageBrush()
                        {
                            ImageSource = imageSource
                        };
                    }
                }
                image.Dispose();
            }
        }
    }
}
