document.addEventListener('DOMContentLoaded', () => {
  const steps = ['full', 'mobile', 'desktop', 'laptop', 'mobile2', 'full2'];
  const intervals = [1250, 1500, 1500, 1500, 1500, 1250];

  let i = 0;
  const timeouts = [];

  const logo = document.querySelector('.LogoAnimation');

  function animateStep() {
    const prev = steps[i];
    logo.classList.remove(prev);
    i = (i + 1) % steps.length;
    const current = steps[i];
    const timeout = intervals[i];
    logo.classList.add(current);

    timeouts.push(setTimeout(animateStep, timeout));
  }

  // only start the animation if the document is visible on load
  if (!document.hidden) {
    timeouts.push(
      setTimeout(() => {
        logo.classList.remove('init');
        animateStep();
      }, 2000)
    );
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        timeouts.forEach(timeout => {
          clearTimeout(timeout);
        });
        // clear the timeouts array
        timeouts.length = 0;
      } else {
        // restart the animation when visible
        animateStep();
      }
    },
    false
  );
});
