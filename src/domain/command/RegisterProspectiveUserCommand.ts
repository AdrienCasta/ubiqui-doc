import { UUID } from 'crypto';

export default interface RegisterProspectiveUserCommand {
  user: {
    id?: UUID;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  };
}
