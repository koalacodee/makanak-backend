import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { UnauthorizedError } from '../../../shared/presentation/errors'
import type {
  IRefreshTokenRepository,
  IUserRepository,
} from '../domain/auth.iface'
import type { RefreshToken, User } from '../domain/user.entity'
import { LoginUseCase } from './login.use-case'

describe('LoginUseCase', () => {
  let useCase: LoginUseCase
  let mockUserRepo: IUserRepository
  let mockRefreshTokenRepo: IRefreshTokenRepository
  let mockAccessJwt: { sign: ReturnType<typeof mock> }
  let mockRefreshJwt: { sign: ReturnType<typeof mock> }

  beforeEach(() => {
    useCase = new LoginUseCase()
    mockUserRepo = {
      findById: mock(() => Promise.resolve(null)),
      findByUsername: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as User)),
      update: mock(() => Promise.resolve({} as User)),
      delete: mock(() => Promise.resolve()),
      updateLastLogin: mock(() => Promise.resolve()),
    }
    mockRefreshTokenRepo = {
      create: mock(() => Promise.resolve({} as RefreshToken)),
      findByTokenHash: mock(() => Promise.resolve(null)),
      findByUserId: mock(() => Promise.resolve([])),
      revokeToken: mock(() => Promise.resolve()),
      revokeAllUserTokens: mock(() => Promise.resolve()),
      deleteExpiredTokens: mock(() => Promise.resolve()),
    }
    mockAccessJwt = {
      sign: mock(() => Promise.resolve('access-token')),
    }
    mockRefreshJwt = {
      sign: mock(() => Promise.resolve('refresh-token')),
    }
  })

  it('should login successfully with valid credentials', async () => {
    const password = 'password123'
    const hashedPassword = await Bun.password.hash(password, 'argon2id')

    const mockUser: User = {
      id: 'user-1',
      username: 'testuser',
      passwordHash: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    }

    mockUserRepo.findByUsername = mock(() => Promise.resolve(mockUser))

    const result = await useCase.execute(
      'testuser',
      password,
      mockUserRepo,
      mockRefreshTokenRepo,
      mockAccessJwt,
      mockRefreshJwt,
    )

    expect(result.tokens.accessToken).toBe('access-token')
    expect(result.tokens.refreshToken).toBe('refresh-token')
    expect(result.user.id).toBe('user-1')
    expect(result.user.username).toBe('testuser')
    expect(result.user.role).toBe('admin')
    expect(mockUserRepo.updateLastLogin).toHaveBeenCalledWith('user-1')
    expect(mockRefreshTokenRepo.create).toHaveBeenCalled()
  })

  it('should throw UnauthorizedError when user not found', async () => {
    mockUserRepo.findByUsername = mock(() => Promise.resolve(null))

    await expect(
      useCase.execute(
        'nonexistent',
        'password',
        mockUserRepo,
        mockRefreshTokenRepo,
        mockAccessJwt,
        mockRefreshJwt,
      ),
    ).rejects.toThrow(UnauthorizedError)
    expect(mockRefreshTokenRepo.create).not.toHaveBeenCalled()
  })

  it('should throw UnauthorizedError when password is incorrect', async () => {
    const password = 'password123'
    const hashedPassword = await Bun.password.hash(password, 'argon2id')

    const mockUser: User = {
      id: 'user-1',
      username: 'testuser',
      passwordHash: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    }

    mockUserRepo.findByUsername = mock(() => Promise.resolve(mockUser))

    await expect(
      useCase.execute(
        'testuser',
        'wrongpassword',
        mockUserRepo,
        mockRefreshTokenRepo,
        mockAccessJwt,
        mockRefreshJwt,
      ),
    ).rejects.toThrow(UnauthorizedError)
    expect(mockRefreshTokenRepo.create).not.toHaveBeenCalled()
  })

  it('should generate tokens with correct payload', async () => {
    const password = 'password123'
    const hashedPassword = await Bun.password.hash(password, 'argon2id')

    const mockUser: User = {
      id: 'user-1',
      username: 'testuser',
      passwordHash: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    }

    mockUserRepo.findByUsername = mock(() => Promise.resolve(mockUser))

    await useCase.execute(
      'testuser',
      password,
      mockUserRepo,
      mockRefreshTokenRepo,
      mockAccessJwt,
      mockRefreshJwt,
    )

    expect(mockAccessJwt.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      role: 'admin',
    })
    expect(mockRefreshJwt.sign).toHaveBeenCalledWith({
      sub: 'user-1',
    })
  })
})
