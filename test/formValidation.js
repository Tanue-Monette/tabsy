const assert = require('assert');

// 1. Test Login Form Validation Logic
function checkLoginValid(phoneInput, pinInput) {
    const phoneDigits = phoneInput.replace(/\D/g, "");
    const isValid = phoneDigits.length >= 9 && pinInput.length === 4;
    return isValid;
}

// 2. Test Register Form Validation Logic
function checkRegisterValid(shopName, merchantName, phoneInput, pinInput, termsChecked) {
    const phoneDigits = phoneInput.replace(/\D/g, "");
    const isValid =
        shopName.trim().length >= 2 &&
        merchantName.trim().length >= 2 &&
        phoneDigits.length >= 9 &&
        pinInput.length === 4 &&
        termsChecked;
    return isValid;
}

console.log("--- Testing Login Form Logic ---");
// Mobile formatted inputs (e.g. autofill or space on keypad)
assert.strictEqual(checkLoginValid("670 12 34 56", "1234"), true, "Mobile spaced phone should be valid");
assert.strictEqual(checkLoginValid("670123456", "1234"), true, "Unspaced phone should be valid");
assert.strictEqual(checkLoginValid("+237 670 123 456", "1234"), true, "Mobile +237 phone should be valid");
assert.strictEqual(checkLoginValid("6701234", "1234"), false, "Phone with < 9 digits should be invalid");
assert.strictEqual(checkLoginValid("670123456", "123"), false, "PIN < 4 digits should be invalid");

console.log("--- Testing Register Form Logic ---");
assert.strictEqual(checkRegisterValid("My Shop", "John Doe", "670 12 34 56", "1234", true), true, "Valid mobile register form");
assert.strictEqual(checkRegisterValid("My Shop", "John Doe", "670 12 34 56", "1234", false), false, "Unchecked terms should be invalid");
assert.strictEqual(checkRegisterValid("A", "John Doe", "670 12 34 56", "1234", true), false, "Short shop name should be invalid");

console.log("✅ All form validation unit tests passed successfully!");
