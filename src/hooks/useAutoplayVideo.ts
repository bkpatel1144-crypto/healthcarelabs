import { useEffect, useRef } from 'react';

/**
 * Keeps a muted background video playing.
 *
 * `autoplay` alone is not reliable: some mobile Chrome builds and data-saver
 * modes leave a muted inline video paused even though the policy permits it,
 * and a video that has not been laid out yet can drop the initial play. This
 * retries play() on every event that could unblock it — metadata arriving,
 * the element scrolling into view, the tab becoming visible, or the visitor's
 * first interaction — and stops retrying once it is running.
 *
 * Reduced motion is deliberately ignored. The client asked for the video to
 * start on its own, without a button, and Windows' "show animations off"
 * setting reports as reduced motion, which had been silently withholding it.
 */
export function useAutoplayVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // A rejected play() promise is expected on a blocked attempt, not an error.
    const attempt = () => {
      if (!video.paused) return;
      video.play().catch(() => {});
    };

    attempt();

    const events: (keyof HTMLMediaElementEventMap)[] = [
      'loadedmetadata',
      'loadeddata',
      'canplay',
      'stalled',
      'suspend',
    ];
    events.forEach((e) => video.addEventListener(e, attempt));

    // Play only while on screen; a paused off-screen video wastes nothing.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) attempt();
          else if (!video.paused) video.pause();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(video);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') attempt();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Last resort: the first gesture anywhere on the page satisfies every
    // autoplay policy there is. Fires once, then removes itself.
    const gestures = ['pointerdown', 'touchstart', 'keydown', 'scroll'] as const;
    const onGesture = () => {
      attempt();
      gestures.forEach((e) => window.removeEventListener(e, onGesture));
    };
    gestures.forEach((e) => window.addEventListener(e, onGesture, { passive: true, once: false }));

    return () => {
      events.forEach((e) => video.removeEventListener(e, attempt));
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      gestures.forEach((e) => window.removeEventListener(e, onGesture));
    };
  }, []);

  return ref;
}
