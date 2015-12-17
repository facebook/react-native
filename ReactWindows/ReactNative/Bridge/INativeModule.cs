using System.Collections.Generic;

namespace ReactNative.Bridge
{
    public interface INativeModule
    {
        bool CanOverrideExistingModule { get; }

        IReadOnlyDictionary<string, object> Constants { get; }

        IReadOnlyDictionary<string, INativeMethod> Methods { get; }

        string Name { get; }

        void Initialize();

        void OnCatalystInstanceDispose();
    }
}
