import SendResetPasswordEmailService from '../../domain/service/SendResetPasswordEmailService';
import Result from '../../shared/Result';

export default class FakeSendResetPasswordEmailService
  implements SendResetPasswordEmailService
{
  async execute(email: string, token: string) {
    console.log(email, token);
    return Result.Success();
  }
}
