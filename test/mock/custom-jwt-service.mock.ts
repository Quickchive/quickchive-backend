export const customJwtServiceMock = {
  verify: jest.fn(),
  sign: jest.fn(),
  generateRefreshToken: jest.fn(),
  createPayload: jest.fn(),
};
