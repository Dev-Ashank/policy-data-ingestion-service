/**
 * Test fixtures for unit and integration tests
 */

const mockAgentData = {
    name: 'John Doe'
};

const mockUserData = {
    name: 'Alice Smith',
    email: 'alice@example.com',
    gender: 'Female'
};

const mockAccountData = {
    accountName: 'Premium Account'
};

const mockPolicyCategoryData = {
    categoryName: 'Vehicle'
};

const mockPolicyCarrierData = {
    companyName: 'ABC Insurance'
};

const mockPolicyData = (agentId, userId, categoryId, carrierId, accountId = null) => ({
    policyNumber: 'POL-001',
    policyMode: 'Online',
    producer: 'Bob Johnson',
    premiumAmount: 1500,
    policyType: 'Auto',
    csr: 'High',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-01-01'),
    agent: agentId,
    user: userId,
    account: accountId,
    policyCategory: categoryId,
    policyCarrier: carrierId
});

const mockCSVRow = {
    Agent: 'John Doe',
    User: 'Alice Smith',
    Email: 'alice@example.com',
    Gender: 'Female',
    'Policy Mode': 'Online',
    Producer: 'Bob Johnson',
    'Policy Number': 'POL-001',
    'Premium Amount': '1500',
    'Policy Type': 'Auto',
    Company: 'ABC Insurance',
    Category: 'Vehicle',
    'Start Date': '2024-01-01',
    'End Date': '2025-01-01',
    CSR: 'High'
};

const mockCSVData = [
    mockCSVRow,
    {
        Agent: 'Jane Smith',
        User: 'Bob Williams',
        Email: 'bob@example.com',
        Gender: 'Male',
        'Policy Mode': 'Offline',
        Producer: 'Carol Davis',
        'Policy Number': 'POL-002',
        'Premium Amount': '2000',
        'Policy Type': 'Home',
        Company: 'XYZ Insurance',
        Category: 'Property',
        'Start Date': '2024-02-01',
        'End Date': '2025-02-01',
        CSR: 'Medium'
    }
];

const mockScheduledMessage = {
    message: 'Test scheduled message',
    scheduledFor: new Date('2024-12-31T23:59:59Z')
};

module.exports = {
    mockAgentData,
    mockUserData,
    mockAccountData,
    mockPolicyCategoryData,
    mockPolicyCarrierData,
    mockPolicyData,
    mockCSVRow,
    mockCSVData,
    mockScheduledMessage
};
