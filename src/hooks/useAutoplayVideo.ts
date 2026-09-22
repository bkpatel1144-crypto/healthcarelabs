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
 *
 * Every retry is gated on the element being on screen. Without that gate the
 * retries fought the IntersectionObserver rather than complementing it: the
 * observer pauses on the way off screen and then never fires again, so a single
 * tab switch back — or any of the gesture triggers — restarted an off-screen
 * video that nothing would pause again, and it decoded for the rest of the
 * page. That is the whole basis on which the hero inset is affordable, so the
 * gate is load-bearing rather than tidy.
 */
export function useAutoplayVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    /*
      A rejected play() promise is expected on a blocked attempt, not an error.
      `pending` guards against issuing a second play() while the first is still
      resolving — an unguarded version thrashed when several triggers fired
      together and measured worse than doing nothing.
    */
    let pending = false;
    // Kept in step with the observer below; see the note in the docblock.
    let onScreen = true;
    const attempt = () => {
      if (!onScreen || !video.paused || pending) return;
      pending = true;
      video
        .play()
        .catch(() => {})
        .finally(() => {
          pending = false;
        });
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
          onScreen = entry.isIntersecting;
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
