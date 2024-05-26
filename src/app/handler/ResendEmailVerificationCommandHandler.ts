import ResendEmailVerificationCommand from '../../domain/command/ResendEmailVerificationCommand';
import EmailConfirmationTokenRepository from '../../domain/repository/EmailConfirmationTokenRepository';
import UserRepository from '../../domain/repository/UserRepository';
import SendConfirmationEmailService from '../../domain/service/SendConfirmationEmailService';
import Result from '../../shared/Result';
import EmailVerificationTokenService from '../services/EmailVerificationTokenService';

export default class ResendEmailVerificationCommandHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailConfirmationTokenRepository: EmailConfirmationTokenRepository,
    private readonly sendConfirmationEmailService: SendConfirmationEmailService,
    private readonly emailVerificationTokenService: EmailVerificationTokenService,
  ) {}

  async execute(command: ResendEmailVerificationCommand) {
    const user = await this.userRepository.findByEmail(command.email);

    if (!user) {
      return Result.Failure(new UserNotFoundError());
    }

    if (user.emailConfirmed) {
      return Result.Failure(new UserAlreadyConfirmedError());
    }

    const { token, expiresAt } = this.emailVerificationTokenService.execute();

    await this.emailConfirmationTokenRepository.save({
      userId: user.id,
      token,
      expiresAt,
    });

    return this.sendConfirmationEmailService.execute(command.email, token);
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('User not found');
  }
}

export class UserAlreadyConfirmedError extends Error {
  constructor() {
    super('User already confirmed');
  }
}
