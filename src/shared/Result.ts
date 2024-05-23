export default class Result<T, E> {
  constructor(
    private value?: T,
    private error?: E,
  ) {}

  static Success<T = void>(value?: T): Result<T, never> {
    return new Result<T, never>(value);
  }

  static Failure<E>(error: E): Result<never, E> {
    return new Result<never, E>(undefined, error);
  }

  isSuccess(): boolean {
    return this.error == null;
  }

  isFailure(): boolean {
    return this.error != null;
  }

  getValue(): T {
    if (this.error) {
      throw new Error('Cannot get the value of an error result');
    }
    return this.value as T;
  }

  getError(): E {
    if (this.value) {
      throw new Error('Cannot get the error of a successful result');
    }
    return this.error as E;
  }
  match<R>({
    onSuccess,
    onFailure,
  }: {
    onSuccess: (value: T) => R;
    onFailure: (error: E) => R;
  }): R {
    if (this.isSuccess()) {
      return onSuccess(this.value as T);
    } else {
      return onFailure(this.error as E);
    }
  }
}
