import EmailConfirmationTokenRepository from '../../domain/repository/EmailConfirmationTokenRepository';
import UserRepository from '../../domain/repository/UserRepository';
import Clock from '../../shared/Clock';
import Result from '../../shared/Result';

export default class ConfirmProspectiveUserEmail {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailConfirmationTokenRepository: EmailConfirmationTokenRepository,
    private readonly clock: Clock,
  ) {}

  async execute(email: string, verifyToken: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return Result.Failure('User not found');
    }
    const emailConfirmationTokens =
      await this.emailConfirmationTokenRepository.getTokensByUserId(user.id);

    const isSomeValidTokenExist = emailConfirmationTokens.find(
      ({ token, expiresAt }) => {
        return token === verifyToken && this.clock.now() < expiresAt;
      },
    );

    if (!isSomeValidTokenExist) {
      return Result.Failure('Token not found');
    }

    await this.userRepository.updateUser(user.id, {
      ...user,
      emailConfirmed: true,
    });
    return Result.Success();
  }
}
