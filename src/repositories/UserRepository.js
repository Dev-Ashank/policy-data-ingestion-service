const User = require('../models/User');

class UserRepository {
    async create(userData) {
        const user = new User(userData);
        return await user.save();
    }

    async findByEmail(email) {
        return await User.findOne({ email: email.toLowerCase() });
    }

    async findOrCreate(userData) {
        let user = await this.findByEmail(userData.email);
        if (!user) {
            user = await this.create(userData);
        }
        return user;
    }

    async findById(id) {
        return await User.findById(id);
    }

    async findAll() {
        return await User.find();
    }
}

module.exports = new UserRepository();
