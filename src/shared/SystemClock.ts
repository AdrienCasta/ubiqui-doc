import Clock from './Clock';

export default class SystemClock implements Clock {
  constructor(private readonly currentDate: Date = new Date()) {}

  now() {
    return new Date(this.currentDate);
  }

  nowISOString() {
    return this.now().toISOString();
  }

  today() {
    return new Date(this.now().toDateString());
  }
}
