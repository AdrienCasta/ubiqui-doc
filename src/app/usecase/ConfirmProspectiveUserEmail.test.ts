import { randomUUID } from 'crypto';
import InMemoryUserRepository from '../../infra/repository/InMemoryUserRepository';
import FakeSendConfirmationEmailService from '../../infra/service/FakeSendConfirmationEmailService';
import RegisterProspectiveUserCommandHandler, {
  RegisterProspectiveUserCommandHandlerErrors,
} from '../handler/RegisterProspectiveUserCommandHandler';
import RegisterProspectiveUser from './RegisterProspectiveUser';
import InMemoryEmailConfirmationTokenRepository from '../../infra/repository/InMemoryEmailConfirmationTokenRepository';
import ConfirmProspectiveUserEmail from './ConfirmProspectiveUserEmail';
import SystemClock from '../../shared/SystemClock';
import EmailVerificationTokenService from '../services/EmailVerificationTokenService';
import UserRepository from '../../domain/repository/UserRepository';
import EmailConfirmationTokenRepository from '../../domain/repository/EmailConfirmationTokenRepository';

describe('ConfirmProspectiveUserEmail', () => {
  const clock = new SystemClock();
  let sendConfirmationEmailService: FakeSendConfirmationEmailService;
  let userRepository: UserRepository;
  let emailConfirmationTokenRepository: EmailConfirmationTokenRepository;
  let registerProspectiveUser: RegisterProspectiveUser;
  let confirmProspectiveUserEmail: ConfirmProspectiveUserEmail;

  beforeEach(async () => {
    sendConfirmationEmailService = new FakeSendConfirmationEmailService();
    userRepository = new InMemoryUserRepository();
    emailConfirmationTokenRepository =
      new InMemoryEmailConfirmationTokenRepository();

    registerProspectiveUser = new RegisterProspectiveUser(
      new RegisterProspectiveUserCommandHandler(
        userRepository,
        emailConfirmationTokenRepository,
        sendConfirmationEmailService,
        new EmailVerificationTokenService(
          () => 'token',
          () => new Date(),
          clock,
        ),
      ),
    );
    confirmProspectiveUserEmail = new ConfirmProspectiveUserEmail(
      userRepository,
      emailConfirmationTokenRepository,
      clock,
    );
  });

  it('confirms prospective user email unexpired token', async () => {
    const registerProspectiveUserCommand = {
      user: {
        id: randomUUID(),
        email: 'john@doe.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123!',
      },
    };

    await registerProspectiveUser.execute(registerProspectiveUserCommand);

    const confirmationResult = await confirmProspectiveUserEmail.execute(
      registerProspectiveUserCommand.user.email,
      'token',
    );

    expect(confirmationResult.isSuccess()).toBe(true);

    const user = await userRepository.findByEmail(
      registerProspectiveUserCommand.user.email,
    );
    expect(user?.emailConfirmed).toBe(true);
  });

  it('does not confirm prospective user email because all token expired', async () => {
    const expired1MinAgo = (date: Date) => new Date(date.getTime() - 60000);

    registerProspectiveUser = new RegisterProspectiveUser(
      new RegisterProspectiveUserCommandHandler(
        userRepository,
        emailConfirmationTokenRepository,
        sendConfirmationEmailService,
        new EmailVerificationTokenService(() => 'token', expired1MinAgo, clock),
      ),
    );

    const registerProspectiveUserCommand = {
      user: {
        id: randomUUID(),
        email: 'john@doe.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123!',
      },
    };
    await registerProspectiveUser.execute(registerProspectiveUserCommand);
    const confirmationResult = await confirmProspectiveUserEmail.execute(
      registerProspectiveUserCommand.user.email,
      'token',
    );

    expect(confirmationResult.isFailure()).toBe(true);
  });
  it('invites user to confirm email because token is not expired yet', async () => {
    const registerProspectiveUserCommand = {
      user: {
        id: randomUUID(),
        email: 'john@doe.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123!',
      },
    };

    await registerProspectiveUser.execute(registerProspectiveUserCommand);

    const attemptToRegisterAgain = await registerProspectiveUser.execute({
      user: registerProspectiveUserCommand.user,
    });

    expect(attemptToRegisterAgain.isFailure()).toBe(true);
    expect(attemptToRegisterAgain.getError()).toBeInstanceOf(
      RegisterProspectiveUserCommandHandlerErrors.EmailUnconfirmedError,
    );
  });
});
