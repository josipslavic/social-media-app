import axios from 'axios';
import baseUrl from './baseUrl';
import catchErrors from './catchErrors';
import cookie from 'js-cookie';

export const loginUser = async (user, setError, setLoading) => {
  setLoading(true);
  try {
    await axios.post(
      `${baseUrl}/auth/login`,
      { ...user },
      { withCredentials: true }
    );
    cookie.set('userEmail', user.email);
    window.location.href = '/';
  } catch (error) {
    setError(catchErrors(error));
  }
  setLoading(false);
};

export const redirectUser = (ctx, location) => {
  if (ctx.req) {
    ctx.res.writeHead(302, { Location: location });
    ctx.res.end();
  } else {
    window.location.href = location;
  }
};

export const logoutUser = async (email) => {
  await axios.post(`${baseUrl}/auth/logout`, {}, { withCredentials: true });
  cookie.remove('userEmail', email);
  window.location.href = '/login';
};
