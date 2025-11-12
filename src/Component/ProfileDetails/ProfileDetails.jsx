import React, { useEffect, useState } from "react";
import { useParams, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import {Box,Typography,Avatar,Card,Divider,Button,IconButton,useTheme, Tooltip,} from "@mui/material";
 import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
 import toast from "react-hot-toast";
import ChatIcon from "@mui/icons-material/Chat";
import CallIcon from "@mui/icons-material/Call";
import HomeIcon from "@mui/icons-material/Home";
import { useTranslation } from "react-i18next";
  import Loading from "../Loading/Loading";

export default function ProfileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedToCartIds, setAddedToCartIds] = useState([]);
  const theme = useTheme();
  const isArabic = i18n.language === "ar";

  // Set the page title to "Profile Details" when the component mounts
  useEffect(() => {
    document.title = t("profiledetails");
  }, []);

  // Fetch profile data and products for the given user ID, and also fetch the current logged-in user
  useEffect(() => {
    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      const { data: userProducts } = await supabase
        .from("products")
        .select("*")
        .eq("owner_id", id);

      setProfile(profileData);
      setProducts(userProducts || []);
      setLoading(false);
    };

    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
    };

    fetchData();
    fetchUser();
  }, [id]);

  // Add a product to the user's cart, checking for duplicates first
  const handleAddToCart = async (product) => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    const { data: existing } = await supabase
      .from("cart_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .single();

    if (existing) {
      toast(t("Theproductisalreadyinthecart"));
      return;
    }

    const { error: insertError } = await supabase.from("cart_items").insert({
      user_id: user.id,
      product_id: product.id,
      quantity: 1,
    });

    if (insertError) {
      toast.error(t("Anerroroccurredwhileadding"));
    } else {
      toast.success(t("Theproducthasbeenaddedtothecart"));
      setAddedToCartIds((prev) => [...prev, product.id]);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={5}>
        <Loading />
      </Box>
    );
  }
 
  if (!profile) {
    return (
      <Typography align="center" mt={5} variant="h6" color="error">
        {t("Usernotfound")}
      </Typography>
    );
  }
  return (
    <Box maxWidth="1800px" mx="auto" mt={5} p={3}>
      <Card
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 6,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 20px 60px rgba(0,0,0,0.4)"
              : "0 20px 60px rgba(0,0,0,0.1)",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 100%)"
              : "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          p: 4,
          mb: 5,
          display: "flex",
          alignItems: "center",
          gap: 4,
          flexWrap: "wrap",
        }}
      >
        {/* Profile picture */}
        <Box
          sx={{
            position: "relative",
            width: 120,
            height: 120,
            borderRadius: "50%",
            overflow: "hidden",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 20px rgba(0,0,0,0.5)"
                : "0 8px 20px rgba(0,0,0,0.15)",
            border: "4px solid",
            borderColor: theme.palette.mode === "dark" ? "#333" : "#fff",
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Avatar
            src={profile.avatar_url || "/default-avatar.png"}
            alt={profile.full_name}
            sx={{ width: "100%", height: "100%" }}
          />
        </Box>

        {/* User Data */}
        <Box flex={1} minWidth={240}>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ color: theme.palette.text.primary, mb: 1 }}
          >
            {profile.full_name}
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary, mb: 0.5 }}
          >
            <CallIcon
              sx={{
                fontSize: "24px",
                transform: "translateY(5px)",
                mr: 1,
                color: "#2196f3",
              }}
            />
            {profile.phone || "—"}
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary }}
          >
            <HomeIcon
              sx={{
                fontSize: "24px",
                transform: "translateY(5px)",
                mr: 1,
                color: "#2196f3",
              }}
            />
            {profile.address || "—"}
          </Typography>

          <Box mt={3}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={NavLink}
              to={`/message/${profile.id}`}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            >
              <ChatIcon sx={isArabic ? { ml: 1 } : { mr: 1 }} fontSize="12px" />
              {t("Messaging")}
            </Button>
          </Box>
        </Box>
      </Card>
      <Divider sx={{ mb: 3 }} />
      <Typography variant="h6" sx={{ color: "#1e88e5" }} mb={2}>
        <ShoppingCartIcon
          sx={{ fontSize: "20px", transform: "translateY(5px)" }}
        ></ShoppingCartIcon>{" "}
        {t("products")} {profile.full_name}:
      </Typography>

      {products.length === 0 ? (
        <Typography color="text.secondary">
          {" "}
          {t("Therearenoproductsforthisuser")}
        </Typography>
      ) : (
        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
          gap={3}
        >
          {products.map((p) => (
            <Box
              key={p.id}
               onClick={() => navigate(`/product/${p.id}`)} 
              sx={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: 1,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 12px 30px rgba(0,0,0,0.5)"
                    : "0 12px 30px rgba(0,0,0,0.15)",
                overflow: "hidden",
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(30,30,30,0.85)"
                    : "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
                border:
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid rgba(255,255,255,0.3)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                cursor: "pointer",
                height: 530,
                "&:hover": {
                  transform: "translateY(-6px)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 20px 40px rgba(0,0,0,0.6)"
                      : "0 20px 40px rgba(0,0,0,0.2)",
                },
              }}
            >
              {/*Click the cart button in the corner of the card according to the language */}
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(p);
                }}
                sx={{
                  position: "absolute",
                  top: 8,
                  [isArabic ? "left" : "right"]: 8,
                  bgcolor: theme.palette.mode === "dark" ? "#444" : "#fff",
                  boxShadow: 2,
                  zIndex: 5,
                  "&:hover": {
                    bgcolor: theme.palette.mode === "dark" ? "#555" : "#f0f0f0",
                  },
                }}
              >
                <ShoppingCartIcon
                  sx={{
                    color: addedToCartIds.includes(p.id) ? "green" : "#1976d2",
                  }}
                />
              </IconButton>

              {/* Product Owner */}
              <Box display="flex" alignItems="center" gap={1} mb={1} p={1}>
                <Avatar
                  src={profile.avatar_url || "/default-avatar.png"}
                  sx={{
                    width: 28,
                    height: 28,
                    border: "2px solid",
                    borderColor:
                      theme.palette.mode === "dark" ? "#333" : "#fff",
                  }}
                />
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{ color: theme.palette.text.primary }}
                >
                  {profile.full_name}
                </Typography>
              </Box>

              {/*Product Image */}
              <Box
                component="img"
                src={p.image_url}
                alt={p.name}
                sx={{
                  width: "100%",
                  height: 240,
                  objectFit: "cover",
                  borderRadius: "0 0 12px 12px",
                  boxShadow: "inset 0 -1px 6px rgba(0,0,0,0.1)",
                  transition: "transform 0.4s ease, filter 0.4s ease",
                  filter:
                    theme.palette.mode === "dark"
                      ? "brightness(0.9)"
                      : "brightness(0.98)",
                  "&:hover": {
                    transform: "scale(1.03)",
                    filter:
                      theme.palette.mode === "dark"
                        ? "brightness(1.05)"
                        : "brightness(1.05)",
                  },
                }}
              />

              {/*Details */}
              <Box
                p={2}
                display="flex"
                flexDirection="column"
                gap={1}
                sx={{ flexGrow: 1 }}
              >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: theme.palette.text.primary, fontSize: 18 }}
                >
                  {(() => {
                    const name =
                      typeof p.name === "string" ? p.name.trim() : "";
                    const words = name.split(/\s+/);
                    return words.length > 3
                      ? words.slice(0, 3).join(" ") + "..."
                      : name;
                  })()}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#2a2a2a" : "#f9f9f9",
                    p: 1.5,
                    borderRadius: 2,
                    fontSize: 14,
                    lineHeight: 1.6,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "inset 0 1px 3px rgba(255,255,255,0.05)"
                        : "inset 0 1px 3px rgba(0,0,0,0.05)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.description || "لا يوجد وصف"}
                </Typography>

                <Typography
                  variant="body1"
                  fontWeight="bold"
                  sx={{ color: "#1976d2", fontSize: 16, mt: 1 }}
                >
                  {t("price")}: {p.price} {t("pound")}
                </Typography>

                {p.address && (
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    {p.address}
                  </Typography>
                )}
                          <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: "auto",
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: 14,
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    "&:hover": {
                      bgcolor: theme.palette.primary.dark,
                    },
                    transition: "0.3s",
                  }}
                 onClick={() => navigate(`/product/${p.id}`)} 
                >
                  {t("Viewdetails")}
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}

    </Box>
  );
}
