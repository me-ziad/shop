import React, { useState, useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate
} from 'react-router-dom';
import Layout from './Layout/Layout';
import NewAccount from './Auth/NewAccounts/NewAccount';
import SignIn from './Auth/SignIn/SignIn';
import NewPass from './newPass/NewPass';
import Home from './Home/Home';
import Profile from './Profile/Profile';
import ResetPassword from './Auth/Reset-password';
import Addproduct from './AddProduct/AddProduct';
import ProfileDetails from './ProfileDetails/ProfileDetails';
import Message from './Message/Message';
import Cart from './Cart/Cart';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { supabase } from './supabaseClient';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  useEffect(() => {
    const savedTheme = localStorage.getItem('preferredTheme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('preferredTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const fontFamily = isArabic
    ? 'IBM Plex Sans Arabic, sans-serif'
    : 'Inter, sans-serif';

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      background: {
        default: isDarkMode ? '#121212' : '#ffffff'
      }
    },
    direction: isArabic ? 'rtl' : 'ltr',
    typography: {
      fontFamily
    }
  });

   useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;  

  const routers = createBrowserRouter([
    {
      path: '',
      element: (
        <Layout toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      ),
      children: [
        { index: true, element: user ? <Home /> : <Navigate to="/signin" /> },
        { path: 'signin', element: user ? <Navigate to="/" /> : <SignIn /> },
        { path: 'newauth', element: <NewAccount /> },
        { path: 'newpassword', element: <NewPass /> },
        { path: 'resetpass', element: <ResetPassword /> },
        { path: 'profile', element: user ? <Profile /> : <Navigate to="/signin" /> },
        { path: 'addProduct', element: user ? <Addproduct /> : <Navigate to="/signin" /> },
        { path: 'profiledetails/:id', element: user ? <ProfileDetails /> : <Navigate to="/signin" /> },
        { path: 'message/:otherUserId?', element: user ? <Message /> : <Navigate to="/signin" /> },
        { path: 'cart', element: user ? <Cart /> : <Navigate to="/signin" /> }
      ]
    }
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-center" />
      <RouterProvider router={routers} />
    </ThemeProvider>
  );
}

export default App;