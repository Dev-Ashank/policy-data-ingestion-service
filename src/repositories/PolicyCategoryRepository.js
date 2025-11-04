const PolicyCategory = require('../models/PolicyCategory');

class PolicyCategoryRepository {
    async create(categoryData) {
        const category = new PolicyCategory(categoryData);
        return await category.save();
    }

    async findByCategoryName(categoryName) {
        return await PolicyCategory.findOne({ categoryName });
    }

    async findOrCreate(categoryName) {
        let category = await this.findByCategoryName(categoryName);
        if (!category) {
            category = await this.create({ categoryName });
        }
        return category;
    }

    async findAll() {
        return await PolicyCategory.find();
    }
}

module.exports = new PolicyCategoryRepository();
