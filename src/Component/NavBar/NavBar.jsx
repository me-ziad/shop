import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import {AppBar,Toolbar,Typography,Button,Box,Badge,IconButton,Tooltip,Menu,MenuItem,Drawer,List,ListItem,ListItemButton,ListItemText,} from "@mui/material";
import MailIcon from "@mui/icons-material/Mail";
import TranslateIcon from "@mui/icons-material/Translate";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import EmailIcon from "@mui/icons-material/Email";
import CallIcon from "@mui/icons-material/Call";
import Popover from "@mui/material/Popover";
import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
export default function Navbar({ toggleTheme, isDarkMode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false); 
  const [language, setLanguage] = useState(
    localStorage.getItem("preferredLanguage") || "ar" 
  );
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [contactAnchorEl, setContactAnchorEl] = useState(null);
  const handleContactOpen = (event) => {
    setContactAnchorEl(event.currentTarget);
  };

  const handleContactClose = () => {
    setContactAnchorEl(null);
  };

  const isContactOpen = Boolean(contactAnchorEl);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const handleLanguageChange = () => {
    const newLang = language === "ar" ? "en" : "ar";
    setLanguage(newLang);
    localStorage.setItem("preferredLanguage", newLang);
    handleMenuClose();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    navigate("/signin");
    handleMenuClose();
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);

  const toggleDrawer = (open) => () => setDrawerOpen(open);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    checkSession();
    return () => listener.subscription.unsubscribe();
  }, []);

  const guestContent = (
    <>
      <IconButton onClick={handleLanguageChange} sx={{ color: "#fff" }}>
        <TranslateIcon />
      </IconButton>
      <IconButton onClick={toggleTheme} sx={{ color: "#fff" }}>
        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
      <Button
        component={Link}
        to="/signin"
        variant="outlined"
        sx={{
          borderColor: "#fff",
          color: "#fff",
          borderRadius: 2,
          textTransform: "none",
          "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
        }}
      >
        Sign In
      </Button>
      <Button
        component={Link}
        to="/newauth"
        variant="outlined"
        sx={{
          borderColor: "#fff",
          color: "#fff",
          borderRadius: 2,
          textTransform: "none",
          "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
        }}
      >
        Register
      </Button>
    </>
  );

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          bgcolor: theme.palette.mode === "dark" ? "#1e1e1e" : "primary.main",
          boxShadow: 4,
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: { xs: 2, md: 4 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Link to="/" style={{ textDecoration: "none", color: "#fff" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                <AddShoppingCartRoundedIcon
                  sx={{ transform: "translateY(4px)" }}
                ></AddShoppingCartRoundedIcon>{" "}
                Shoplio
              </Typography>
            </Link>
            <IconButton
              onClick={handleContactOpen}
              sx={{
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#fff" : "#fff",
              }}
            >
              <CallIcon />
            </IconButton>
          </Box>

          {/* Desktop View */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1,
            }}
          >
            {!isLoggedIn ? (
              guestContent
            ) : (
              <>
                <Button
                  component={Link}
                  to="/"
                  sx={{ color: "#fff", textTransform: "none" }}
                >
                  {t("Allproducts")}
                </Button>
                <Button
                  component={Link}
                  to="/addProduct"
                  sx={{ color: "#fff", textTransform: "none" }}
                >
                  {t("addProduct")}
                </Button>
                <Button
                  component={Link}
                  to="/cart"
                  sx={{ color: "#fff", textTransform: "none" }}
                >
                  {t("cart")}
                </Button>
                <Button
                  component={Link}
                  to="/profile"
                  sx={{ color: "#fff", textTransform: "none" }}
                >
                  {t("profile")}
                </Button>
                <Tooltip title={t("messages")}>
                  <IconButton
                    component={Link}
                    to="/message"
                    sx={{ color: "#fff" }}
                  >
                    <Badge
                      color="error"
                      variant={unreadCount > 0 ? "dot" : "standard"}
                    >
                      <MailIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <IconButton onClick={handleMenuOpen} sx={{ color: "#fff" }}>
                  <SettingsIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{ sx: { borderRadius: 2, mt: 1 } }}
                >
                  <MenuItem onClick={handleLanguageChange}>
                    <TranslateIcon fontSize="small" sx={{ mr: 1 }} />
                    {language === "ar" ? "English" : "العربية"}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      toggleTheme();
                      handleMenuClose();
                    }}
                  >
                    {isDarkMode ? (
                      <LightModeIcon fontSize="small" sx={{ mr: 1 }} />
                    ) : (
                      <DarkModeIcon fontSize="small" sx={{ mr: 1 }} />
                    )}
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                    {t("logout")}
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>

          {/* Mobile View */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton onClick={toggleDrawer(true)} sx={{ color: "#fff" }}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Popover
        open={isContactOpen}
        anchorEl={contactAnchorEl}
        onClose={handleContactClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            p: 2,
            borderRadius: 2,
            minWidth: 250,
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        {/* Title */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          {t("Tocommunicatewiththeprogrammer")}
        </Typography>

        {/* WhatsApp */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <ContactPhoneIcon color="primary" />
          <Typography
            variant="body1"
            component="a"
            href="https://wa.me/201280226462"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              textDecoration: "none",
              color: "inherit",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            01280226462
          </Typography>
        </Box>

        {/* Email */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EmailIcon color="primary" />
          <Typography
            variant="body1"
            component="a"
            href="mailto:ziad.n.mostafa@gmail.com"
            sx={{
              textDecoration: "none",
              color: "inherit",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            ziad.n.mostafa@gmail.com
          </Typography>
        </Box>
      </Popover>

      {/* Drawer for Mobile */}
      {/* Mobile View */}

      {/* Drawer for Mobile */}
      <Drawer
        anchor={language === "ar" ? "right" : "left"}
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: 260,
            bgcolor: theme.palette.mode === "dark" ? "#1c1c1c" : "#fff",
            height: "100%",

            transform: "none !important",
            direction: "ltr",
            display: "flex",
            flexDirection: "column",
            px: 2,
          },
        }}
      >
        <Box
          sx={{
            direction: language === "ar" ? "rtl" : "ltr",
            textAlign: language === "ar" ? "right" : "left",
          }}
        >
          <List>
            {!isLoggedIn ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/signin">
                    <ListItemText primary="Sign In" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/newauth">
                    <ListItemText primary="Register" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleLanguageChange}
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <TranslateIcon
                      sx={{ [language === "ar" ? "ml" : "mr"]: 2 }}
                    />
                    <ListItemText
                      primary={language === "ar" ? "English" : "العربية"}
                    />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={toggleTheme}
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    {isDarkMode ? (
                      <LightModeIcon
                        sx={{ [language === "ar" ? "ml" : "mr"]: 2 }}
                      />
                    ) : (
                      <DarkModeIcon
                        sx={{ [language === "ar" ? "ml" : "mr"]: 2 }}
                      />
                    )}
                    <ListItemText
                      primary={isDarkMode ? "Light Mode" : "Dark Mode"}
                    />
                  </ListItemButton>
                </ListItem>
              </>
            ) : (
              <>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/">
                    <ListItemText primary={t("Allproducts")} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/addProduct">
                    <ListItemText primary={t("addProduct")} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/cart">
                    <ListItemText primary={t("cart")} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/profile">
                    <ListItemText primary={t("profile")} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    to="/message"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <Badge
                      color="error"
                      variant={unreadCount > 0 ? "dot" : "standard"}
                    >
                      <MailIcon sx={{ [language === "ar" ? "ml" : "mr"]: 2 }} />
                    </Badge>
                    <ListItemText primary={t("messages")} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleMenuOpen}
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <SettingsIcon
                      sx={{ [language === "ar" ? "ml" : "mr"]: 2 }}
                    />
                    <ListItemText primary={t("settings")} />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
