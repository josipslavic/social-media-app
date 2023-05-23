import Head from 'next/head';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import nookies, { destroyCookie } from 'nookies';
import Layout from '../components/Layout/Layout';
import baseUrl from '../utils/baseUrl';
import { redirectUser } from '../utils/authUser';
import 'semantic-ui-css/semantic.min.css';
import 'react-toastify/dist/ReactToastify.min.css';
import '../public/nprogress.css';
import '../public/styles.css';
import { io } from 'socket.io-client';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name='viewport' content='initial-scale=1.0, width=device-width' />
        <meta charSet='UTF-8' />
        <title>Mini Social Media</title>
      </Head>

      <ToastContainer
        position='bottom-center'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        pauseOnFocusLoss
        pauseOnHover={false}
      />

      <Layout {...pageProps}>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

MyApp.getInitialProps = async ({ Component, ctx }) => {
  const authToken = nookies.get(ctx)['Authorization'];

  let pageProps = {};

  const protectedRoutes =
    ctx.pathname === '/' ||
    ctx.pathname === '/[username]' ||
    ctx.pathname === '/notifications' ||
    ctx.pathname === '/post/[postId]' ||
    ctx.pathname === '/search';

  if (!authToken) {
    protectedRoutes && redirectUser(ctx, '/login');
  }
  //
  else {
    try {
      const getFollowingData =
        ctx.pathname === '/notifications' || ctx.pathname === '/[username]';

      const res = await axios.get(`${baseUrl}/auth`, {
        headers: { Cookie: `Authorization=${authToken}` },
        withCredentials: true,
        params: { getFollowingData },
      });

      const { user, userFollowStats } = res.data;

      if (user) !protectedRoutes && redirectUser(ctx, '/');

      pageProps.user = user;
      pageProps.userFollowStats = userFollowStats;
    } catch (error) {
      // destroyCookie(ctx, 'Authorization');
      redirectUser(ctx, '/login');
    }
  }

  return { pageProps };
};

export default MyApp;
