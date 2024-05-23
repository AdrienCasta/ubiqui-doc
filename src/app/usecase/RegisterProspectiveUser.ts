import RegisterProspectiveUserCommandHandler from '../handler/RegisterProspectiveUserCommandHandler';
import RegisterProspectiveUserCommand from '../../domain/command/RegisterProspectiveUserCommand';
import Result from '../../shared/Result';

export default class RegisterProspectiveUser {
  constructor(
    private readonly registerProspectiveUserCommandHandler: RegisterProspectiveUserCommandHandler,
  ) {}

  async execute(
    registerProspectiveUserCommand: RegisterProspectiveUserCommand,
  ): Promise<Result<void, Error>> {
    const registeredProspectiveUserOrError =
      await this.registerProspectiveUserCommandHandler.execute(
        registerProspectiveUserCommand,
      );

    if (registeredProspectiveUserOrError.isFailure()) {
      return Result.Failure(registeredProspectiveUserOrError.getError());
    }

    return Result.Success();
  }
}
