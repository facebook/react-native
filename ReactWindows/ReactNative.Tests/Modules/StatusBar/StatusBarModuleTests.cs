using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Modules.StatusBar;
using System;
using System.Threading;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Storage;
using Windows.UI;

namespace ReactNative.Tests.Modules.StatusBar
{
    [TestClass]
    public class StatusBarModuleTests
    {
        [TestMethod]
        public void StatusBar_setColor()
        {
            var waitHandle = new AutoResetEvent(false);

            var statusbar = new MockStatusBar(waitHandle);
            var titlebar = new MockTitleBar(waitHandle);
            var module = CreateStatusBarModule(StatusBarModule.PlatformType.Mobile, statusbar, titlebar);

            var colorValue = 0xabcdefed;
            module.setColor(colorValue);

            waitHandle.WaitOne();

            var color = colorValue;
            var b = (byte)color;
            color >>= 8;
            var g = (byte)color;
            color >>= 8;
            var r = (byte)color;

            Assert.AreEqual(r, statusbar.BackgroundColor.Value.R);
            Assert.AreEqual(g, statusbar.BackgroundColor.Value.G);
            Assert.AreEqual(b, statusbar.BackgroundColor.Value.B);

            module = CreateStatusBarModule(StatusBarModule.PlatformType.Desktop, statusbar, titlebar);
            module.setColor(colorValue);

            waitHandle.WaitOne();

            Assert.AreEqual(r, titlebar.BackgroundColor.Value.R);
            Assert.AreEqual(g, titlebar.BackgroundColor.Value.G);
            Assert.AreEqual(b, titlebar.BackgroundColor.Value.B);
        }

        [TestMethod]
        public void StatusBar_setHidden()
        {
            var waitHandle = new AutoResetEvent(false);

            var statusbar = new MockStatusBar(waitHandle);
            var titlebar = new MockTitleBar(waitHandle);
            var module = CreateStatusBarModule(StatusBarModule.PlatformType.Mobile, statusbar, titlebar);

            module.setHidden(true);

            waitHandle.WaitOne();

            Assert.AreEqual(statusbar.Hidden, true);

            module.setHidden(false);

            waitHandle.WaitOne();

            Assert.AreEqual(statusbar.Hidden, false);
        }

        [TestMethod]
        public void StatusBar_setTranslucent()
        {
            var waitHandle = new AutoResetEvent(false);

            var statusbar = new MockStatusBar(waitHandle);
            var titlebar = new MockTitleBar(waitHandle);
            var module = CreateStatusBarModule(StatusBarModule.PlatformType.Mobile, statusbar, titlebar);

            module.setTranslucent(false);

            waitHandle.WaitOne();

            Assert.AreEqual(statusbar.BackgroundOpacity, 1.0);

            module.setTranslucent(true);

            waitHandle.WaitOne();

            Assert.AreEqual(statusbar.BackgroundOpacity, 0.5);
        }

        private static StatusBarModule CreateStatusBarModule(StatusBarModule.PlatformType platform, IStatusBar statusbar, ITitleBar titlebar)
        {
            return new StatusBarModule(platform, statusbar, titlebar);
        }

        class MockStatusBar : IStatusBar
        {
            private AutoResetEvent _waitHandle;

            private int _counter = 0;
            private bool _hidden = true;
            private Color? _backgroundColor = Colors.Black;
            private double _backgroundOpacity = 0.7;

            public MockStatusBar(AutoResetEvent waitHandle)
            {
                _waitHandle = waitHandle;
            }

            public bool Hidden
            {
                get
                {
                    return _hidden;
                }
            }

            public double BackgroundOpacity
            {
                get
                {
                    return _backgroundOpacity;
                }
                set
                {
                    _backgroundOpacity = value;
                    Signal();
                }
            }

            public Color? BackgroundColor
            {
                get
                {
                    return _backgroundColor;
                }
                set
                {
                    _backgroundColor = value;
                    Signal();
                }
            }

            public IAsyncAction HideAsync()
            {
                _hidden = true;
                Signal();

                Func<Task> action = async () =>  { await DummyTask(); };

                return action().AsAsyncAction();

            }

            public IAsyncAction ShowAsync()
            {
                _hidden = false;
                Signal();

                Func<Task> action = async () => { await DummyTask();  };

                return action().AsAsyncAction();
            }

            private void Signal()
            {
                // All three events must fire before waitHandle release
                if (++_counter == 3)
                {
                    _waitHandle.Set();
                    _counter = 0;
                }
            }

            private static async Task DummyTask()
            {
                try
                {
                    StorageFolder storageFolder = ApplicationData.Current.LocalFolder;
                    StorageFile file = await storageFolder.CreateFileAsync("DummyTestFile", CreationCollisionOption.ReplaceExisting);
                    await file.DeleteAsync();
                }
                catch (Exception) { }
            }
        }

        class MockTitleBar : ITitleBar
        {
            private AutoResetEvent _waitHandle;

            private Color? _backgroundColor = Colors.Black;

            public MockTitleBar(AutoResetEvent waitHandle)
            {
                _waitHandle = waitHandle;
            }

            public Color? BackgroundColor
            {
                get
                {
                    return _backgroundColor;
                }
                set
                {
                    _backgroundColor = value;
                    _waitHandle.Set();
                }
            }
        }
    }
}
