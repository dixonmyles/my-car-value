import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // Mock the UsersService dependency
    const users: User[] = [];
    mockUsersService = {
      find: (email: string) =>
        Promise.resolve(users.filter((user) => user.email === email)),
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should create a new user with a salted and hashed password', async () => {
    const user = await authService.signup('test@test.com', 'test');

    expect(user.password).not.toEqual('test');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('returns a user if correct password is provided', async () => {
    await authService.signup('test@test.com', 'test');
    const user = await authService.signin('test@test.com', 'test');
    expect(user).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await authService.signup('test@test.com', 'test');
    await expect(authService.signup('test@test.com', 'test')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws an error if signin is called with an unused email', async () => {
    await expect(authService.signin('test@test.com', 'test')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws an error if user signs in with wrong password', async () => {
    await authService.signup('test2@test.com', 'test');
    await expect(
      authService.signin('test2@test.com', 'tester'),
    ).rejects.toThrow(BadRequestException);
  });
});
