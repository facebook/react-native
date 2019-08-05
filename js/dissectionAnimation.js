document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.NativeDevelopment');
  const dissection = document.querySelector('.NativeDevelopment .dissection');
  const images = dissection.children;
  const numImages = images.length;

  const fadeDistance = 40;
  const navbarHeight = 60;

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  // Scale the percent so that `min` goes to 0% and `max` goes to 100%
  function scalePercent(percent, min, max) {
    const scale = max - min;
    return clamp((percent - min) / scale, 0, 1);
  }

  // Get the percentage that the image should be on the screen given
  // how much the entire container is scrolled
  // so we can fine-tune at what screen % the animation starts and stops
  function getImagePercent(index, scrollPercent) {
    const start = index / numImages;
    return clamp((scrollPercent - start) * numImages, 0, 1);
  }

  window.addEventListener('scroll', () => {
    const elPos = section.getBoundingClientRect().top - navbarHeight;
    const height = window.innerHeight;
    const screenPercent = 1 - clamp(elPos / height, 0, 1);
    const scaledPercent = scalePercent(screenPercent, 0.2, 0.9);
    for (let i = 0; i < numImages; i++) {
      const imgPercent = getImagePercent(i, scaledPercent);
      images[i].style.opacity = imgPercent;

      const translation = fadeDistance * (1 - imgPercent);
      images[i].style.left = `${translation}px`;
    }
  });
});
