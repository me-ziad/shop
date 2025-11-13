import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { NavLink, useNavigate } from "react-router-dom";
import {Box,Button,TextField,Typography,Avatar,CircularProgress,Alert,useTheme,Paper,IconButton,} from "@mui/material";
import { useTranslation } from "react-i18next";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function NewAccount() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorField, setErrorField] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  const handleClickShowPassword = () => setShowPassword((prev) => !prev);

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
    borderRadius:"4px",
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
    "@media (max-width:600px)": {
      width: "100%",
      mt: 1,
    },
    "@keyframes fadeIn": {
      from: { opacity: 0, transform: top ? "translateY(0) scale(0.85)" : "translateY(-50%) scale(0.85)" },
      to: { opacity: 1, transform: top ? "translateY(0) scale(1)" : "translateY(-50%) scale(1)" },
    },
    "@keyframes fadeInMobile": {
      from: { opacity: 0, transform: "translateY(-5px)" }, // يبدأ شوية فوق
      to: { opacity: 1, transform: "translateY(0)" },     // يهبط بلطف
    },
  }}
>
  {text}
</Box>


  );

  // ===========================
  // Effects
  // ===========================
  useEffect(() => {
    if (shouldNavigate) navigate("/");
  }, [shouldNavigate]);

  useEffect(() => {
    document.title = t("newaccount");
  }, [t]);

  useEffect(() => {
    if (errorField && errorMsg) {
      let valid = false;
      switch (errorField) {
        case "fullName":
          valid = fullName.trim().length > 0;
          break;
        case "phone":
          valid = /^[0-9]{10,15}$/.test(phone);
          break;
        case "email":
          valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          break;
        case "password":
          valid = password.length >= 6;
          break;
        default:
          break;
      }
      if (valid) {
        setErrorField("");
        setErrorMsg("");
      }
    }
  }, [fullName, phone, email, password]);

  // ===========================
  // Form Validation
  // ===========================
  const validateForm = () => {
    if (!fullName.trim())
      return { field: "fullName", message: t("Fullnamerequired") };
    if (!phone.match(/^[0-9]{10,15}$/))
      return { field: "phone", message: t("Invalidphonenumber") };
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      return { field: "email", message: t("Invalidemail") };
    if (password.length < 6)
      return {
        field: "password",
        message: t("Passwordmustbeatleast6characterslong"),
      };
    return null;
  };

  // ===========================
  // Handle Signup
  // ===========================
  const handleSignUp = async () => {
    const validationError = validateForm();
    if (validationError) {
      setErrorField(validationError.field);
      setErrorMsg(validationError.message);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setErrorField("");
    setSuccessMsg("");

    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, phone } },
        });

      if (signUpError) throw signUpError;

      let user = signUpData.user;
      if (!user) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        const afterLogin = await supabase.auth.getUser();
        user = afterLogin.data.user;
      }

      if (!user) throw new Error("تعذر الحصول على المستخدم بعد تسجيل الدخول");

      let avatarUrl = "";
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        avatarUrl = publicUrlData.publicUrl;
      }

      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        phone,
        avatar_url: avatarUrl,
        address: "",
      });
      if (upsertError) throw upsertError;

      setSuccessMsg(t("accounthasbeencreatedsuccessfully"));
      setTimeout(() => setShouldNavigate(true), 1500);
    } catch (err) {
      console.error("Signup Error:", err);
      const msg = err.message?.toLowerCase() || "";
      let field = "";
      if (msg.includes("email")) field = "email";
      else if (msg.includes("password")) field = "password";
      else if (msg.includes("phone")) field = "phone";
      else if (msg.includes("name")) field = "fullName";
      setErrorField(field);
      setErrorMsg(err.message || t("Anerroroccurredwhilecreatingtheaccount"));
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // Avatar Upload
  // ===========================
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatarFile(file);
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        py: 5,
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #1e1e1e 0%, #1e1e1e 100%)"
            : "linear-gradient(135deg, #eaf4ff 0%, #ffffff 100%)",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "min(550px, 92vw)",
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          backdropFilter: "blur(10px)",
          background:
            theme.palette.mode === "dark"
              ? "#1e1e1e"
              : "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <Typography
          variant="h5"
          mb={3}
          align="center"
          fontWeight={700}
          sx={{ color: theme.palette.primary.main }}
        >
          {t("Createanewaccount")}
        </Typography>

        {successMsg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMsg}
          </Alert>
        )}

        {/* Avatar Upload */}
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Avatar
            src={avatarPreview || ""}
            sx={{
              width: 100,
              height: 100,
              mb: 1,
              bgcolor: theme.palette.mode === "dark" ? "#334155" : "#e2e8f0",
              border: "2px dashed",
              borderColor:
                theme.palette.mode === "dark" ? "#64748b" : "#94a3b8",
              cursor: "pointer",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                borderColor: theme.palette.primary.main,
              },
            }}
            onClick={() => document.getElementById("avatarInput").click()}
          />
          <Button
            variant="outlined"
            component="label"
            sx={{ textTransform: "none" }}
          >
            {t("Chooseapersonalphoto")}
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </Button>
        </Box>

        {/* Full Name */}
        <Box sx={{ position: "relative", mb: 2 }}>
          <TextField
            label={t("fullname")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root fieldset": {
                borderColor: errorField === "fullName" ? "#ff4d4f" : undefined,
              },
              "& .MuiInputLabel-root": {
                color: errorField === "fullName" ? "#ff4d4f" : undefined,
              },
            }}
          />
          {errorField === "fullName" && (
            <BubbleError
              text={errorMsg}
              left={i18n.dir() === "rtl" ? "-150px" : undefined}
              right={i18n.dir() === "ltr" ? "-160px" : undefined}
            />
          )}
        </Box>

        {/* Phone */}
        <Box sx={{ position: "relative", mb: 2 }}>
          <TextField
            label={t("phonenumber")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root fieldset": {
                borderColor: errorField === "phone" ? "#ff4d4f" : undefined,
              },
              "& .MuiInputLabel-root": {
                color: errorField === "phone" ? "#ff4d4f" : undefined,
              },
            }}
          />
          {errorField === "phone" && (
            <BubbleError
              text={errorMsg}
              left={i18n.dir() === "rtl" ? "-150px" : undefined}
              right={i18n.dir() === "ltr" ? "-180px" : undefined}
            />
          )}
        </Box>

        {/* Email */}
        <Box sx={{ position: "relative", mb: 2 }}>
          <TextField
            label={t("email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root fieldset": {
                borderColor: errorField === "email" ? "#ff4d4f" : undefined,
              },
              "& .MuiInputLabel-root": {
                color: errorField === "email" ? "#ff4d4f" : undefined,
              },
            }}
          />
          {errorField === "email" && (
            <BubbleError
              text={errorMsg}
              left={i18n.dir() === "rtl" ? "-170px" : undefined}
              right={i18n.dir() === "ltr" ? "-125px" : undefined}
            />
          )}
        </Box>

        {/* Password */}
        <Box sx={{ position: "relative", mb: 2 }}>
          <TextField
            label={t("password")}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={handleClickShowPassword}
                  edge="end"
                  sx={{
                    order: i18n.dir() === "rtl" ? -1 : 0, // Eye on right for RTL
                  }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root fieldset": {
                borderColor: errorField === "password" ? "#ff4d4f" : undefined,
              },
              "& .MuiInputLabel-root": {
                color: errorField === "password" ? "#ff4d4f" : undefined,
              },
            }}
          />
          {errorField === "password" && (
            <BubbleError
              text={errorMsg}
              left={i18n.dir() === "rtl" ? "-260px" : undefined}
              right={i18n.dir() === "ltr" ? "-330px" : undefined}
            />
          )}
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSignUp}
          fullWidth
          sx={{
            mt: 2,
            py: 1.2,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: "none",
          }}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={22} sx={{ color: "#fff" }} />
          ) : (
            t("Newregistration")
          )}
        </Button>

        <NavLink
          to="/signin"
          style={{
            display: "block",
            marginTop: "15px",
            textAlign: "center",
            color: theme.palette.mode === "dark" ? "#93c5fd" : "#1d4ed8",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          {t("Alreadyhaveanaccountlogin")}
        </NavLink>
      </Paper>
    </Box>
  );
}
