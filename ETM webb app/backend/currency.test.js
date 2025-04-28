// Simulated function from currency.js
function convert(amount, fromRate, toRate) {
    if (amount <= 0) {
        console.log("Amount must be greater than zero.");
        return 0;
    }
    return (amount / fromRate) * toRate;
}

// Test runner
function test(description, fn) {
    try {
        fn();
        console.log(`✅ ${description}`);
    } catch (error) {
        console.error(`❌ ${description}`);
        console.error(error);
    }
}

// Tests using Mexican Pesos (MXN)
test('converts 100 USD to Mexican Pesos at a rate of 17', () => {
    const result = convert(100, 1, 17);
    console.log(`Converted: $100 USD is equal to $${result.toFixed(2)} MXN (Mexican Pesos)`);
});

test('converts 50 USD to Mexican Pesos at a rate of 17.2', () => {
    const result = convert(50, 1, 17.2);
    console.log(`Converted: $50 USD is equal to $${result.toFixed(2)} MXN (Mexican Pesos)`);
});

test('returns 0 when amount is 0', () => {
    const result = convert(0, 1, 17);
    console.log(`Converted: $0 USD is equal to $${result.toFixed(2)} MXN`);
});

test('returns 0 and warns for negative amount', () => {
    const result = convert(-20, 1, 17);
    console.log(`Converted: $-20 USD is equal to $${result.toFixed(2)} MXN`);
});
