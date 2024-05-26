import SystemClock from '../../shared/SystemClock';

export default class EmailVerificationTokenService {
  constructor(
    private readonly tokenGenerator: ITokenGenerator = generateRandomToken,
    private readonly setExpirationDate: ISetExpirationDate = set24HoursExpirationDate,
    private readonly clock: SystemClock = new SystemClock(),
  ) {}

  execute() {
    return {
      token: this.tokenGenerator(),
      expiresAt: this.setExpirationDate(this.clock.now()),
    };
  }
}

type ITokenGenerator = () => string;
type ISetExpirationDate = (date: Date) => Date;

export interface IDateProvider {
  addHours(date: Date, hours: number): Date;
}

function generateRandomToken() {
  return crypto.randomUUID();
}

function set24HoursExpirationDate(date: Date) {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}
