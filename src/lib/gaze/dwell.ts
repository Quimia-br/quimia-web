export class Dwell<T> {
  private target: T | null = null;
  private started = 0;
  private fired = false;
  private duration: number;
  constructor(duration: number) {
    this.duration = duration;
  }

  reset() {
    this.target = null;
    this.fired = false;
    this.started = 0;
  }

  update(target: T | null, now: number) {
    if (target === null) {
      this.reset();
      return { progress: 0, activate: false };
    }
    if (target !== this.target) {
      this.target = target;
      this.started = now;
      this.fired = false;
    }
    const progress = Math.min(1, Math.max(0, (now - this.started) / this.duration));
    const activate = progress === 1 && !this.fired;
    if (activate) this.fired = true;
    return { progress, activate };
  }
}
