import Result from '../../shared/Result';

export default interface SendConfirmationEmailService {
  execute(email: string): Promise<Result<void, Error>>;
}
