import RegisterProspectiveUserCommandHandler from '../handler/RegisterProspectiveUserCommandHandler';
import SendConfirmationEmailService from '../../domain/service/SendConfirmationEmailService';
import RegisterProspectiveUserCommand from '../../domain/command/RegisterProspectiveUserCommand';
import Result from '../../shared/Result';

export default class RegisterProspectiveUser {
  constructor(
    private readonly registerProspectiveUserCommandHandler: RegisterProspectiveUserCommandHandler,
    private readonly sendConfirmationEmail: SendConfirmationEmailService,
  ) {}

  async execute(
    registerProspectiveUserCommand: RegisterProspectiveUserCommand,
  ): Promise<Result<void, Error>> {
    await this.registerProspectiveUserCommandHandler.execute(
      registerProspectiveUserCommand,
    );
    await this.sendConfirmationEmail.execute(
      registerProspectiveUserCommand.email,
    );
    return Result.Success();
  }
}
