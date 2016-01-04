using Newtonsoft.Json.Linq;
using ReactNative.Views.View;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager {
    /// <summary>
    /// Base class that should be suitable for the majority of subclasses of <see cref="ViewManager"/>.
    /// It provides support for base view properties such as backgroundColor, opacity, etc.
    /// </summary>
    public abstract class BaseViewManager : ViewManager<ReactViewPanel, LayoutShadowNode>
    {
        private static readonly string PROP_DECOMPOSED_MATRIX_ROTATE = "rotate";
        private static readonly string PROP_DECOMPOSED_MATRIX_ROTATE_X = "rotateX";
        private static readonly string PROP_DECOMPOSED_MATRIX_ROTATE_Y = "rotateY";
        private static readonly string PROP_DECOMPOSED_MATRIX_SCALE_X = "scaleX";
        private static readonly string PROP_DECOMPOSED_MATRIX_SCALE_Y = "scaleY";
        private static readonly string PROP_DECOMPOSED_MATRIX_TRANSLATE_X = "translateX";
        private static readonly string PROP_DECOMPOSED_MATRIX_TRANSLATE_Y = "translateY";

        /// <summary>
        /// Sets the background color of the <see cref="ReactViewPanel"/>.
        /// </summary>
        /// <param name="view"></param>
        /// <param name="backgroundColor"></param>
       [ReactProperty("backgroundColor", CustomType="Color")]
       public void setBackgroundColor(ReactViewPanel view, string backgroundColor)
        {
            view.SetBackgroundColor(backgroundColor);
        }

        /// <summary>
        /// Set's the <see cref="ReactViewPanel"/> styling layout properties, based on the <see cref="JObject"/> map.
        /// </summary>
        /// <param name="view">The view to style.</param>
        /// <param name="decomposedMatrix">The requested styling properties to set.</param>
        [ReactProperty("C")]
        public void setDecomposedMatrix(ReactViewPanel view, JObject decomposedMatrix)
        {
            if (decomposedMatrix == null)
            {
                resetTransformMatrix(view);
            }
            else {
                setTransformMatrix(view, decomposedMatrix);
            }
        }

        /// <summary>
        /// Sets the opacity of the <see cref="ReactViewPanel"/>.
        /// </summary>
        /// <param name="view">The WPF view panel.</param>
        /// <param name="opacity"></param>
        [ReactProperty("opacity", DefaultFloat = 1)]
        public void setOpacity(ReactViewPanel view, float opacity)
        {
            view.Opacity = opacity;
        }

        /// <summary>
        /// Sets the scaleX property of the <see cref="ReactViewPanel"/>.
        /// </summary>
        /// <param name="view">The WPF view panel.</param>
        /// <param name="factor">The scaling factor.</param>
        [ReactProperty("scaleX", DefaultFloat = 1)]
        public void setScaleX(ReactViewPanel view, float factor)
        {
            view.setScaleX(factor);
        }

        /// <summary>
        /// Sets the scaleY property of the <see cref="ReactViewPanel"/>.
        /// </summary>
        /// <param name="view">The WPF view panel.</param>
        /// <param name="factor">The scaling factor.</param>
        [ReactProperty("scaleY", DefaultFloat = 1)]
        public void setScaleY(ReactViewPanel view, float factor)
        {
            view.setScaleY(factor);
        }

        /// <summary>
        /// Sets the translateX property of the <see cref="ReactViewPanel"/>.
        /// </summary>
        /// <param name="view">The WPF view panel.</param>
        /// <param name="factor">The scaling factor.</param>
        [ReactProperty("translationX", DefaultFloat = 1)]
        public void setTranslationX(ReactViewPanel view, float distance)
        {
            view.setTranslationX(distance);
        }

        /// <summary>
        /// Sets the translateY property of the <see cref="ReactViewPanel"/>.
        /// </summary>
        /// <param name="view">The WPF view panel.</param>
        /// <param name="factor">The scaling factor.</param>
        [ReactProperty("translationY", DefaultFloat = 1)]
        public void setTranslationY(ReactViewPanel view, float distance)
        {
            view.setTranslationY(distance);
        }

        /// <summary>
        /// Retrieves the property using the given name and type.
        /// </summary>
        /// <param name="decomposedMatrix">The JSON property map.</param>
        /// <param name="name">The property name.</param>
        /// <param name="type">The property type.</param>
        /// <returns></returns>
        public static object GetProperty(JObject decomposedMatrix, string name, Type type)
        {
            var token = default(JToken);
            if (decomposedMatrix.TryGetValue(name, out token))
            {
                return token.ToObject(type);
            }

            return null;
        }

        private static void setTransformMatrix(ReactViewPanel view, JObject matrix)
        {
            view.setTranslationX((float)GetProperty(matrix, PROP_DECOMPOSED_MATRIX_TRANSLATE_X, typeof(float)));
            view.setTranslationY((float)GetProperty(matrix, PROP_DECOMPOSED_MATRIX_TRANSLATE_Y, typeof(float)));
            view.setRotationX((float)GetProperty(matrix, PROP_DECOMPOSED_MATRIX_ROTATE_X, typeof(float)));
            view.setRotationY((float)GetProperty(matrix, PROP_DECOMPOSED_MATRIX_ROTATE_Y, typeof(float)));
            view.setScaleY((float)GetProperty(matrix, PROP_DECOMPOSED_MATRIX_SCALE_Y, typeof(float)));
            view.setScaleX((float)GetProperty(matrix, PROP_DECOMPOSED_MATRIX_SCALE_X, typeof(float)));
        }
        
        private static void resetTransformMatrix(ReactViewPanel view)
        {
            view.setTranslationX(0);
            view.setTranslationY(0);
            view.setRotationX(0);
            view.setRotationY(0);
            view.setScaleX(1);
            view.setScaleY(1);
        }
    }
}
