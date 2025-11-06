type Listener = (elapsedMs: number, isRunning: boolean) => void;

class TimerBus {
  private listeners = new Set<Listener>();
  private intervalId: any = null;
  private startAt: number | null = null; 
  private offsetMs = 0;                  
  private running = false;

  private tick = () => {
    const now = Date.now();
    const elapsed = this.running
      ? this.offsetMs + (now - (this.startAt as number))
      : this.offsetMs;
    for (const l of this.listeners) l(elapsed, this.running);
  };

  private ensureInterval() {
    if (this.intervalId) return;
    this.intervalId = setInterval(this.tick, 1000); // 1s heartbeat
  }

  private clearIntervalIfIdle() {
    if (!this.running && this.listeners.size === 0 && this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Start from 0 if never started, or resume if paused */
  start() {
    if (this.running) return;
    this.startAt = Date.now();
    this.running = true;
    this.ensureInterval();
    this.tick();
  }

  /** Pause (do not reset elapsed) */
  pause() {
    if (!this.running) return;
    const now = Date.now();
    this.offsetMs += now - (this.startAt as number);
    this.startAt = null;
    this.running = false;
    this.tick();
  }

  /** Stop and reset to 0 */
  stop() {
    // Same as pause, then reset all
    if (this.running) {
      const now = Date.now();
      this.offsetMs += now - (this.startAt as number);
    }
    this.startAt = null;
    this.running = false;
    this.offsetMs = 0;
    this.tick();
  }

  /** Get current elapsed ms */
  getElapsedMs() {
    const now = Date.now();
    return this.running
      ? this.offsetMs + (now - (this.startAt as number))
      : this.offsetMs;
  }

  /** Is the timer currently running? */
  isRunning() {
    return this.running;
  }

  /** Subscribe to ticks; returns unsubscribe */
  subscribe(listener: Listener) {
    this.listeners.add(listener);
    this.ensureInterval();
    // fire once immediately to sync UI
    listener(this.getElapsedMs(), this.running);
    return () => {
      this.listeners.delete(listener);
      this.clearIntervalIfIdle();
    };
  }
}

export const Timer = new TimerBus();
