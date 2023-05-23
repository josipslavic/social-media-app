export const MockedJwtService = {
  signAsync: jest.fn().mockResolvedValue('signedjwt'),
};
