import UserRepository from '../../domain/repository/UserRepository';

export default class CheckUserRegistrationStatusService {
  static async byEmail(
    userRepository: UserRepository,
    email: string,
  ): Promise<
    | { isRegistered: false; isConfirmed: false }
    | { isRegistered: true; isConfirmed: boolean }
  > {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return { isRegistered: false, isConfirmed: false };
    }

    return { isRegistered: true, isConfirmed: user.emailConfirmed };
  }
}
