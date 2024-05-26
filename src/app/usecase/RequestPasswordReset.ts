import UserRepository from '../../domain/repository/UserRepository';
import Result from '../../shared/Result';
import CheckUserRegistrationStatusService from '../services/CheckUserRegistrationStatusService';
import ResetPasswordTokenService from '../services/ResetPassordTokenService';
import SendResetPasswordEmailService from '../../domain/service/SendResetPasswordEmailService';
import ResetPasswordTokenRepository from '../../domain/repository/ResetPasswordTokenRepository';

export default class RequestPasswordReset {
  constructor(
    private userRepository: UserRepository,
    private resetPasswordTokenRepository: ResetPasswordTokenRepository,
    private sendResetPasswordEmailService: SendResetPasswordEmailService,
    private resetPasswordTokenService: ResetPasswordTokenService,
  ) {}
  async execute(email: string) {
    const { isRegistered, isConfirmed } =
      await CheckUserRegistrationStatusService.byEmail(
        this.userRepository,
        email,
      );

    if (!isRegistered) {
      return Result.Failure(new UserNotFoundError());
    }
    if (!isConfirmed) {
      return Result.Failure(new UserNotConfirmedError());
    }

    const { token, expiresAt } = this.resetPasswordTokenService.execute();

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return Result.Failure(new UserNotFoundError());
    }
    await this.resetPasswordTokenRepository.save(user.id, token, expiresAt);

    const result = await this.sendResetPasswordEmailService.execute(
      email,
      token,
    );

    if (result.isFailure()) {
      return Result.Failure(new SendResetPasswordEmailServiceError());
    }
    return Result.Success();
  }
}

export class SendResetPasswordEmailServiceError extends Error {
  constructor() {
    super('Error sending reset password email');
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('User not found');
  }
}

export class UserNotConfirmedError extends Error {
  constructor() {
    super('User not confirmed');
  }
}
