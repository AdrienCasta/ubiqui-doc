import ResendEmailVerificationCommand from '../../domain/command/ResendEmailVerificationCommand';
import ResendEmailVerificationCommandHandler from '../handler/ResendEmailVerificationCommandHandler';

export default class ResendEmailVerification {
  constructor(
    private readonly resendEmailVerificationCommandHandler: ResendEmailVerificationCommandHandler,
  ) {}

  execute(command: ResendEmailVerificationCommand) {
    return this.resendEmailVerificationCommandHandler.execute(command);
  }
}
