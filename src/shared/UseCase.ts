export default interface UseCase<TCommand, TResult> {
  execute(command: TCommand): Promise<TResult>;
}
