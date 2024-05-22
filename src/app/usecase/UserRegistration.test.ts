import { createHash, randomUUID, UUID } from 'crypto';

describe('Successful user registration', () => {
  describe('Given a prospective user wants to register on the platform', () => {
    let registeredProspectiveUserId: UUID;
    let registerProspectiveUserCommand: RegisterProspectiveUserCommand;
    let userRepository: SQLiteUserRepository;
    let registerProspectiveUserCommandHandler: RegisterProspectiveUserCommandHandler;
    let registerProspectiveUser: RegisterProspectiveUser;

    beforeEach(() => {
      registeredProspectiveUserId = randomUUID();
      registerProspectiveUserCommand = {
        id: registeredProspectiveUserId,
        email: 'john@doe.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123',
      };
      userRepository = new SQLiteUserRepository();
      registerProspectiveUserCommandHandler =
        new RegisterProspectiveUserCommandHandler(userRepository);
      registerProspectiveUser = new RegisterProspectiveUser(
        userRepository,
        registerProspectiveUserCommandHandler,
      );
    });

    it('create a new user account with the following details', async () => {
      await registerProspectiveUser.execute(registerProspectiveUserCommand);

      const registeredProspectiveUser = await userRepository.getUserId(
        registeredProspectiveUserId,
      );

      expect(registeredProspectiveUser).toBeDefined();
      expect(registeredProspectiveUser?.emailConfirmed).toBe(false);
    });
  });
});

class RegisterProspectiveUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly registerNewUserCommandHandler: RegisterProspectiveUserCommandHandler,
  ) {}

  async execute(
    registerNewUserCommand: RegisterProspectiveUserCommand,
  ): Promise<Result<void, Error>> {
    return this.registerNewUserCommandHandler.execute(registerNewUserCommand);
  }
}

interface CommandHandler<TCommand, TResult> {
  execute(command: TCommand): Promise<TResult>;
}

class RegisterProspectiveUserCommandHandler
  implements
    CommandHandler<RegisterProspectiveUserCommand, Result<void, Error>>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    RegisterProspectiveUserCommand: RegisterProspectiveUserCommand,
  ): Promise<Result<void, Error>> {
    const user: ProspectiveUser = {
      ...RegisterProspectiveUserCommand,
      id: RegisterProspectiveUserCommand.id ?? randomUUID(),
      passwordHash: hashPassword(RegisterProspectiveUserCommand.password),
      emailConfirmed: false,
    };
    return this.userRepository.save(user);
  }
}

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

interface RegisterProspectiveUserCommand {
  id?: UUID;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}
interface ProspectiveUser {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  emailConfirmed: false;
}

interface UserRepository {
  save(user: ProspectiveUser): Promise<Result<void, Error>>;
  getUserId(userId: UUID): ProspectiveUser | undefined;
}

class SQLiteUserRepository implements UserRepository {
  users: ProspectiveUser[] = [];
  async save(user: ProspectiveUser): Promise<Result<void, Error>> {
    this.users.push(user);
    return Result.Success();
  }
  getUserId(userId: UUID): ProspectiveUser | undefined {
    return this.users.find((user) => user.id === userId);
  }
}

export default class Result<T, E> {
  constructor(
    private value?: T,
    private error?: E,
  ) {}

  static Success<T = void>(value?: T): Result<T, never> {
    return new Result<T, never>(value);
  }

  static Fail<E>(error: E): Result<never, E> {
    return new Result<never, E>(undefined, error);
  }

  isSuccess(): boolean {
    return this.error == null;
  }

  isFailure(): boolean {
    return this.error != null;
  }

  getValue(): T {
    if (this.error) {
      throw new Error('Cannot get the value of an error result');
    }
    return this.value as T;
  }

  getError(): E {
    if (this.value) {
      throw new Error('Cannot get the error of a successful result');
    }
    return this.error as E;
  }
  match<R>({
    onSuccess,
    onFailure,
  }: {
    onSuccess: (value: T) => R;
    onFailure: (error: E) => R;
  }): R {
    if (this.isSuccess()) {
      return onSuccess(this.value as T);
    } else {
      return onFailure(this.error as E);
    }
  }
}
