import SystemClock from '../../shared/SystemClock';
import EmailVerificationTokenService from './EmailVerificationTokenService';

describe('EmailVerificationTokenService', () => {
  const fakeTokenGeneratorProvider = () => '1234567890';
  const set1HourExpirationDate = (date: Date) => {
    return new Date(date.getTime() + 1 * 60 * 60 * 1000);
  };

  it('generates a token', async () => {
    const clock = new SystemClock();

    const emailConfirmationTokenService = new EmailVerificationTokenService(
      fakeTokenGeneratorProvider,
      set1HourExpirationDate,
      clock,
    );

    const emailConfirmationToken =
      await emailConfirmationTokenService.execute();

    expect(emailConfirmationToken).toStrictEqual({
      token: '1234567890',
      expiresAt: new Date(clock.now().getTime() + 1 * 60 * 60 * 1000),
    });
  });
});
