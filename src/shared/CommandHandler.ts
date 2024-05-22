export default interface CommandHandler<TCommand, TResult> {
  execute(command: TCommand): Promise<TResult>;
}
