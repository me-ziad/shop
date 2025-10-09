import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import {Box,Typography,Card,CardContent,Avatar,CircularProgress,IconButton,TextField,Snackbar,Alert,Divider,Dialog,DialogTitle,DialogContent,Button,Tooltip,useTheme,} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CommentIcon from "@mui/icons-material/Comment";
import SendIcon from "@mui/icons-material/Send";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import RemoveShoppingCartIcon from "@mui/icons-material/RemoveShoppingCart";
import { useTranslation } from "react-i18next";
import { alpha } from "@mui/material/styles";
import toast from "react-hot-toast";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";

export default function Cart() {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsMap, setCommentsMap] = useState({});
  const [commentTextMap, setCommentTextMap] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedProductForComments, setSelectedProductForComments] =
    useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Set the page title to "Cart" when the component mounts
  useEffect(() => {
    document.title = t("cart");
  }, []);

  // Fetch the current user and their cart items from the database
  useEffect(() => {
    const fetchUserAndCart = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) return;

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("cart_items")
        .select(
          `
        id,
        product_id,
        added_at,
        products (
          id,
          name,
          price,
          image_url,
          description,
          owner_id,
          profiles:products_owner_id_fkey (
            id,
            full_name,
            avatar_url
          )
        )
      `
        )
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });

      if (!error) setCartItems(data || []);
      setLoading(false);
    };

    fetchUserAndCart();
  }, []);

  // Remove a product from the user's cart
  const handleRemoveFromCart = async (itemId) => {
    await supabase.from("cart_items").delete().eq("id", itemId);
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    toast.success(t("Theproducthasbeenremovedfromthecart"));
  };

  // Open the comments modal for a specific product and fetch its comments if not already loaded
  const openCommentsModal = async (product) => {
    setSelectedProductForComments(product);

    if (!commentsMap[product.id]) {
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
        .eq("product_id", product.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setCommentsMap((prev) => ({ ...prev, [product.id]: data || [] }));
      }
    }
  };

  // Close the comments modal
  const closeCommentsModal = () => {
    setSelectedProductForComments(null);
  };

  // Add a new comment for a specific product
  const handleAddComment = async (productId) => {
    const text = commentTextMap[productId]?.trim();
    if (!text) return;

    const { error } = await supabase.from("comments").insert({
      content: text,
      product_id: productId,
      user_id: currentUserId,
    });

    if (!error) {
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
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      setCommentsMap((prev) => ({ ...prev, [productId]: data || [] }));
      setCommentTextMap((prev) => ({ ...prev, [productId]: "" }));
      toast.success(t("Yourcommenthasbeenadded"));
    }
  };

  // Delete a comment by its ID and update the local comments map
  const handleDeleteComment = async (commentId, productId) => {
    await supabase.from("comments").delete().eq("id", commentId);
    const updated = commentsMap[productId]?.filter((c) => c.id !== commentId);
    setCommentsMap((prev) => ({ ...prev, [productId]: updated }));
    toast.success(t("Thecommenthasbeendeleted"));
  };
  if (loading)
    return (
      <Box textAlign="center" mt={5}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box p={3}>
      <Typography variant="h5" mb={3} fontWeight="bold">
        🛒 {t("Yourbasket")}
      </Typography>

      {cartItems.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="300px" //   Suitable height for mediation
          gap={2}
        >
          <RemoveShoppingCartIcon
            sx={{
              fontSize: 64,
              color: theme.palette.mode === "dark" ? "#777" : "#ccc",
            }}
          />
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ color: theme.palette.text.secondary }}
          >
            {t("Therearenoproductsinthecart")}
          </Typography>
        </Box>
      ) : (
        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fill, minmax(320px, 1fr))"
          gap={3}
        >
          {cartItems.map((item) => {
            const product = item.products;

            return (
              <Card
                key={item.id}
                sx={{
                  [theme.breakpoints.down("sm")]: {
                    transform: isArabic
                      ? "translateX(5px)"
                      : "translateX(-5px)",
                  },
                  borderRadius: 4,
                  overflow: "hidden",
                  bgcolor: theme.palette.background.paper,
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 8px 20px rgba(0,0,0,0.4)"
                      : "0 8px 20px rgba(0,0,0,0.1)",
                  transition: "all 0.3s",
                  height: 500, //   Fixed length of the card
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 12px 30px rgba(0,0,0,0.6)"
                        : "0 12px 30px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <Box position="relative">
                  {/*   Product Image */}
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: 200,
                      cursor: "pointer",
                      overflow: "hidden",
                      borderRadius: 2,
                      "&:hover .overlay": {
                        opacity: 1,
                      },
                    }}
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
                        transition: "transform 0.3s ease",
                        "&:hover": {
                          transform: "scale(1.02)",
                        },
                      }}
                    />

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

                  {/*   Link to the product owner */}
                  <Box
                    onClick={() =>
                      navigate(`/profiledetails/${product.profiles?.id}`)
                    }
                    sx={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? alpha(theme.palette.background.default, 0.8)
                          : "rgba(255,255,255,0.9)",
                      p: "4px 10px",
                      borderRadius: 50,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      boxShadow: 2,
                      cursor: "pointer",
                      transition: "0.3s",
                      "&:hover": {
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? alpha(theme.palette.background.default, 1)
                            : "rgba(255,255,255,1)",
                        boxShadow: 3,
                      },
                    }}
                  >
                    <Avatar
                      src={product.profiles?.avatar_url}
                      sx={{ width: 28, height: 28 }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{ color: theme.palette.text.primary }}
                    >
                      {product.profiles?.full_name}
                    </Typography>
                  </Box>

                  {/*   Delete button */}
                  <IconButton
                    onClick={() => handleRemoveFromCart(item.id)}
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      bgcolor: theme.palette.mode === "dark" ? "#444" : "#fff",
                      boxShadow: 2,
                    }}
                  >
                    <DeleteIcon color="error" />
                  </IconButton>
                </Box>

                {/*   Product Details */}
                <CardContent
                  sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
                >
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{
                      mb: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {product.name?.split(" ").slice(0, 4).join(" ") +
                      (product.name?.split(" ").length > 4 ? "..." : "")}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
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
                      mb: 1,
                      color: theme.palette.text.secondary,
                      display: "-webkit-box",
                      WebkitLineClamp: 3, // Only three lines
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {product.description || "لا يوجد وصف"}
                  </Typography>

                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {product.price} {t("pound")}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/*Interaction icons are fixed at the end of the card */}
                  <Box display="flex" justifyContent="center" gap={2} mt="auto">
                    <Tooltip title="مراسلة صاحب المنتج">
                      <IconButton
                        sx={{
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "#3a3a3a"
                              : "#f5f5f5",
                          "&:hover": {
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? "#555"
                                : "#e0e0e0",
                          },
                        }}
                        onClick={() =>
                          navigate(`/message/${product.profiles?.id}`, {
                            state: { product },
                          })
                        }
                      >
                        <ChatBubbleOutlineIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="عرض التعليقات">
                      <IconButton
                        sx={{
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "#3a3a3a"
                              : "#f5f5f5",
                          "&:hover": {
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? "#555"
                                : "#e0e0e0",
                          },
                        }}
                        onClick={() => openCommentsModal(product)}
                      >
                        <CommentIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Modal Comments */}
      <Dialog
        open={!!selectedProductForComments}
        onClose={closeCommentsModal}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 20px 40px rgba(0,0,0,0.6)"
                : 10,
            bgcolor: theme.palette.background.paper,
            maxHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            position: "relative",
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
        {selectedProductForComments && (
          <>
            {/* Close button */}
            <IconButton
              onClick={closeCommentsModal}
              sx={{
                position: "absolute",
                top: 12,
                ...(i18n.language === "ar" ? { left: 12 } : { right: 12 }),

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

            {/* Product image outside the scroll */}
            <Box sx={{ px: { sm: 0, md: 6 }, pt: 1 }}>
              <Typography
                variant="h6"
                mb={2}
                mt={1}
                sx={{ color: theme.palette.text.primary }}
              >
                {t("Commentson")} : {selectedProductForComments.name}
              </Typography>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: { xs: 200, sm: 200, md: 240 },
                  mb: 2,
                  borderRadius: 3,
                  cursor: "pointer",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 4px 12px rgba(255,255,255,0.1)"
                      : "0 4px 12px rgba(0,0,0,0.1)",
                  overflow: "hidden",
                  "&:hover .overlay": {
                    opacity: 1,
                  },
                }}
                onClick={() =>
                  setSelectedImage(selectedProductForComments.image_url)
                }
              >
                <Box
                  component="img"
                  src={selectedProductForComments.image_url}
                  alt={selectedProductForComments.name}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.02)",
                    },
                  }}
                />

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
                  {t("Clicktoviewtheimage")}
                </Box>
              </Box>

              {/* full image screen  */}

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
            </Box>

            {/* Comments inside scroll */}
            <DialogContent
              sx={{
                px: 4,
                [theme.breakpoints.down("sm")]: { padding: 1 },
                pb: 2,
                overflowY: "auto",
                flex: 1,
              }}
            >
              {Array.isArray(commentsMap[selectedProductForComments?.id]) &&
              commentsMap[selectedProductForComments.id].length > 0 ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  {commentsMap[selectedProductForComments.id].map((c) => (
                    <Card
                      key={c.id}
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        bgcolor:
                          theme.palette.mode === "dark" ? "#2d2d2d" : "#fafafa",
                        px: 2,
                        py: 1,
                      }}
                    >
                      <CardContent sx={{ display: "flex", gap: 2, padding: 0 }}>
                        <IconButton
                          onClick={() =>
                            navigate(`/profiledetails/${c.profiles?.id}`)
                          }
                        >
                          <Avatar
                            src={
                              c.profiles?.avatar_url || "/default-avatar.png"
                            }
                          />
                        </IconButton>
                        <Box flex={1}>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{
                              cursor: "pointer",
                              color: theme.palette.text.primary,
                            }}
                            onClick={() =>
                              navigate(`/profiledetails/${c.profiles?.id}`)
                            }
                          >
                            {c.profiles?.full_name || "—"}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontSize: 13,
                            }}
                          >
                            {c.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.text.disabled,
                              fontSize: 11,
                            }}
                          >
                            {new Date(c.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                        {currentUserId === c.user_id && (
                          <IconButton
                            onClick={() =>
                              handleDeleteComment(
                                c.id,
                                selectedProductForComments.id
                              )
                            }
                          >
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ color: theme.palette.text.secondary }}>
                  {t("Therearenocommentsyet")}
                </Typography>
              )}
            </DialogContent>

            {/* Comment entry */}
            <Box
              sx={{
                px: { xs: 1, md: 4 },
                py: { xs: 1, md: 3 },
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  multiline
                  rows={1}
                  value={commentTextMap[selectedProductForComments.id] || ""}
                  onChange={(e) =>
                    setCommentTextMap((prev) => ({
                      ...prev,
                      [selectedProductForComments.id]: e.target.value,
                    }))
                  }
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
                  color="primary"
                  startIcon={<SendIcon sx={{ ml: isArabic ? 1.5 : 0 }} />}
                  sx={{
                    height: "fit-content",
                    alignSelf: "flex-start",
                    borderRadius: 2,
                  }}
                  disabled={
                    !commentTextMap[selectedProductForComments.id]?.trim()
                  }
                  onClick={() =>
                    handleAddComment(selectedProductForComments.id)
                  }
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
