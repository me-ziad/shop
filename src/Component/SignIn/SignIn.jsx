import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { NavLink, useNavigate } from "react-router-dom";
// MUI
import {Box,Button,TextField,Typography,CircularProgress,Alert,useTheme,Paper,IconButton,} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";

export default function SignIn() {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const isArabic = i18n.language === "ar";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
// Automatically hide error messages after 4 seconds
useEffect(() => {
  /// Hide error messages after 4 seconds (optional)
  if (errorMsg) {
    const t = setTimeout(() => setErrorMsg(""), 4000);
    return () => clearTimeout(t);
  }
}, [errorMsg]);

// Automatically hide success messages after 3 seconds
useEffect(() => {
  if (successMsg) {
    const t = setTimeout(() => setSuccessMsg(""), 3000);
    return () => clearTimeout(t);
  }
}, [successMsg]);

// Validate the sign-in form fields (email format and password presence)
const validateForm = () => {
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return t("Invalidemail");
  if (!password) return t("Passwordrequired");
  return null;
};

// Handle user sign-in: validate form, authenticate, fetch profile, and redirect
const handleSignIn = async () => {
  const validationError = validateForm();
  if (validationError) {
    setErrorMsg(validationError);
    return;
  }

  setLoading(true);
  setErrorMsg("");
  setSuccessMsg("");

  try {
    // Attempt to sign in with email and password
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Retrieve the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("تعذر الحصول على بيانات المستخدم");

    // Fetch user's profile data
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, phone")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    // Store profile data in localStorage
    localStorage.setItem("profile", JSON.stringify(profileData));

    // Show success message and redirect to homepage
    setSuccessMsg(t("Youhavebeenloggedinsuccessfully"));
    setTimeout(() => navigate("/"), 1200);
  } catch (err) {
    // Handle any errors during sign-in
    setErrorMsg(err.message || "فشل تسجيل الدخول");
  } finally {
    setLoading(false);
  }
};
  return (
    <Box
      component="section"
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background:
          theme.palette.mode === "dark"
            ? "rgba(40, 40, 40, 0.85)"
            : "rgba(255, 255, 255, 0.85)",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          position: "relative", 
          width: "min(420px, 92vw)", 
          maxHeight: "calc(100vh - 40px)", 
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          px: { xs: 2, sm: 4 },
          py: { xs: 2, sm: 4 },
          borderRadius: 3,
          backdropFilter: "blur(8px)",
          boxShadow: "0 10px 30px rgba(2,6,23,0.2)",
        }}
      >
        {/* Floating alerts (do not increase height) */}
        {errorMsg && (
          <Alert
            severity="error"
            sx={{
              position: "absolute",
              top: -12,
              left: 12,
              right: 13,
              zIndex: 20,
              borderRadius: 2,
              display: "flex",
              flexDirection: isArabic ? "row-reverse" : "row",
              alignItems: "center",
            }}
            action={
              <IconButton size="small" onClick={() => setErrorMsg("")}>
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <Alert
            severity="success"
            sx={{
              position: "absolute",
              top: -12,
              left: 12,
              right: 13,
              zIndex: 20,
              borderRadius: 2,
              display: "flex",
              flexDirection: "row-reverse",
              alignItems: "center",
            }}
            action={
              <IconButton size="small" onClick={() => setSuccessMsg("")}>
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {successMsg}
          </Alert>
        )}

       {/* Form content - add margin-top if there is an alert visible so that the title is not hidden */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            mt: errorMsg || successMsg ? 4 : 0,
          }}
        >
          <Typography
            variant="h5"
            align="center"
            fontWeight={700}
            sx={{ color: theme.palette.primary.main }}
          >
            {t("Login")}
          </Typography>
<TextField
  label={t("email")}
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  fullWidth
  size="medium"
  margin="dense"
  variant="outlined"
  InputProps={{
    startAdornment: <EmailIcon sx={{ color: "gray", mr: 1 }} />,
  }}
  error={!!errorMsg && errorMsg.includes("email")}
  helperText={!!errorMsg && errorMsg.includes("email") ? errorMsg : ""}
  sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
      bgcolor: theme.palette.mode === "dark" ? "#111316" : "#fff",
      "&.Mui-focused": {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px ${theme.palette.primary.light}33`,
      },
    },
  }}
/>

<TextField
  label={t("password")}
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  fullWidth
  size="medium"
  margin="dense"
  variant="outlined"
  InputProps={{
    startAdornment: <LockIcon sx={{ color: "gray", mr: 1 }} />,
  }}
  error={!!errorMsg && errorMsg.includes("Password")}
  helperText={!!errorMsg && errorMsg.includes("Password") ? errorMsg : ""}
  sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
      bgcolor: theme.palette.mode === "dark" ? "#111316" : "#fff",
      "&.Mui-focused": {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px ${theme.palette.primary.light}33`,
      },
    },
  }}
/>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSignIn}
            fullWidth
            disabled={loading}
            sx={{
              mt: 1,
              py: 1.1,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            {loading ? (
              <CircularProgress
                size={20}
                thickness={5}
                sx={{ color: "#fff" }}
              />
            ) : (
              t("Login")
            )}
          </Button>
         
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              mt: 1,
              flexWrap: "wrap",
            }}
          >
            <NavLink
              style={{ color: "#42a5f7ff" }}
              component="button"
              onClick={() => navigate("/newauth")}
              sx={{
                fontSize: "0.95rem",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {t("Donthaveanaccount")}
            </NavLink>

            <NavLink
              style={{ color: "#42a5f7ff" }}
              component="button"
              onClick={() => navigate("/newpassword")}
              sx={{
                fontSize: "0.9rem",
                textTransform: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {t("Forgotyourpassword")}
            </NavLink>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
