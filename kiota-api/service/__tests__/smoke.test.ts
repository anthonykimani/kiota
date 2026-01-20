/**
 * Smoke Test
 * Verifies that the test setup is working correctly
 */

describe('Test Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should have access to environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should support async/await', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  it('should have jest matchers', () => {
    expect([1, 2, 3]).toContain(2);
    expect({ name: 'test' }).toHaveProperty('name');
    expect('hello world').toMatch(/world/);
  });
});
