import SendConfirmationEmailService from '../../domain/service/SendConfirmationEmailService';
import Result from '../../shared/Result';

export default class FakeSendConfirmationEmailService
  implements SendConfirmationEmailService
{
  async execute(email: string, token: string) {
    console.log(`Sending confirmation email to ${email} with token ${token}`);
    return Result.Success();
  }
}
