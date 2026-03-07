/**
 * Jest Test Setup
 */
/// <reference types="jest" />

// Mock console to reduce noise during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Set test timeout
jest.setTimeout(10000);

