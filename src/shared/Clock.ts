export default interface Clock {
  now(): Date;
  nowISOString(): string;
  today(): Date;
}
