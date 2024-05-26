import Result from '../../shared/Result';

export default interface SendResetPasswordEmailService {
  execute(email: string, token: string): Promise<Result<void, Error>>;
}
