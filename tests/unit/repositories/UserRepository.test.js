const User = require('../../../src/models/User');

describe('UserRepository', () => {
    let UserRepository;

    beforeAll(() => {
        UserRepository = require('../../../src/repositories/UserRepository');
    }); describe('create', () => {
        it('should create a new user', async () => {
            const userData = {
                name: 'Alice Smith',
                email: 'alice@example.com',
                gender: 'Female'
            };

            const result = await UserRepository.create(userData);

            expect(result).toBeDefined();
            expect(result.name).toBe(userData.name);
            expect(result.email).toBe(userData.email);
            expect(result._id).toBeDefined();
        });

        it('should throw error when email is missing', async () => {
            await expect(UserRepository.create({ name: 'John' })).rejects.toThrow();
        });

        it('should throw error for duplicate email', async () => {
            const userData = { name: 'User 1', email: 'duplicate@test.com' };
            await UserRepository.create(userData);

            await expect(
                UserRepository.create({ name: 'User 2', email: 'duplicate@test.com' })
            ).rejects.toThrow();
        });
    });

    describe('findByEmail', () => {
        it('should find user by email', async () => {
            const userData = {
                name: 'Bob Williams',
                email: 'bob@example.com'
            };
            await UserRepository.create(userData);

            const result = await UserRepository.findByEmail('bob@example.com');

            expect(result).toBeDefined();
            expect(result.email).toBe(userData.email);
        });

        it('should return null if user not found', async () => {
            const result = await UserRepository.findByEmail('nonexistent@test.com');
            expect(result).toBeNull();
        });

        it('should be case insensitive', async () => {
            await UserRepository.create({
                name: 'Test User',
                email: 'TEST@EXAMPLE.COM'
            });

            const result = await UserRepository.findByEmail('test@example.com');
            expect(result).toBeDefined();
        });
    });

    describe('findOrCreate', () => {
        it('should return existing user if found', async () => {
            const userData = {
                name: 'Existing User',
                email: 'existing@test.com',
                gender: 'Male'
            };
            const created = await UserRepository.create(userData);

            const result = await UserRepository.findOrCreate(userData);

            expect(result._id.toString()).toBe(created._id.toString());
        });

        it('should create new user if not found', async () => {
            const userData = {
                name: 'New User',
                email: 'new@test.com',
                gender: 'Female'
            };

            const result = await UserRepository.findOrCreate(userData);

            expect(result).toBeDefined();
            expect(result.email).toBe(userData.email);
            expect(result._id).toBeDefined();
        });
    });

    describe('findById', () => {
        it('should find user by ID', async () => {
            const userData = {
                name: 'Test User',
                email: 'testid@example.com'
            };
            const created = await UserRepository.create(userData);

            const result = await UserRepository.findById(created._id);

            expect(result).toBeDefined();
            expect(result._id.toString()).toBe(created._id.toString());
        });

        it('should return null for invalid ID', async () => {
            const result = await UserRepository.findById('507f1f77bcf86cd799439011');
            expect(result).toBeNull();
        });
    });
});
