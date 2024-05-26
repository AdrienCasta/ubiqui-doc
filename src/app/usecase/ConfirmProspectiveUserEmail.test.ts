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

describe('ConfirmProspectiveUserEmail', () => {
  let sendConfirmationEmailService: FakeSendConfirmationEmailService;
  let userRepository: InMemoryUserRepository;
  let emailConfirmationTokenRepository: InMemoryEmailConfirmationTokenRepository;
  let registerProspectiveUserCommandHandler: RegisterProspectiveUserCommandHandler;
  let registerProspectiveUser: RegisterProspectiveUser;
  let confirmProspectiveUserEmail: ConfirmProspectiveUserEmail;
  let emailVerificationTokenService: EmailVerificationTokenService;

  const clock = new SystemClock();

  beforeEach(async () => {
    sendConfirmationEmailService = new FakeSendConfirmationEmailService();
    emailVerificationTokenService = new EmailVerificationTokenService(
      () => 'token',
      () => new Date(),
      clock,
    );
    userRepository = new InMemoryUserRepository();
    emailConfirmationTokenRepository =
      new InMemoryEmailConfirmationTokenRepository();
    registerProspectiveUserCommandHandler =
      new RegisterProspectiveUserCommandHandler(
        userRepository,
        emailConfirmationTokenRepository,
        sendConfirmationEmailService,
        emailVerificationTokenService,
      );
    registerProspectiveUser = new RegisterProspectiveUser(
      registerProspectiveUserCommandHandler,
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
    const oneMinuteAgo = new Date(clock.now().getTime() - 60000);
    const oneMinuteFromNow = new Date(clock.now().getTime() + 60000);

    const registerProspectiveUserCommand = {
      user: {
        id: randomUUID(),
        email: 'john@doe.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123!',
      },
      confirmation: {
        token: 'token',
        expiresAt: oneMinuteAgo,
      },
    };

    const registerProspectiveUserAgain = {
      user: registerProspectiveUserCommand.user,
      confirmation: {
        ...registerProspectiveUserCommand.confirmation,
        expiresAt: oneMinuteFromNow,
      },
    };
    await registerProspectiveUser.execute(registerProspectiveUserCommand);
    const test = await registerProspectiveUser.execute(
      registerProspectiveUserAgain,
    );
    expect(test.isFailure()).toBe(true);
    console.log(test.getError());
    expect(test.getError()).toBeInstanceOf(
      RegisterProspectiveUserCommandHandlerErrors.EmailUnconfirmedError,
    );
  });
});
