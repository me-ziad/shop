import React, { useEffect, useState } from "react";
import {Box,Typography,Avatar,IconButton,Button,Divider,TextField,Card,CardContent,Dialog,useMediaQuery,Drawer,} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";
import MessageIcon from "@mui/icons-material/Message";
import DeleteIcon from "@mui/icons-material/Delete";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import toast from "react-hot-toast";
import Loading from "../Loading/Loading";

export default function ProductDetails() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";
  const isSmallScreen = useMediaQuery("(max-width:900px)");
  const [product, setProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  // fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          description,
          price,
          image_url,
          category,
          created_at,
          profiles!products_owner_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq("id", id)
        .single();
      if (!error) setProduct(data);
      setLoading(false);
    };
    fetchProduct();

    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    fetchUser();
  }, [id]);

  // fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;
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
        .eq("product_id", id)
        .order("created_at", { ascending: false });
      if (!error) setComments(data || []);
    };
    fetchComments();
  }, [id]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSending(false);
      return;
    }

    const { error } = await supabase.from("comments").insert({
      content: commentText.trim(),
      product_id: id,
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
        .eq("product_id", id)
        .order("created_at", { ascending: false });
      setComments(data || []);
    }
    setSending(false);
  };

  const handleDeleteComment = async (commentId) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  const handleAddToCart = async (product) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

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

    await supabase
      .from("cart_items")
      .insert({ user_id: user.id, product_id: product.id });
    toast.success(t("productAddedToCart", { name: product.name }));
  };

  if (loading)
    return (
      <Box textAlign="center" mt={5}>
        <Loading />
      </Box>
    );

  if (!product) return <Typography>{t("Productnotfound")}</Typography>;

  const sidebarContent = (
    <Box
      sx={{
        width: 280,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 3,
      }}
    >
      <Avatar
        src={product.profiles?.avatar_url || "/default-avatar.png"}
        sx={{
          width: 80,
          height: 80,
          border: `2px solid ${theme.palette.background.paper}`,
          cursor: "pointer",
          mt: 10,
        }}
        onClick={() => navigate(`/profiledetails/${product.profiles?.id}`)}
      />

      <Typography variant="body1" fontWeight="bold" mt={1}>
        {product.profiles?.full_name || "—"}
      </Typography>

      <Typography variant="caption" color="text.secondary">
        {t("Productowner")}
      </Typography>

      <Divider sx={{ width: "100%", my: 2 }} />

      {/* Contact button */}
      <Button
        variant="contained"
        fullWidth
        startIcon={<MessageIcon />}
        sx={{
          borderRadius: 3,
          justifyContent: "center",
          textTransform: "none",
          pl: 1.5,
          flexDirection: isArabic ? "row-reverse" : "row",
          direction: isArabic ? "rtl" : "ltr",
        }}
        onClick={() =>
          navigate(`/message/${product.profiles?.id}`, { state: { product } })
        }
      >
        {t("communication")}
      </Button>

      {/* Profile button */}
      <Button
        variant="outlined"
        fullWidth
        color="secondary"
        startIcon={<PersonIcon />}
        sx={{
          borderRadius: 3,
          mt: 1,
          justifyContent: "center",
          textTransform: "none",
          pl: 1.5,
          flexDirection: isArabic ? "row-reverse" : "row",
          direction: isArabic ? "rtl" : "ltr",
        }}
        onClick={() => navigate(`/profiledetails/${product.profiles?.id}`)}
      >
        {t("Profile")}
      </Button>

      {/* Add to Cart Button */}
      <Button
        variant="contained"
        fullWidth
        color="success"
        startIcon={<ShoppingCartIcon />}
        sx={{
          borderRadius: 3,
          mt: 1,
          justifyContent: "center",
          textTransform: "none",
          pl: 1.5,
          flexDirection: isArabic ? "row-reverse" : "row",
          direction: isArabic ? "rtl" : "ltr",
        }}
        onClick={() => handleAddToCart(product)}
      >
        {t("Addtocart")}
      </Button>
    </Box>
  );

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      sx={{ position: "relative", direction: isArabic ? "rtl" : "ltr" }}
    >
      {/* Large Sidebar */}
      {!isSmallScreen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            [isArabic ? "right" : "left"]: 0,
            height: "100vh",
            bgcolor: theme.palette.mode === "dark" ? "#2c2c2c" : "#f9f9f9",
            borderRight: isArabic
              ? "none"
              : `1px solid ${theme.palette.divider}`,
            borderLeft: isArabic
              ? `1px solid ${theme.palette.divider}`
              : "none",
            boxShadow:
              theme.palette.mode === "dark"
                ? "4px 0 12px rgba(255,255,255,0.05)"
                : "4px 0 12px rgba(0,0,0,0.05)",
            zIndex: 10,
          }}
        >
          {sidebarContent}
        </Box>
      )}

      {/* Drawer for small screens */}
      {isSmallScreen && (
        <Drawer
          anchor={isArabic ? "right" : "left"}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Page Content */}
      <Box
        flex={1}
        ml={{ md: isArabic ? 0 : 35 }}
        mr={{ md: isArabic ? 35 : 0 }}
        p={3}
        sx={{
          overflowY: "auto",
          maxHeight: "calc(100vh - 80px)",
          pb: "100px",

          /* ==== Scrollbar Styles ==== */
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: theme.palette.mode === "dark" ? "#1f1f1f" : "#f0f0f0",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.mode === "dark" ? "#555" : "#aaa",
            borderRadius: "4px",
            border: "2px solid transparent",
            backgroundClip: "content-box",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: theme.palette.mode === "dark" ? "#777" : "#888",
          },
        }}
      >
        {isSmallScreen && (
          <Button
            variant="contained"
            onClick={() => setDrawerOpen(true)}
            sx={{ mb: 2, position: "fixed", top: 65, zIndex: 20 }}
          >
            {t("OpenOwnerDetails")}
          </Button>
        )}

        <Box
          sx={{
            position: "relative",
            width: "80%",
            margin: "auto",
            height: { xs: 220, md: 340 },
            borderRadius: 4,
            mb: 2,
            mt: { xs: 5, md: 0 },
            cursor: "pointer",
            overflow: "hidden",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => setSelectedImage(product.image_url)}
        >
          <Box
            component="img"
            src={product.image_url}
            alt={product.name}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s",
              transform: hovered ? "scale(1.05)" : "scale(1)",
            }}
          />
          {hovered && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                bgcolor: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                color: "#fff",
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              <ZoomInIcon fontSize="large" />
              {t("ViewImage")}
            </Box>
          )}
        </Box>

        <Typography variant="h5" fontWeight="bold">
          {product.name}
        </Typography>
        <Typography variant="h6" fontWeight="bold" color="primary" mt={1}>
          {t("price")}: {product.price} {t("pound")}
        </Typography>
        <Typography variant="body1" color="text.secondary" mt={2}>
          {product.description || "no description"}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" fontWeight="bold" mb={2}>
          <MessageIcon sx={{ fontSize: 16 }} /> {t("Comments")}
        </Typography>

        {comments.length === 0 ? (
          <Typography color="text.secondary">
            {t("Therearenocommentsyet")}
          </Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {comments.map((c) => (
              <Card key={c.id} sx={{ borderRadius: 3, boxShadow: "none",borderBottom:'2px solid #2222' }}>
                <CardContent
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "flex-start",
                    bgcolor: theme.palette.mode === "dark" ? "#161616ff" : "#edededff",
                    px: 2,
                  }}
                >
                  <Avatar
                    src={c.profiles?.avatar_url || "/default-avatar.png"}
                    sx={{ width: 40, height: 40 }}
                  />
                  <Box flex={1}>
                    <Typography fontWeight="bold">
                      {c.profiles?.full_name || "—"}
                    </Typography>
                    <Typography variant="body2" mt={0.5}>
                      {c.content}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
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

                {/* Fixed input at the bottom of the page */}
                <Box
                  sx={{
                    position: "fixed",
                    bottom: 0,
                    left: isSmallScreen ? 0 : isArabic ? "auto" : 280,
                    right: isSmallScreen ? 0 : isArabic ? 280 : "auto",
                    width: isSmallScreen ? "100%" : `calc(100% - 280px)`,
                    bgcolor: theme.palette.mode === "dark" ? "#2c2c2c" : "#f9f9f9",
                    borderTop: `1px solid ${theme.palette.divider}`,
                    p: 2,
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  <TextField
                    fullWidth
                    multiline
                    rows={1}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t("Writeyourcommenthere")}
                    sx={{
                      borderRadius: 3,
                      "& .MuiInputBase-root": {
                        borderRadius: 3,
                        boxShadow:
                          theme.palette.mode === "dark"
                            ? "0 1px 4px rgba(255,255,255,0.1)"
                            : "0 1px 4px rgba(0,0,0,0.1)",
                        padding: 1,
                        backgroundColor:
                          theme.palette.mode === "dark" ? "#3a3a3a" : "#fff",
                        color: theme.palette.text.primary,
                      },
                      "& .MuiInputBase-input": { fontSize: 14 },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.divider,
                      },
                    }}
                />
        <Button
          variant="contained"
          disabled={sending || !commentText.trim()}
          onClick={handleAddComment}
        >
          {t("send")}
        </Button>
      </Box>

      {/* View image in full size */}
      <Dialog
        open={Boolean(selectedImage)}
        onClose={() => setSelectedImage(null)}
        fullScreen
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
          alt="show image"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            bgcolor: "rgba(0,0,0,0.95)",
          }}
        />
      </Dialog>
    </Box>
  );
}
