import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { NavLink, useNavigate } from "react-router-dom";
import {Box,Button,TextField,Typography,CircularProgress,Alert,Paper,IconButton,useTheme,} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import { useTranslation } from "react-i18next";

export default function SignIn() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Field validation errors
  const [errorField, setErrorField] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  // Backend error alert
  const [backendError, setBackendError] = useState("");
  const handleClickShowPassword = () => setShowPassword((prev) => !prev);
  const isArabic = i18n.language === "ar";

  // ===========================
  // Bubble Error component
  // ===========================
  const BubbleError = ({ text, left, right, top }) => (
    <Box
      sx={{
        position: { xs: "relative", sm: "absolute" },
        top: { xs: "100%", sm: top || "50%" },
        mt: { xs: 0.5, sm: 0 },
        transform: {
          xs: "none",
          sm: top ? "translateY(0)" : "translateY(-50%)",
        },
        left: { xs: 0, sm: left || "auto" },
        right: { xs: 0, sm: right || "auto" },
        bgcolor: "#ff4d50e4",
        color: "#fff",
        fontSize: "0.85rem",
        px: 2,
        py: 0.7,
        borderRadius: "4px",
        whiteSpace: { xs: "normal", sm: "nowrap" },
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        zIndex: 10,
        animation: { xs: "fadeInMobile 0.25s ease", sm: "fadeIn 0.25s ease" },
        "&::after": {
          content: '""',
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          width: 0,
          height: 0,
          borderStyle: "solid",
          ...(i18n.dir() === "rtl"
            ? {
                right: "-5px",
                borderWidth: "6px 0 6px 6px",
                borderColor: "transparent transparent transparent #ff4d50e4",
              }
            : {
                left: "-5px",
                borderWidth: "6px 6px 6px 0",
                borderColor: "transparent #ff4d50e4 transparent transparent",
              }),
          "@media (max-width:600px)": { display: "none" },
        },
        "@media (max-width:600px)": { width: "100%", mt: 1 },
      }}
    >
      {text}
    </Box>
  );

  // ===========================
  // Field validation
  // ===========================
  const validateForm = () => {
    if (!email.trim()) return { field: "email", message: t("Emailrequired") };
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      return { field: "email", message: t("Invalidemail") };
    if (!password.trim())
      return { field: "password", message: t("Passwordrequired") };
    return null;
  };

  // ===========================
  // Handle Sign In
  // ===========================
  const handleSignIn = async () => {
    const validationError = validateForm();
    if (validationError) {
      setErrorField(validationError.field);
      setErrorMsg(validationError.message);
      return;
    }

    setLoading(true);
    setErrorField("");
    setErrorMsg("");
    setBackendError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("Emailorpasswordincorrect"));

      setTimeout(() => navigate("/"), 500);
    } catch (err) {
      setBackendError(err.message || t("Emailorpasswordincorrect"));
    } finally {
      setLoading(false);
    }
  };

  // Reset field error when user types
  useEffect(() => {
    if (errorField === "email" && email) setErrorField("");
    if (errorField === "password" && password) setErrorField("");
  }, [email, password]);

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
            ? "linear-gradient(135deg, #1e1e1e 0%, #1e1e1e 100%)"
            : "linear-gradient(135deg, #eaf4ff 0%, #ffffff 100%)",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          position: "relative",
          width: "min(520px, 92vw)",
          maxHeight: "calc(100vh - 40px)",
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
        {/* Backend error alert */}
        {backendError && (
          <Alert
            severity="error"
            sx={{ mb: 2, display: "flex", justifyContent: "space-between",position:'relative'}}
            action={
              <IconButton sx={{position:'absolute',  [isArabic ? "left" : "right"]: 12 }} size="small" onClick={() => setBackendError("")}>
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {backendError}
          </Alert>
        )}

        <Typography
          variant="h5"
          align="center"
          fontWeight={700}
          sx={{ color: theme.palette.primary.main }}
        >
          {t("Login")}
        </Typography>

        {/* Email */}
        <Box sx={{ position: "relative" }}>
          <TextField
            label={t("email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            InputProps={{
              startAdornment: <EmailIcon sx={{ color: "gray", mr: 1 }} />,
            }}
            sx={{
              "& .MuiOutlinedInput-root fieldset": {
                borderColor: errorField === "email" ? "#ff4d4f" : undefined,
              },
            }}
          />
          {errorField === "email" && (
            <BubbleError
              text={errorMsg}
              left={i18n.dir() === "rtl" ? "-170px" : undefined}
              right={i18n.dir() === "ltr" ? "-130px" : undefined}
            />
          )}
        </Box>

        {/* Password */}
        <Box sx={{ position: "relative" }}>
          <TextField
            label={t("password")}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            InputProps={{
              startAdornment: <LockIcon sx={{ color: "gray", mr: 1 }} />,
              endAdornment: (
                <IconButton onClick={handleClickShowPassword} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root fieldset": {
                borderColor: errorField === "password" ? "#ff4d4f" : undefined,
              },
            }}
          />
          {errorField === "password" && (
            <BubbleError
              text={errorMsg}
              left={i18n.dir() === "rtl" ? "-138px" : undefined}
              right={i18n.dir() === "ltr" ? "-160px" : undefined}
            />
          )}
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSignIn}
          fullWidth
          disabled={loading}
          sx={{ mt: 2, py: 1.2, borderRadius: 2, fontWeight: 600 }}
        >
          {loading ? (
            <CircularProgress size={22} sx={{ color: "#fff" }} />
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
            onClick={() => navigate("/newauth")}
          >
            {t("Donthaveanaccount")}
          </NavLink>
          <NavLink
            style={{ color: "#42a5f7ff" }}
            onClick={() => navigate("/newpassword")}
          >
            {t("Forgotyourpassword")}
          </NavLink>
        </Box>
      </Paper>
    </Box>
  );
}
