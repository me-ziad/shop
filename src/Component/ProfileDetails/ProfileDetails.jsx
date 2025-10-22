import React, { useEffect, useState } from "react";
import { useParams, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import {Box,Typography,Avatar,CircularProgress,Card,CardContent,Divider,Button,Dialog,DialogContent,IconButton,TextField,Chip,useTheme,Drawer,} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DeleteIcon from "@mui/icons-material/Delete";
import toast from "react-hot-toast";
import ChatIcon from "@mui/icons-material/Chat";
import CallIcon from "@mui/icons-material/Call";
import HomeIcon from "@mui/icons-material/Home";
import { useTranslation } from "react-i18next";
import MessageIcon from "@mui/icons-material/Message";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import Loading from "../Loading/Loading";

export default function ProfileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [addedToCartIds, setAddedToCartIds] = useState([]);
  const theme = useTheme();
  const isArabic = i18n.language === "ar";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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
      if (user) setCurrentUserId(user.id);
    };

    fetchData();
    fetchUser();
  }, [id]);

  // Fetch comments for the currently selected product
  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedProduct) return;
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
        id,
        content,
        created_at,
        user_id,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `
        )
        .eq("product_id", selectedProduct.id)
        .order("created_at", { ascending: false });

      if (!error) setComments(data || []);
    };

    fetchComments();
  }, [selectedProduct]);

  // Add a new comment to the selected product
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      setSending(false);
      return;
    }

    const { error } = await supabase.from("comments").insert({
      content: commentText.trim(),
      product_id: selectedProduct.id,
      user_id: user.id,
    });

    if (!error) {
      setCommentText("");
      const { data } = await supabase
        .from("comments")
        .select(
          `
        id,
        content,
        created_at,
        user_id,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `
        )
        .eq("product_id", selectedProduct.id)
        .order("created_at", { ascending: false });

      setComments(data || []);
    }

    setSending(false);
  };

  // Delete a comment by its ID and update the local comments state
  const handleDeleteComment = async (commentId) => {
    await supabase.from("comments").delete().eq("id", commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  // Navigate to the chat page with the product details passed in state
  const handleNavigateToChat = () => {
    navigate(`/message/${profile.id}`, {
      state: {
        product: {
          name: selectedProduct.name,
          image_url: selectedProduct.image_url,
          price: selectedProduct.price,
          description: selectedProduct.description,
          address: selectedProduct.address,
        },
      },
    });
  };

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
        <Loading/>
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
    <Box maxWidth="1400px" mx="auto" mt={5} p={3}>
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
              onClick={() => setSelectedProduct(p)}
              sx={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: 4,
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
                height: 500,
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
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/*Dialog to display the product */}
      <Dialog
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        fullWidth
        maxWidth="100%"
        PaperProps={{
          sx: {
            position: "relative",
            maxHeight: "95vh",
            borderRadius: 5,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 40px 80px rgba(0,0,0,0.6)"
                : "0 40px 80px rgba(0,0,0,0.3)",
            bgcolor: theme.palette.background.default,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",

            [theme.breakpoints.down("sm")]: {
              width: "100vw",
              height: "97vh",
              margin: 0,
              borderRadius: 0,
              maxHeight: "none",
            },
          },
        }}
      >
        {selectedProduct && (
          <>
            {/* Close button */}
            <IconButton
              onClick={() => setSelectedProduct(null)}
              sx={{
                position: "absolute",
                top: 12,
                ...(i18n.language === "en" ? { left: 12 } : { right: 12 }),

                bgcolor:
                  theme.palette.mode === "dark"
                    ? "#444"
                    : "rgba(255,255,255,0.8)",
                color: theme.palette.text.primary,
                zIndex: 10,
                boxShadow: 1,
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Sidebar icon for small screens */}
            <IconButton
              onClick={() => setSidebarOpen(true)}
              sx={{
                display: { xs: "flex", md: "none" },
                position: "absolute",
                top: 16,
                left: isArabic ? "auto" : 16,
                right: isArabic ? 16 : "auto",
                bgcolor: theme.palette.mode === "dark" ? "#ffffffff" : "#fff",
                boxShadow: 2,
                zIndex: 20,
              }}
            >
              <Avatar src={profile.avatar_url || "/default-avatar.png"} />
            </IconButton>

            {/* Sidebar Drawer for small screens */}
            <Drawer
              anchor={isArabic ? "left" : "right"}
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              sx={{ zIndex: 123423 }}
            >
              <Box
                sx={{
                  width: 250,
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  bgcolor: theme.palette.background.default,
                  height: "100%",
                }}
              >
              <Avatar onClick={handleNavigateToChat}

                  src={profile.avatar_url || "/default-avatar.png"}
                  sx={{ width: 72, height: 72, border: "2px solid #fff" }}
                />
                <Typography variant="body1" fontWeight="bold">
                  {profile.full_name}
                </Typography>
                <Typography variant="caption">{t("Productowner")}</Typography>
                <Divider sx={{ width: "100%", my: 2 }} />
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<MessageIcon sx={{ ml: isArabic ? 1.5 : 0 }} />}
                  sx={{ borderRadius: 3 }}
                  onClick={handleNavigateToChat}
                >
                  {t("communication")}
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  color="success"
                  startIcon={
                    <ShoppingCartIcon sx={{ ml: isArabic ? 1.5 : 0 }} />
                  }
                  sx={{ borderRadius: 3 }}
                  onClick={() => handleAddToCart(selectedProduct)}
                >
                  {t("Addtocart")}
                </Button>
              </Box>
            </Drawer>

            {/* Sidebar for large screens */}
            <Box
              sx={{
                position: { xs: "relative", md: "absolute" },
                top: 0,
                bottom: 0,
                width: { xs: "100%", md: 300 },
                right: isArabic ? "auto" : 0,
                left: isArabic ? 0 : "auto",
                bgcolor: theme.palette.mode === "dark" ? "#1e1e1e" : "#f9f9f9",
                borderLeft: isArabic
                  ? undefined
                  : `1px solid ${theme.palette.divider}`,
                borderRight: isArabic
                  ? `1px solid ${theme.palette.divider}`
                  : undefined,
                boxShadow: isArabic
                  ? "4px 0 12px rgba(0,0,0,0.05)"
                  : "-4px 0 12px rgba(0,0,0,0.05)",
                zIndex: 5,
                px: 3,
                py: 4,
                display: { xs: "none", md: "flex" },
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Avatar onClick={handleNavigateToChat}

                src={profile.avatar_url || "/default-avatar.png"}
                sx={{ width: 72, height: 72, border: "2px solid #fff" ,cursor:'pointer'}}
              />
              <Typography variant="body1" fontWeight="bold">
                {profile.full_name}
              </Typography>
              <Typography variant="caption">{t("Productowner")}</Typography>
              <Divider sx={{ width: "100%", my: 2 }} />
              <Button
                variant="contained"
                fullWidth
                startIcon={<MessageIcon sx={{ ml: isArabic ? 1.5 : 0 }} />}
                sx={{ borderRadius: 3 }}
                onClick={handleNavigateToChat}
              >
                {t("communication")}
              </Button>
              <Button
                variant="contained"
                fullWidth
                color="success"
                startIcon={<ShoppingCartIcon sx={{ ml: isArabic ? 1.5 : 0 }} />}
                sx={{ borderRadius: 3 }}
                onClick={() => handleAddToCart(selectedProduct)}
              >
                {t("Addtocart")}
              </Button>
            </Box>

            {/* scrollable content */}
            <DialogContent
              sx={{
                px: 0,
                py: 0,
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                ml: { xs: 0, md: isArabic ? "300px" : 0 },
                mr: { xs: 0, md: isArabic ? 0 : "300px" },
                direction: isArabic ? "rtl" : "ltr",
              }}
            >
              <Box px={{ xs: 2, md: 4 }} py={{ xs: 2, md: 4 }}>
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: { xs: 240, md: 420 },
                    mb: 3,
                    borderRadius: 4,
                    cursor: "pointer",
                    overflow: "hidden",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 4px 12px rgba(0,0,0,0.4)"
                        : "0 4px 12px rgba(0,0,0,0.1)",
                    "&:hover .overlay": {
                      opacity: 1,
                    },
                  }}
                  onClick={() => setSelectedImage(selectedProduct.image_url)}
                >
                  <Box
                    component="img"
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.4s ease",
                      "&:hover": {
                        transform: "scale(1.02)",
                      },
                    }}
                  />

                  {/*Black Famia with text */}
                  <Box
                    className="overlay"
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      bgcolor: "rgba(0,0,0,0.3)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: "bold",
                      opacity: 0,
                      transition: "opacity 0.3s ease",
                      zIndex: 2,
                      pointerEvents: "none",
                    }}
                  >
                    {t("Viewtheimage")}{" "}
                    <CenterFocusStrongIcon
                      sx={{ mx: 1 }}
                    ></CenterFocusStrongIcon>
                  </Box>
                </Box>
                <Dialog
                  open={Boolean(selectedImage)}
                  onClose={() => setSelectedImage(null)}
                  fullScreen
                  PaperProps={{
                    sx: {
                      bgcolor: "rgba(0,0,0,0.95)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      p: 0,
                    },
                  }}
                >
                  <IconButton
                    onClick={() => setSelectedImage(null)}
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      color: "#fff",
                      zIndex: 10,
                    }}
                  >
                    <CloseIcon />
                  </IconButton>

                  <Box
                    component="img"
                    src={selectedImage}
                    alt="عرض الصورة"
                    sx={{
                      width: {
                        xs: "100%",
                        sm: "90%",
                        md: "80%",
                        lg: "70%",
                      },
                      maxHeight: {
                        xs: "80vh",
                        sm: "85vh",
                        md: "90vh",
                      },
                      objectFit: "contain",
                      borderRadius: 2,
                      boxShadow: "0 0 20px rgba(0,0,0,0.5)",
                      transition: "all 0.3s ease-in-out",
                    }}
                  />
                </Dialog>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    color: theme.palette.text.primary,
                    mb: 1,
                    textAlign: isArabic ? "right" : "left",
                  }}
                >
                  {selectedProduct.name}
                </Typography>

                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color="primary"
                  mb={2}
                  sx={{ textAlign: isArabic ? "right" : "left" }}
                >
                  {t("price")}: {selectedProduct.price} {t("pound")}
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.8,
                    mb: 3,
                    textAlign: isArabic ? "right" : "left",
                  }}
                >
                  {selectedProduct.description || "لا يوجد وصف"}
                </Typography>

                <Typography
                  variant="h6"
                  fontWeight="bold"
                  mb={2}
                  sx={{
                    color: theme.palette.text.primary,
                    textAlign: isArabic ? "right" : "left",
                  }}
                >
                  <MessageIcon
                    sx={{ transform: "translateY(5px)", mr: 1, ml: 1 }}
                  />
                  {t("Comments")}
                </Typography>

                {comments.length === 0 ? (
                  <Typography
                    color="text.secondary"
                    sx={{ textAlign: isArabic ? "right" : "left" }}
                  >
                    {t("Therearenocommentsyet")}
                  </Typography>
                ) : (
                  <Box display="flex" flexDirection="column" gap={2}>
                    {comments.map((c) => (
                      <Card
                        key={c.id}
                        elevation={1}
                        sx={{
                          borderRadius: 3,
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "#2a2a2a"
                              : "#fafafa",
                        }}
                      >
                        <CardContent
                          sx={{
                            display: "flex",
                            gap: 2,
                            flexDirection: isArabic ? "row" : "row-reverse",
                          }}
                        >
                          <Avatar
                            src={
                              c.profiles?.avatar_url || "/default-avatar.png"
                            }
                            sx={{ width: 48, height: 48 }}
                          />
                          <Box flex={1}>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              sx={{
                                color: theme.palette.text.primary,
                                textAlign: isArabic ? "right" : "left",
                              }}
                            >
                              {c.profiles?.full_name || "—"}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: theme.palette.text.secondary,
                                mt: 0.5,
                                textAlign: isArabic ? "right" : "left",
                              }}
                            >
                              {c.content}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: theme.palette.text.disabled,
                                mt: 0.5,
                                display: "block",
                                textAlign: isArabic ? "right" : "left",
                              }}
                            >
                              {new Date(c.created_at).toLocaleString()}
                            </Typography>
                          </Box>
                          {currentUserId === c.user_id && (
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteComment(c.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            </DialogContent>

            {/* Comment entry */}
            <Box
              sx={{
                px: { xs: 2, md: 4 },
                py: { xs: 2, md: 3 },
                bgcolor:
                  theme.palette.mode === "dark" ? "#444444ff" : "#f5f5f5",
                borderTop: `1px solid ${theme.palette.divider}`,
                ml: { xs: 0, md: isArabic ? "300px" : 0 },
                mr: { xs: 0, md: isArabic ? 0 : "300px" },
                direction: isArabic ? "rtl" : "ltr",
              }}
            >
              <Box
                display="flex"
                flexDirection={{ xs: "row", sm: "row" }}
                gap={1}
              >
                <TextField
                  fullWidth
                  multiline
                  rows={1}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t("Writeyourcomment")}
                  sx={{
                    bgcolor:
                      theme.palette.mode === "dark" ? "#494949ff" : "#f5f5f5",
                    borderRadius: 3,
                    "& .MuiInputBase-root": {
                      borderRadius: 3,
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 1px 4px rgba(255,255,255,0.1)"
                          : "0 1px 4px rgba(0,0,0,0.1)",
                      padding: "6px 10px",
                      textAlign: isArabic ? "right" : "left",
                    },
                    "& .MuiInputBase-input": {
                      fontSize: 14,
                      direction: isArabic ? "rtl" : "ltr",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.divider,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  sx={{
                    borderRadius: 3,
                    height: "fit-content",
                    whiteSpace: "nowrap",
                  }}
                  disabled={sending || !commentText.trim()}
                  onClick={handleAddComment}
                >
                  {t("send")}
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Dialog>
    </Box>
  );
}
