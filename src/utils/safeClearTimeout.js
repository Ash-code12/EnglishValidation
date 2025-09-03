export function safeClearTimeout(...timers) {
  timers.forEach(timer => {
    if (timer) {
        console.log("🕒 Clearing timeout:", timer);
        clearTimeout(timer);
    }
  });
}