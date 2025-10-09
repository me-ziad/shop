import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../Component/NavBar/NavBar';
import { supabase } from '../supabaseClient';

export default function Layout({ toggleTheme, isDarkMode }) {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/signin');
      }
      setCheckingSession(false);
    };

    checkSession();
  }, [navigate]);

  if (checkingSession) return null;

  return (
    <>
      <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      <Outlet />
    </>
  );
}