import { UUID } from 'crypto';
import User from '../../domain/entity/User';
import UserRepository from '../../domain/repository/UserRepository';
import Result from '../../shared/Result';

export default class InMemoryUserRepository implements UserRepository {
  users: User[] = [];
  async createUser(user: User): Promise<Result<void, Error>> {
    this.users.push(user);
    return Result.Success();
  }
  async getUserById(userId: UUID): Promise<User | undefined> {
    return Promise.resolve(this.users.find((user) => user.id === userId));
  }
  async findByEmail(email: string): Promise<User | undefined> {
    return Promise.resolve(this.users.find((user) => user.email === email));
  }
  async updateUser(userId: UUID, user: Partial<User>): Promise<void> {
    this.users = this.users.map((_user) =>
      _user.id === userId ? { ..._user, ...user } : _user,
    );
  }
}
