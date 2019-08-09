import { User } from '../../models';

export const isLoggedIn = async (payload, fields) => {
  if (!payload || !payload.id || payload.requiresTFA) return false;

  var response = await User.findById(payload.id, fields || '_id');

  return response;
};
