import React, { useState, useEffect } from "react";
import { supabase } from "../../src/supabaseClient";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ResetPassword() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  // Check the session as soon as the page opens
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (session && !error) {
        setSessionReady(true); // Session is ready, view the form
      } else {
        setErrorMsg(
          "الرابط غير صالح أو انتهت صلاحيته. افتح الرابط من الإيميل مباشرة."
        );
      }
    };
    checkSession();
  }, []);

  const handlePasswordReset = async () => {
    if (newPassword.length < 6) {
      setErrorMsg(t("Passwordmustbeatleast6characterslong"));
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      setSuccessMsg(
        t(
          "Yourpasswordhasbeenupdatedsuccessfullyyouwillberedirectedtotheloginpage"
        )
      );
      setTimeout(() => navigate("/signin"), 2000);
    } catch (err) {
      setErrorMsg(err.message || "حدث خطأ أثناء تحديث كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        bgcolor: theme.palette.background.default,
        p: 2,
        transition: "background-color 0.3s ease",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 400,
          borderRadius: 3,
          backdropFilter: "blur(12px)",
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0px 8px 30px rgba(0,0,0,0.6)"
              : "0px 8px 30px rgba(0,0,0,0.2)",
          "&:hover": {
            boxShadow:
              theme.palette.mode === "dark"
                ? "0px 12px 40px rgba(0,0,0,0.8)"
                : "0px 12px 40px rgba(0,0,0,0.3)",
          },
          transition: "0.3s",
        }}
      >
        <Typography
          variant="h5"
          align="center"
          fontWeight="bold"
          mb={3}
          sx={{ color: theme.palette.primary.main }}
        >
          {t("Resetpassword")}
        </Typography>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMsg}
          </Alert>
        )}

        {sessionReady && (
          <>
            <TextField
              label={t("NewPassword")}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              sx={{
                "& .MuiInputBase-root": {
                  borderRadius: 3,
                  bgcolor: theme.palette.mode === "dark" ? "#1c1c1c" : "#fff",
                  color: theme.palette.text.primary,
                  transition: "background-color 0.3s ease",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.mode === "dark" ? "#555" : "#ccc",
                },
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: theme.palette.primary.main,
                  },
                "& .MuiInputLabel-root": {
                  color: theme.palette.text.secondary,
                },
              }}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handlePasswordReset}
              fullWidth
              sx={{
                mt: 3,
                py: 1.2,
                borderRadius: 3,
                fontSize: "1rem",
                fontWeight: "bold",
                textTransform: "none",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0px 6px 15px rgba(0,0,0,0.6)"
                    : "0px 6px 15px rgba(0,0,0,0.2)",
                "&:disabled": {
                  bgcolor: theme.palette.mode === "dark" ? "#333" : "#ccc",
                  color: theme.palette.mode === "dark" ? "#888" : "#666",
                },
              }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : (
                t("Updatepassword")
              )}
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}
