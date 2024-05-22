import SendConfirmationEmailService from '../../domain/service/SendConfirmationEmailService';
import Result from '../../shared/Result';

export default class FakeSendConfirmationEmailService
  implements SendConfirmationEmailService
{
  async execute(email: string) {
    console.log(`Sending confirmation email to ${email}`);
    return Result.Success();
  }
}
