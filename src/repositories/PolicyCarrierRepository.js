const PolicyCarrier = require('../models/PolicyCarrier');

class PolicyCarrierRepository {
    async create(carrierData) {
        const carrier = new PolicyCarrier(carrierData);
        return await carrier.save();
    }

    async findByCompanyName(companyName) {
        return await PolicyCarrier.findOne({ companyName });
    }

    async findOrCreate(companyName) {
        let carrier = await this.findByCompanyName(companyName);
        if (!carrier) {
            carrier = await this.create({ companyName });
        }
        return carrier;
    }

    async findAll() {
        return await PolicyCarrier.find();
    }
}

module.exports = new PolicyCarrierRepository();
