import { DataSource } from 'typeorm';
import AppDataSource from '../../configs/ormconfig';

/**
 * Test Database Utilities
 * Helper functions for managing test database
 */

let testDataSource: DataSource | null = null;

/**
 * Initialize test database connection
 */
export async function initTestDatabase(): Promise<DataSource> {
  if (!testDataSource) {
    testDataSource = await AppDataSource.initialize();
  }
  return testDataSource;
}

/**
 * Close test database connection
 */
export async function closeTestDatabase(): Promise<void> {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
  }
}

/**
 * Clear all data from tables (for test isolation)
 */
export async function clearDatabase(): Promise<void> {
  if (!testDataSource || !testDataSource.isInitialized) {
    throw new Error('Database not initialized');
  }

  const entities = testDataSource.entityMetadatas;

  // Disable foreign key checks
  await testDataSource.query('SET CONSTRAINTS ALL DEFERRED');

  // Clear each table
  for (const entity of entities) {
    const repository = testDataSource.getRepository(entity.name);
    await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
  }

  // Re-enable foreign key checks
  await testDataSource.query('SET CONSTRAINTS ALL IMMEDIATE');
}

/**
 * Get test database instance
 */
export function getTestDatabase(): DataSource {
  if (!testDataSource) {
    throw new Error('Test database not initialized. Call initTestDatabase() first.');
  }
  return testDataSource;
}
